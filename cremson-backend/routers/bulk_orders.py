"""
Bulk Order System — FastAPI Router
Handles bulk order creation (no auth), admin approval, split payments, and shipping.
Uses Baserow Table 767.
"""
import os
import uuid
import json
import base64
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

import httpx
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from services.baserow import BaserowClient
from services.whatsapp import (
    send_bulk_order_received,
    send_bulk_order_admin_notify,
    send_bulk_order_approved,
    send_bulk_order_payment_received,
    send_bulk_order_shipped,
)
from services.shipway import create_shipment
from config import TABLE_IDS, WHATSAPP_MAIN_PHONE
from services.email import (
    send_bulk_order_received_email,
    send_bulk_order_approved_email,
    send_bulk_order_payment_received_email,
    send_bulk_order_shipped_email,
)

logger = logging.getLogger(__name__)
router = APIRouter()
client = BaserowClient()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_API = "https://api.razorpay.com/v1"
SITE_URL = os.getenv("SITE_URL", "https://cremsonpublications.com")


def _razorpay_auth() -> str:
    token = base64.b64encode(f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode()).decode()
    return f"Basic {token}"


# ── Schemas ────────────────────────────────────────────────────────────────────

class BulkOrderItem(BaseModel):
    product_id: int
    title: str
    qty: int
    price: float


class BulkOrderCreate(BaseModel):
    contact_name: str
    school_name: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str
    email: Optional[str] = None
    items: List[BulkOrderItem]


class BulkOrderApprove(BaseModel):
    discount_type: Optional[str] = "percentage"   # "percentage" or "fixed"
    discount_value: Optional[float] = 0
    admin_notes: Optional[str] = ""


class SplitPaymentCreate(BaseModel):
    split_count: int         # Number of students
    student_names: Optional[List[str]] = []   # Optional names per student


class InitiateStudentPayment(BaseModel):
    student_name: str
    student_phone: str


# ── Helpers ────────────────────────────────────────────────────────────────────

def _calc_final_amount(subtotal: float, discount_type: str, discount_value: float) -> float:
    if discount_type == "percentage":
        disc = (subtotal * discount_value) / 100
    else:
        disc = discount_value
    return max(0, round(subtotal - disc, 2))


def _to_paise(amount: float) -> int:
    return int(round(amount * 100))


async def _razorpay_create_order(amount_inr: float, receipt: str) -> dict:
    async with httpx.AsyncClient(timeout=20) as http:
        resp = await http.post(
            f"{RAZORPAY_API}/orders",
            headers={"Authorization": _razorpay_auth(), "Content-Type": "application/json"},
            json={"amount": _to_paise(amount_inr), "currency": "INR", "receipt": receipt},
        )
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail=f"Razorpay error: {resp.text}")
        return resp.json()


def _normalize_bulk_row(row: dict) -> dict:
    if not row:
        return {}

    notes_raw = row.get("Notes", "")
    data = {}
    if notes_raw and isinstance(notes_raw, str):
        try:
            data = json.loads(notes_raw)
        except Exception:
            data = {}

    token = row.get("Name") or data.get("token") or ""
    contact_name = row.get("full_name") or data.get("contact_name") or ""
    school_name = row.get("school_name") or data.get("school_name") or ""
    phone = row.get("whatsapp_number") or data.get("phone") or ""
    address = row.get("address_line_1") or data.get("address") or ""
    city = row.get("town_city") or data.get("city") or ""
    state = row.get("state_region") or data.get("state") or ""
    pincode = row.get("post_code") or data.get("pincode") or ""
    status = row.get("status") or data.get("status") or "pending_review"
    admin_notes = row.get("admin_notes") or data.get("admin_notes") or ""

    items = data.get("items", [])
    if isinstance(items, str):
        try: items = json.loads(items)
        except: items = []

    student_payments = data.get("student_payments", [])
    if isinstance(student_payments, str):
        try: student_payments = json.loads(student_payments)
        except: student_payments = []

    bulk_id = data.get("order_id") or f"CPS{26000 + int(row.get('id', 1))}"

    return {
        "id": row.get("id"),
        "order_id": bulk_id,
        "token": token,
        "contact_name": contact_name,
        "school_name": school_name,
        "phone": phone,
        "address": address,
        "city": city,
        "state": state,
        "pincode": pincode,
        "items": items,
        "subtotal": float(data.get("subtotal", 0)),
        "discount_type": data.get("discount_type", "percentage"),
        "discount_value": float(data.get("discount_value", 0)),
        "final_amount": float(data.get("final_amount", data.get("subtotal", 0))),
        "split_count": int(data.get("split_count", 0)),
        "paid_count": int(data.get("paid_count", 0)),
        "status": status,
        "admin_notes": admin_notes,
        "student_payments": student_payments,
        "razorpay_order_id": data.get("razorpay_order_id"),
        "razorpay_payment_id": data.get("razorpay_payment_id"),
        "shipway_awb": data.get("shipway_awb"),
        "order_date": data.get("order_date") or row.get("created_at"),
        "approved_at": data.get("approved_at"),
        # Returns & Refunds fields
        "return_status": data.get("return_status"),
        "return_reason": data.get("return_reason"),
        "return_notes": data.get("return_notes"),
        "reverse_awb": data.get("reverse_awb"),
        "reverse_tracking_url": data.get("reverse_tracking_url"),
        "refund_status": data.get("refund_status"),
        "refund_amount": data.get("refund_amount"),
        "refund_id": data.get("refund_id"),
        "refunded_at": data.get("refunded_at"),
        "label_url": data.get("label_url"),
    }


async def _save_bulk_data(row_id: int, obj: dict):
    payload = {
        "Name": obj["token"],
        "full_name": obj["contact_name"],
        "school_name": obj["school_name"],
        "whatsapp_number": obj["phone"],
        "address_line_1": obj["address"],
        "town_city": obj["city"],
        "state_region": obj["state"],
        "post_code": obj["pincode"],
        "status": obj["status"],
        "admin_notes": obj.get("admin_notes", ""),
        "Active": True,
        "Notes": json.dumps(obj),
    }
    return await client.update_row(TABLE_IDS["bulk_orders"], row_id, payload)


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/", summary="Submit a new bulk order (no auth required)")
async def create_bulk_order(body: BulkOrderCreate, bg: BackgroundTasks):
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

    token = str(uuid.uuid4())
    subtotal = round(sum(item.price * item.qty for item in body.items), 2)
    items_list = [i.model_dump() for i in body.items]

    obj = {
        "token": token,
        "contact_name": body.contact_name,
        "school_name": body.school_name,
        "phone": body.phone,
        "address": body.address,
        "city": body.city,
        "state": body.state,
        "pincode": body.pincode,
        "items": items_list,
        "subtotal": subtotal,
        "discount_type": "percentage",
        "discount_value": 0,
        "final_amount": subtotal,
        "split_count": 0,
        "paid_count": 0,
        "status": "pending_review",
        "student_payments": [],
        "order_date": datetime.utcnow().isoformat(),
    }

    # Generate sequential Bulk Order ID (CPS26001, CPS26002...)
    start_seq = 26001
    try:
        cps_res = await client.get_rows(TABLE_IDS["bulk_orders"], search="CPS26", size=200)
        cps_results = cps_res.get("results", [])
        max_num = start_seq - 1
        import re
        pattern = re.compile(r"^CPS(\d+)$", re.IGNORECASE)
        for r in cps_results:
            notes_raw = r.get("Notes") or ""
            oid = ""
            if isinstance(notes_raw, str) and notes_raw.strip():
                try:
                    notes_data = json.loads(notes_raw)
                    oid = notes_data.get("order_id") or ""
                except Exception:
                    pass
            m = pattern.match(oid)
            if m:
                num = int(m.group(1))
                if num > max_num:
                    max_num = num
        obj["order_id"] = f"CPS{max_num + 1}"
    except Exception as e:
        logger.warning(f"Error generating CPS bulk order_id: {e}")
        obj["order_id"] = f"CPS{start_seq}"

    row = await client.create_row(TABLE_IDS["bulk_orders"], {
        "Name": token,
        "full_name": body.contact_name,
        "school_name": body.school_name,
        "whatsapp_number": body.phone,
        "address_line_1": body.address,
        "town_city": body.city,
        "state_region": body.state,
        "post_code": body.pincode,
        "status": "pending_review",
        "Active": True,
        "Notes": json.dumps(obj),
    })

    order_link = f"{SITE_URL}/bulk-order/{token}"

    bg.add_task(
        send_bulk_order_received,
        phone=body.phone,
        name=body.contact_name,
        school=body.school_name,
        order_link=order_link,
    )
    if body.email:
        bg.add_task(
            send_bulk_order_received_email,
            to_email=body.email,
            name=body.contact_name,
            school=body.school_name,
            order_link=order_link,
        )
    bg.add_task(
        send_bulk_order_admin_notify,
        admin_phone=WHATSAPP_MAIN_PHONE,
        name=body.contact_name,
        school=body.school_name,
        total=subtotal,
        order_link=f"{SITE_URL}/admin/bulk-orders",
    )

    return {"success": True, "token": token, "order_link": order_link, "id": row["id"]}


@router.get("/", summary="List all bulk orders (admin)")
async def list_bulk_orders(page: int = 1, size: int = 50, search: str = None):
    data = await client.get_rows(TABLE_IDS["bulk_orders"], page=page, size=size, search=search)
    raw_rows = data.get("results", data.get("items", []))
    
    # Filter rows that are valid bulk orders (have token in Name or Notes)
    normalized = []
    for r in raw_rows:
        norm = _normalize_bulk_row(r)
        if norm.get("token"):
            normalized.append(norm)

    # Sort latest orders (highest row ID / newest) first
    normalized.sort(key=lambda x: int(x.get("id") or 0), reverse=True)

    return {"count": len(normalized), "results": normalized}


@router.get("/by-phone/{phone}", summary="Get all bulk orders for a phone number (user)")
async def get_bulk_orders_by_phone(phone: str):
    """Return all bulk orders associated with a given phone number, sorted newest first."""
    # Normalize phone
    p_clean = "".join(filter(str.isdigit, phone))
    if len(p_clean) == 12 and p_clean.startswith("91"):
        p_clean = p_clean[2:]

    data = await client.get_rows(TABLE_IDS["bulk_orders"], size=200, search=p_clean)
    raw_rows = data.get("results", data.get("items", []))

    results = []
    for r in raw_rows:
        norm = _normalize_bulk_row(r)
        # Match phone in both the top-level phone field and inside Notes JSON
        row_phone = "".join(filter(str.isdigit, norm.get("phone", "")))
        if len(row_phone) == 12 and row_phone.startswith("91"):
            row_phone = row_phone[2:]
        if row_phone == p_clean:
            results.append(norm)

    results.sort(key=lambda x: int(x.get("id") or 0), reverse=True)
    return {"count": len(results), "results": results}


@router.get("/{token}", summary="Get a bulk order by token (public)")
async def get_bulk_order(token: str):
    data = await client.get_rows(TABLE_IDS["bulk_orders"], size=100, search=token)
    raw_rows = data.get("results", data.get("items", []))
    
    for r in raw_rows:
        norm = _normalize_bulk_row(r)
        if norm.get("token") == token:
            return norm

    raise HTTPException(status_code=404, detail="Bulk order not found")


@router.patch("/{row_id}/approve", summary="Admin approves bulk order + sets discount")
async def approve_bulk_order(row_id: int, body: BulkOrderApprove, bg: BackgroundTasks):
    row = await client.get_row(TABLE_IDS["bulk_orders"], row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Bulk order not found")

    norm = _normalize_bulk_row(row)
    subtotal = norm.get("subtotal", 0)
    final_amount = _calc_final_amount(subtotal, body.discount_type, body.discount_value)

    norm["status"] = "approved"
    norm["discount_type"] = body.discount_type
    norm["discount_value"] = body.discount_value
    norm["final_amount"] = final_amount
    norm["admin_notes"] = body.admin_notes or ""
    norm["approved_at"] = datetime.utcnow().isoformat()

    await _save_bulk_data(row_id, norm)

    order_link = f"{SITE_URL}/bulk-order/{norm['token']}"
    bg.add_task(
        send_bulk_order_approved,
        phone=norm["phone"],
        name=norm["contact_name"],
        subtotal=subtotal,
        discount_type=body.discount_type,
        discount_value=body.discount_value,
        final_amount=final_amount,
        order_link=order_link,
        school=norm["school_name"],
    )
    if norm.get("email"):
        bg.add_task(
            send_bulk_order_approved_email,
            to_email=norm["email"],
            name=norm["contact_name"],
            school=norm["school_name"],
            total=final_amount,
            payment_link=order_link,
        )

    return norm


@router.post("/{token}/create-payment", summary="Teacher pays full amount — create Razorpay order")
async def create_full_payment(token: str):
    norm = await get_bulk_order(token)
    if norm.get("status") != "approved":
        raise HTTPException(status_code=400, detail="Order is not approved yet")

    final_amount = norm.get("final_amount", 0)
    rz_order = await _razorpay_create_order(final_amount, f"bulk_{norm['id']}")

    norm["razorpay_order_id"] = rz_order["id"]
    await _save_bulk_data(norm["id"], norm)

    return {
        "razorpay_order_id": rz_order["id"],
        "amount": rz_order["amount"],
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
        "contact_name": norm.get("contact_name", ""),
        "phone": norm.get("phone", ""),
    }


@router.post("/{token}/split", summary="Generate split payment configuration")
async def create_split_payment(token: str, body: SplitPaymentCreate):
    if body.split_count < 2:
        raise HTTPException(status_code=400, detail="Split count must be at least 2")

    norm = await get_bulk_order(token)
    if norm.get("status") not in ["approved", "partially_paid"]:
        raise HTTPException(status_code=400, detail="Order is not approved yet")

    final_amount = norm.get("final_amount", 0)
    per_student = round(final_amount / body.split_count, 2)

    norm["split_count"] = body.split_count
    norm["paid_count"] = 0
    norm["student_payments"] = []
    await _save_bulk_data(norm["id"], norm)

    site = SITE_URL
    return {
        "split_count": body.split_count,
        "per_student_amount": per_student,
        "pay_link": f"{site}/bulk-order/{token}/pay",
    }


@router.post("/{token}/initiate-student-payment", summary="Dynamically register student and create Razorpay order")
async def initiate_student_payment(token: str, body: InitiateStudentPayment):
    norm = await get_bulk_order(token)
    if norm.get("status") not in ["approved", "partially_paid"]:
        raise HTTPException(status_code=400, detail="Order is not open for payments")

    split_count = int(norm.get("split_count", 0))
    if split_count < 2:
        raise HTTPException(status_code=400, detail="Order split not initialized")

    final_amount = norm.get("final_amount", 0)
    per_student = round(final_amount / split_count, 2)

    students = norm.get("student_payments", [])
    paid_students = [s for s in students if s.get("paid")]
    if len(paid_students) >= split_count:
        raise HTTPException(status_code=400, detail="All split payments for this order have already been completed")

    student_token = str(uuid.uuid4())
    new_student = {
        "student_token": student_token,
        "name": body.student_name,
        "phone": body.student_phone,
        "amount": per_student,
        "paid": False,
        "razorpay_payment_id": None,
    }
    students.append(new_student)
    norm["student_payments"] = students
    await _save_bulk_data(norm["id"], norm)

    rz_order = await _razorpay_create_order(
        per_student,
        f"bulk_{norm['id']}_s_{student_token[:8]}"
    )

    return {
        "razorpay_order_id": rz_order["id"],
        "amount": rz_order["amount"],
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
        "student_name": body.student_name,
        "bulk_order_token": token,
        "student_token": student_token,
    }


@router.post("/{token}/student-payment/{student_token}", summary="Create Razorpay order for a student")
async def create_student_payment(token: str, student_token: str):
    norm = await get_bulk_order(token)
    students = norm.get("student_payments", [])
    student = next((s for s in students if s.get("student_token") == student_token), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student payment link not found")
    if student.get("paid"):
        raise HTTPException(status_code=400, detail="Already paid")

    rz_order = await _razorpay_create_order(
        student["amount"],
        f"bulk_{norm['id']}_s_{student_token[:8]}"
    )

    return {
        "razorpay_order_id": rz_order["id"],
        "amount": rz_order["amount"],
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
        "student_name": student.get("name", ""),
        "bulk_order_token": token,
        "student_token": student_token,
    }


async def _auto_ship_bulk_order(row_id: int):
    try:
        row = await client.get_row(TABLE_IDS["bulk_orders"], row_id)
        if not row:
            return
        norm = _normalize_bulk_row(row)

        items = norm.get("items", [])
        item_count = sum(i.get("qty", 1) for i in items)

        shipment_data = {
            "customer_name": norm.get("contact_name", "Teacher"),
            "customer_phone": norm.get("phone", ""),
            "customer_email": "info@cremsonpublications.com",
            "address": norm.get("address", "School Address"),
            "city": norm.get("city", "Chennai"),
            "state": norm.get("state", "Tamil Nadu"),
            "pincode": norm.get("pincode", ""),
            "order_id": norm.get("order_id") or f"CPS{26000 + row_id}",
            "items_description": f"{norm.get('school_name', 'Bulk')} - {item_count} items",
            "item_count": item_count,
            "total_amount": float(norm.get("final_amount", 0)),
            "items": items,
        }

        result = await create_shipment(shipment_data)
        if result.get("success") and result.get("awb"):
            awb = str(result.get("awb"))

            norm["status"] = "shipped"
            norm["shipway_awb"] = awb
            await _save_bulk_data(row_id, norm)

            order_link = f"{SITE_URL}/bulk-order/{norm['token']}"

            await send_bulk_order_shipped(
                phone=norm["phone"],
                name=norm["contact_name"],
                school=norm["school_name"],
                awb=awb,
                tracking_link=f"https://shipway.in/track/{awb}",
                order_link=order_link,
            )
            if norm.get("email"):
                try:
                    await send_bulk_order_shipped_email(
                        to_email=norm["email"],
                        name=norm["contact_name"],
                        school=norm["school_name"],
                        awb=awb,
                        tracking_link=f"https://shipway.in/track/{awb}",
                        order_link=order_link,
                    )
                except Exception as mail_err:
                    logger.error(f"[BulkOrder] Auto-ship Email failed: {mail_err}")
            logger.info(f"[BulkOrder] Auto-shipped order row {row_id} with AWB {awb}")
        else:
            logger.error(f"[BulkOrder] Auto-ship Shipway creation failed for row {row_id}: {result.get('error')}")
    except Exception as e:
        logger.error(f"[BulkOrder] Auto-ship error for row {row_id}: {e}")


@router.post("/{token}/verify-payment", summary="Verify Razorpay payment (teacher or student)")
async def verify_bulk_payment(token: str, body: dict, bg: BackgroundTasks):
    import hmac, hashlib

    razorpay_order_id = body.get("razorpay_order_id", "")
    razorpay_payment_id = body.get("razorpay_payment_id", "")
    razorpay_signature = body.get("razorpay_signature", "")
    student_token = body.get("student_token")

    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    if expected != razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    norm = await get_bulk_order(token)
    row_id = norm["id"]

    order_link = f"{SITE_URL}/bulk-order/{norm['token']}"

    if student_token:
        students = norm.get("student_payments", [])
        for s in students:
            if s.get("student_token") == student_token:
                s["paid"] = True
                s["razorpay_payment_id"] = razorpay_payment_id
                break

        paid_count = sum(1 for s in students if s.get("paid"))
        split_count = int(norm.get("split_count", len(students)))
        new_status = "fully_paid" if paid_count >= split_count else "partially_paid"

        norm["student_payments"] = students
        norm["paid_count"] = paid_count
        norm["status"] = new_status
        await _save_bulk_data(row_id, norm)

        if new_status == "fully_paid":
            bg.add_task(
                send_bulk_order_payment_received,
                phone=norm["phone"],
                name=norm["contact_name"],
                school=norm["school_name"],
                amount=norm["final_amount"],
                order_link=order_link,
            )
            if norm.get("email"):
                bg.add_task(
                    send_bulk_order_payment_received_email,
                    to_email=norm["email"],
                    name=norm["contact_name"],
                    school=norm["school_name"],
                    amount=norm["final_amount"],
                    order_link=order_link,
                )

        return {"success": True, "status": new_status, "paid_count": paid_count, "split_count": split_count}
    else:
        norm["razorpay_payment_id"] = razorpay_payment_id
        norm["status"] = "fully_paid"
        norm["paid_count"] = 1
        await _save_bulk_data(row_id, norm)

        bg.add_task(
            send_bulk_order_payment_received,
            phone=norm["phone"],
            name=norm["contact_name"],
            school=norm["school_name"],
            amount=norm["final_amount"],
            order_link=order_link,
        )
        if norm.get("email"):
            bg.add_task(
                send_bulk_order_payment_received_email,
                to_email=norm["email"],
                name=norm["contact_name"],
                school=norm["school_name"],
                amount=norm["final_amount"],
                order_link=order_link,
            )

        return {"success": True, "status": "fully_paid"}


@router.post("/{row_id}/ship", summary="Admin initiates shipping for a fully paid bulk order")
async def ship_bulk_order(row_id: int, bg: BackgroundTasks):
    row = await client.get_row(TABLE_IDS["bulk_orders"], row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Bulk order not found")
    norm = _normalize_bulk_row(row)
    if norm.get("status") not in ["fully_paid", "approved"]:
        raise HTTPException(status_code=400, detail="Order is not fully paid yet")

    items = norm.get("items", [])
    item_count = sum(i.get("qty", 1) for i in items)

    shipment_data = {
        "customer_name": norm.get("contact_name", "Teacher"),
        "customer_phone": norm.get("phone", ""),
        "customer_email": "info@cremsonpublications.com",
        "address": norm.get("address", "School Address"),
        "city": norm.get("city", "Chennai"),
        "state": norm.get("state", "Tamil Nadu"),
        "pincode": norm.get("pincode", ""),
        "order_id": norm.get("order_id") or f"CPS{26000 + row_id}",
        "items_description": f"{norm.get('school_name', 'Bulk')} - {item_count} items",
        "item_count": item_count,
        "total_amount": float(norm.get("final_amount", 0)),
        "items": items,
    }

    try:
        result = await create_shipment(shipment_data)
        if not result.get("success") or not result.get("awb"):
            raise HTTPException(status_code=400, detail=result.get("error", "Shipway AWB generation failed"))
        awb = str(result.get("awb"))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[BulkOrder] Shipway error: {e}")
        raise HTTPException(status_code=502, detail=f"Shipway error: {str(e)}")

    norm["status"] = "shipped"
    norm["shipway_awb"] = awb
    await _save_bulk_data(row_id, norm)

    tracking_link = f"https://shipway.in/track/{awb}"
    order_link = f"{SITE_URL}/bulk-order/{norm['token']}"

    bg.add_task(
        send_bulk_order_shipped,
        phone=norm["phone"],
        name=norm["contact_name"],
        school=norm["school_name"],
        awb=awb,
        tracking_link=tracking_link,
        order_link=order_link,
    )
    if norm.get("email"):
        bg.add_task(
            send_bulk_order_shipped_email,
            to_email=norm["email"],
            name=norm["contact_name"],
            school=norm["school_name"],
            awb=awb,
            tracking_link=tracking_link,
            order_link=order_link,
        )

    return {"success": True, "awb": awb, "status": "shipped"}


@router.delete("/{row_id}", summary="Delete a bulk order")
async def delete_bulk_order(row_id: int):
    try:
        await client.delete_row(TABLE_IDS["bulk_orders"], row_id)
        return {"success": True, "detail": "Bulk order deleted successfully."}
    except Exception as e:
        logger.error(f"[BulkOrder] Delete error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete bulk order: {str(e)}")
