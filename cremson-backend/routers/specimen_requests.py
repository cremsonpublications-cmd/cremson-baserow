from fastapi import APIRouter, Query, Request, Depends, BackgroundTasks, HTTPException
from typing import Optional, List
import asyncio
import json
import logging
from datetime import datetime
from pydantic import BaseModel
from services.baserow import BaserowClient
from config import TABLE_IDS
from routers.auth import current_user
from services.shipway import create_shipment

logger = logging.getLogger(__name__)

router = APIRouter()
client = BaserowClient()


class SpecimenStatusUpdate(BaseModel):
    status: str


class AdminCreateSpecimenRequest(BaseModel):
    teacher_id: Optional[int] = None
    teacher_name: str
    school_name: str
    phone: str
    email: Optional[str] = ""
    full_address: str
    city: Optional[str] = ""
    pincode: Optional[str] = ""
    books_requested: List[str]
    feedback_notes: Optional[str] = ""
    dispatch_immediately: bool = True


async def _resolve_specimen_names(rows: list):
    """Resolve School Name lookup values (which show autonumber IDs) to actual school names.
    Teacher names are already present in TeacherID[].value from Baserow."""
    school_ids = set()
    for row in rows:
        # Collect from SchoolID link-row field
        for s in row.get("SchoolID", []):
            if isinstance(s, dict):
                sid = s.get("ids", {}).get("database_table_876") or s.get("id")
                if sid:
                    school_ids.add(int(sid))
        # Collect from School Name lookup field (same ids structure)
        for s in row.get("School Name", []):
            if isinstance(s, dict):
                sid = s.get("ids", {}).get("database_table_876") or s.get("id")
                if sid:
                    school_ids.add(int(sid))

    if not school_ids:
        return

    async def fetch_school(sid):
        try:
            r = await client.get_row(TABLE_IDS["school"], sid)
            return sid, r.get("SchoolName", "")
        except Exception:
            return sid, ""

    school_names = dict(await asyncio.gather(*[fetch_school(sid) for sid in school_ids]))

    for row in rows:
        # Patch both "School Name" lookup array and "SchoolID" link array
        for field in ("School Name", "SchoolID"):
            for s in row.get(field, []):
                if isinstance(s, dict):
                    sid = s.get("ids", {}).get("database_table_876") or s.get("id")
                    if sid and int(sid) in school_names:
                        s["value"] = school_names[int(sid)]


@router.get("/", summary="List specimen requests")
async def list_specimen_requests(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
):
    """Return a paginated list of specimen requests from Baserow."""
    filters = {k: v for k, v in request.query_params.items() if k not in ["page", "size", "search"] and v}
    res = await client.get_rows(
        TABLE_IDS["specimen_requests"],
        page=page,
        size=size,
        search=search,
        filters=filters,
        order_by="-SpecimenID",
    )
    await _resolve_specimen_names(res.get("results", []))
    return res


@router.get("/{row_id}", summary="Get a single specimen request")
async def get_specimen_request(row_id: int):
    """Return a single specimen request by Baserow row ID."""
    row = await client.get_row(TABLE_IDS["specimen_requests"], row_id)
    await _resolve_specimen_names([row])
    return row


@router.post("/", summary="Create specimen request")
async def create_specimen_request(body: dict, user: dict = Depends(current_user)):
    role = user.get("role", "customer")
    if role == "teacher" and not body.get("TeacherID"):
        try:
            # Query teacher CRM table (877) by user's email to get teacher record ID
            teacher_res = await client.get_rows(TABLE_IDS["teacher"], filters={"Email": user["email"].lower().strip()})
            t_rows = teacher_res.get("results", [])
            if t_rows:
                body["TeacherID"] = [t_rows[0]["id"]]
        except Exception as e:
            print("Warning: Failed to auto-link teacher profile to specimen request:", e)
            
    return await client.create_row(TABLE_IDS["specimen_requests"], body)


@router.patch("/{row_id}", summary="Update specimen request")
async def update_specimen_request(row_id: int, body: dict):
    return await client.update_row(TABLE_IDS["specimen_requests"], row_id, body)


import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def _extract_val(field):
    if not field:
        return ""
    if isinstance(field, list) and len(field) > 0:
        item = field[0]
        if isinstance(item, dict):
            val = item.get("value")
            if val is not None and str(val).strip():
                return str(val).strip()
            return ""
        return str(item).strip()
    if isinstance(field, dict):
        val = field.get("value")
        if val is not None and str(val).strip():
            return str(val).strip()
        return ""
    return str(field).strip()


@router.patch("/{row_id}/approve", summary="Approve specimen request")
async def approve_specimen_request(row_id: int):
    """
    Approve specimen request:
    1. Resolve teacher, address, and product catalog info
    2. Attempt Shipway shipment creation FIRST
    3. If Shipway fails (e.g. Insufficient wallet balance or invalid address), raise HTTP 400 error and DO NOT mark as Dispatched
    4. If Shipway succeeds, mark DeliveryStatus as Dispatched, save order in Table 762, and notify teacher via WhatsApp
    """
    specimen_row = await client.get_row(TABLE_IDS["specimen_requests"], row_id)
    await _resolve_specimen_names([specimen_row])

    teacher_name = _extract_val(specimen_row.get("Teacheer Name"))
    email = _extract_val(specimen_row.get("Email"))
    phone = _extract_val(specimen_row.get("Phone"))
    school_name = _extract_val(specimen_row.get("School Name"))
    city = _extract_val(specimen_row.get("City"))
    pincode = _extract_val(specimen_row.get("PinCode"))
    full_address = specimen_row.get("Full_Address") or ""
    books_requested = specimen_row.get("BooksRequested") or ""

    # Fetch linked teacher row from Table 877 if details are missing
    teacher_ids = specimen_row.get("TeacherID") or []
    if teacher_ids and isinstance(teacher_ids, list) and len(teacher_ids) > 0:
        t_item = teacher_ids[0]
        tid = t_item.get("id") if isinstance(t_item, dict) else t_item
        if tid:
            try:
                t_row = await client.get_row(TABLE_IDS["teacher"], tid)
                if not teacher_name:
                    teacher_name = t_row.get("Teacher Name") or ""
                if not phone:
                    phone = t_row.get("Whatsapp Phone") or t_row.get("Phone") or ""
                if not email:
                    email = t_row.get("Email") or ""
                if not school_name:
                    school_name = _extract_val(t_row.get("School Name"))
                if not city:
                    city = _extract_val(t_row.get("Lookup")) or t_row.get("City") or ""
                if not pincode:
                    pincode = t_row.get("Pin Code") or ""
            except Exception as ex:
                logger.warning(f"Could not fetch teacher row {tid}: {ex}")

    if not pincode and full_address:
        import re
        pmatch = re.search(r'\b[1-9][0-9]{5}\b', full_address)
        if pmatch:
            pincode = pmatch.group(0)

    # Fetch products catalog from Table 763 to match exact products, weights, and product IDs for Shipway
    catalog_products = []
    try:
        p_res = await client.get_rows(TABLE_IDS["products"], size=200)
        catalog_products = p_res.get("results", [])
    except Exception as p_err:
        logger.warning(f"Failed to fetch products catalog for specimen matching: {p_err}")

    import re

    def _clean_book_name(name: str) -> str:
        s = re.sub(r'\(.*?\)', '', name).strip()
        return re.sub(r'\s+', ' ', s).lower()

    books_list = [b.strip() for b in books_requested.split(",") if b.strip()]
    if not books_list:
        raise HTTPException(
            status_code=400,
            detail="No books specified in specimen request. Please select valid books from the website."
        )

    items = []

    for bname in books_list:
        matched_p = None
        cbname = _clean_book_name(bname)

        # 1. Exact or clean string match
        for p in catalog_products:
            p_name = (p.get("name") or "").strip()
            if not p_name:
                continue
            cpname = _clean_book_name(p_name)
            if cpname == cbname or cbname in cpname or cpname in cbname:
                matched_p = p
                break

        # 2. Token overlap match if fuzzy
        if not matched_p:
            b_tokens = set(cbname.split())
            best_score = 0
            for p in catalog_products:
                p_name = (p.get("name") or "").strip()
                if not p_name:
                    continue
                cpname = _clean_book_name(p_name)
                p_tokens = set(cpname.split())
                overlap = len(b_tokens.intersection(p_tokens))
                if overlap > best_score and overlap >= 2:
                    best_score = overlap
                    matched_p = p

        if matched_p:
            items.append({
                "productId": matched_p.get("id"),
                "name": matched_p.get("name"),
                "author": matched_p.get("author") or "Cremson Publications",
                "weight": matched_p.get("weight") or "0.5kg",
                "image": matched_p.get("main_image") or "",
                "quantity": 1,
                "currentPrice": 0,
                "totalPrice": 0
            })
        else:
            items.append({
                "productId": 0,
                "name": re.sub(r'\(.*?\)', '', bname).strip(),
                "author": "Cremson Publications",
                "weight": "0.5kg",
                "quantity": 1,
                "currentPrice": 0,
                "totalPrice": 0
            })

    order_id = f"SPEC-{row_id}"
    today_str = datetime.now().strftime("%Y-%m-%d")

    items_desc = ", ".join((i.get("name") or "Book") for i in items)

    shipway_payload = {
        "order_id": order_id,
        "order_date": today_str,
        "total_amount": 0.0,
        "items": items,
        "items_description": items_desc,
        "customer_name": teacher_name or "Verified Teacher",
        "customer_email": email or "",
        "customer_phone": phone or "",
        "address": full_address or school_name or "School Campus",
        "address2": school_name or "",
        "city": city or "New Delhi",
        "state": "Delhi",
        "pincode": pincode or "110001",
    }

    # Step 1: Attempt Shipway shipment creation FIRST
    shipway_res = await create_shipment(shipway_payload)

    if not shipway_res.get("success"):
        err_msg = shipway_res.get("error") or "Shipway shipment failed"
        logger.error(f"[Specimen Approval] Shipway shipment failed for specimen #{row_id}: {err_msg}")
        raise HTTPException(
            status_code=400,
            detail=f"Approval Failed: {err_msg}. Please top up your Shipway wallet balance or verify address details."
        )

    # Step 2: Shipway succeeded! Extract AWB, courier, tracking URL, and label URL
    awb = shipway_res.get("awb", "")
    courier = shipway_res.get("courier_name", "")
    tracking_url = shipway_res.get("tracking_url", "")
    label_url = shipway_res.get("label_url", "")
    shipment_id = shipway_res.get("shipment_id", "")

    # Step 3: Update specimen request in Table 878 to Dispatched
    result = await client.update_row(
        TABLE_IDS["specimen_requests"],
        row_id,
        {
            "DeliveryStatus": "Dispatched",
            "AWB_Number": awb,
            "Courier_Partner": courier,
            "TrackingLink": tracking_url,
        },
    )

    # Step 4: Save created order into Orders Table 762
    user_info = {
        "name": teacher_name or "Verified Teacher",
        "email": email or "",
        "phone": phone or "",
        "address": {
            "street": full_address or school_name or "School Campus",
            "apartment": school_name or "",
            "city": city or "New Delhi",
            "state": "Delhi",
            "pincode": pincode or "110001",
            "country": "India"
        }
    }

    order_summary = {
        "subTotal": 0,
        "grandTotal": 0,
        "discountTotal": 0,
        "couponDiscount": 0,
        "deliveryCharge": 0
    }

    payment = {
        "amount": 0,
        "method": "SPECIMEN (Free)",
        "status": "Specimen Copy",
        "transactionId": order_id
    }

    delivery = {
        "name": teacher_name or "Verified Teacher",
        "email": email or "",
        "phone": phone or "",
        "address": full_address or school_name or "School Campus",
        "address2": school_name or "",
        "city": city or "New Delhi",
        "state": "Delhi",
        "pincode": pincode or "110001",
        "notes": f"Specimen Request #{row_id} - Approved for Teacher",
        "status": "Confirmed",
        "shipment_id": shipment_id,
        "awb": awb,
        "courier": courier,
        "tracking_url": tracking_url,
        "label_url": label_url,
    }

    order_record = {
        "order_id": order_id,
        "order_status": "READY_TO_PACK",
        "order_date": today_str,
        "user_info": json.dumps(user_info),
        "items": json.dumps(items),
        "order_summary": json.dumps(order_summary),
        "payment": json.dumps(payment),
        "delivery": json.dumps(delivery),
        "shipment_id": shipment_id,
        "awb": awb,
        "courier": courier,
        "tracking_url": tracking_url,
        "label_url": label_url,
    }

    existing_orders = await client.get_rows(TABLE_IDS["orders"], filters={"order_id": order_id})
    if not existing_orders.get("results"):
        await client.create_row(TABLE_IDS["orders"], order_record)
    else:
        existing_id = existing_orders["results"][0].get("id")
        await client.update_row(TABLE_IDS["orders"], existing_id, order_record)

    # Step 5: Send WhatsApp Notification ONLY with valid AWB & tracking link!
    if phone and awb:
        try:
            from services.whatsapp import send_shipment_created
            await send_shipment_created(
                phone=phone,
                customer_name=teacher_name or "Teacher",
                order_id=order_id,
                awb=awb,
                courier_name=courier,
                tracking_url=tracking_url,
            )
        except Exception as wa_err:
            logger.error(f"[Specimen Approval] WhatsApp send_shipment_created error: {wa_err}")

    return result


@router.patch("/{row_id}/reject", summary="Reject specimen request")
async def reject_specimen_request(row_id: int):
    """Set DeliveryStatus to RTO (rejected/returned)."""
    result = await client.update_row(
        TABLE_IDS["specimen_requests"],
        row_id,
        {"DeliveryStatus": "RTO"},
    )
    return result


@router.delete("/{row_id}", summary="Delete specimen request")
async def delete_specimen_request(row_id: int):
    await client.delete_row(TABLE_IDS["specimen_requests"], row_id)
    return {"message": "Specimen request deleted successfully"}


@router.post("/admin-create", summary="Admin manually create specimen request for a teacher")
async def admin_create_specimen_request(body: AdminCreateSpecimenRequest):
    """
    Manually create a specimen request by Admin on behalf of a teacher.
    Does not require teacher login or password.
    If dispatch_immediately is True, it triggers Shipway shipment creation immediately.
    """
    if body.pincode:
        p_str = str(body.pincode).strip()
        if not (p_str.isdigit() and len(p_str) == 6):
            raise HTTPException(status_code=400, detail="Pincode must be exactly 6 digits.")

    if body.phone:
        p_clean = "".join(filter(str.isdigit, str(body.phone)))
        if len(p_clean) == 12 and p_clean.startswith("91"):
            p_clean = p_clean[2:]
        if len(p_clean) != 10:
            raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits.")

    today_str = datetime.now().strftime("%Y-%m-%d")
    books_str = ", ".join(body.books_requested) if isinstance(body.books_requested, list) else str(body.books_requested)

    teacher_id = body.teacher_id

    # If no teacher_id was passed, check if teacher exists by phone in Table 877
    if not teacher_id and body.phone:
        try:
            search_res = await client.get_rows(TABLE_IDS["teacher"], search=body.phone)
            results = search_res.get("results", [])
            if results:
                teacher_id = results[0]["id"]
        except Exception as err:
            logger.warning(f"[Admin Create Specimen] Teacher search by phone failed: {err}")

    # If still no teacher_id, create a new teacher row in Table 877 so lookups work
    if not teacher_id:
        t_data = {
            "Teacher Name": body.teacher_name,
            "Whatsapp Phone": body.phone,
            "Email": body.email or "",
            "Residence": body.full_address or "",
            "City": body.city or "",
            "Status": "Approved",
        }
        if body.pincode:
            try:
                t_data["Pin Code"] = int(body.pincode)
            except Exception:
                pass
        try:
            new_teacher = await client.create_row(TABLE_IDS["teacher"], t_data)
            teacher_id = new_teacher.get("id")
        except Exception as err:
            logger.error(f"[Admin Create Specimen] Failed to create teacher in Table 877: {err}")

    # Build row data for Table 878 (Only writable fields, NO lookup fields!)
    row_data = {
        "BooksRequested": books_str,
        "Feedback/Notes": body.feedback_notes or "Created by Admin",
        "RequestDate": today_str,
        "DeliveryStatus": "Not dispatched",
        "Full_Address": body.full_address,
    }

    if teacher_id:
        row_data["TeacherID"] = [teacher_id]

    # 1. Create specimen request row in Table 878
    created_row = await client.create_row(TABLE_IDS["specimen_requests"], row_data)
    row_id = created_row.get("id")

    dispatched = False
    approval_result = None

    # 2. If dispatch_immediately is requested, attempt atomic approval & shipment creation
    if body.dispatch_immediately and row_id:
        try:
            approval_result = await approve_specimen_request(row_id)
            dispatched = True
        except Exception as err:
            logger.error(f"[Admin Create Specimen] Immediate dispatch failed for #{row_id}: {err}")
            return {
                "message": f"Specimen request #{row_id} created, but immediate dispatch failed: {str(err)}",
                "id": row_id,
                "dispatched": False,
                "warning": str(err),
            }

    return {
        "message": f"Specimen request #{row_id} created successfully" + (" and dispatched!" if dispatched else " as pending."),
        "id": row_id,
        "dispatched": dispatched,
        "details": approval_result,
    }


