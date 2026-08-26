import asyncio
import re
from fastapi import APIRouter, Query, HTTPException, Request, BackgroundTasks
from typing import Optional
from pydantic import BaseModel
from services.baserow import BaserowClient
from config import TABLE_IDS

router = APIRouter()
client = BaserowClient()

def sanitize_payload(body: dict, multiple_select_keys: list[str]) -> dict:
    cleaned = {}
    for k, v in body.items():
        if k in multiple_select_keys:
            if v is None or v == "" or v == []:
                cleaned[k] = []
            elif isinstance(v, str):
                cleaned[k] = [v]
            else:
                cleaned[k] = v
        else:
            cleaned[k] = None if v == "" else v
    return cleaned

async def get_sorted_rows(table_id: int, page: int, size: int, search: Optional[str] = None, filters: Optional[dict] = None) -> dict:
    data = await client.get_rows(
        table_id,
        page=1,
        size=200,
        search=search,
        filters=filters,
    )
    results = data.get("results", [])
    sorted_results = sorted(results, key=lambda x: x.get("id", 0), reverse=True)
    
    start = (page - 1) * size
    end = start + size
    paginated_results = sorted_results[start:end]
    
    return {
        "count": len(sorted_results),
        "next": None,
        "previous": None,
        "results": paginated_results
    }


# ------------------- SCHOOL ROUTER -------------------
@router.get("/schools", summary="List schools")
async def list_schools(
    request: Request,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
):
    filters = {k: v for k, v in request.query_params.items() if k not in ["page", "size", "search"] and v}
    res = await client.get_rows(
        TABLE_IDS["school"],
        page=page,
        size=size,
        search=search,
        filters=filters,
        order_by="-SchoolID",
    )
    
    # Map teacher IDs to teacher names for displaying in front-end
    teacher_row_ids = set()
    for school in res.get("results", []):
        for t in school.get("Teacher", []):
            if isinstance(t, dict) and "id" in t:
                teacher_row_ids.add(t["id"])
    
    if teacher_row_ids:
        async def get_teacher_name(tid):
            try:
                t_row = await client.get_row(TABLE_IDS["teacher"], tid)
                return tid, t_row.get("Teacher Name", "")
            except Exception:
                return tid, ""
        
        teacher_names = dict(await asyncio.gather(*(get_teacher_name(tid) for tid in teacher_row_ids)))
        
        for school in res.get("results", []):
            for t in school.get("Teacher", []):
                if isinstance(t, dict) and "id" in t:
                    tid = t["id"]
                    t["value"] = teacher_names.get(tid, t.get("value"))
                    
    return res

@router.get("/schools/{row_id}", summary="Get school details")
async def get_school(row_id: int):
    school = await client.get_row(TABLE_IDS["school"], row_id)
    
    teacher_row_ids = [t["id"] for t in school.get("Teacher", []) if isinstance(t, dict) and "id" in t]
    if teacher_row_ids:
        async def get_teacher_name(tid):
            try:
                t_row = await client.get_row(TABLE_IDS["teacher"], tid)
                return tid, t_row.get("Teacher Name", "")
            except Exception:
                return tid, ""
        
        teacher_names = dict(await asyncio.gather(*(get_teacher_name(tid) for tid in teacher_row_ids)))
        for t in school.get("Teacher", []):
            if isinstance(t, dict) and "id" in t:
                tid = t["id"]
                t["value"] = teacher_names.get(tid, t.get("value"))
                
    return school

def validate_school_fields(body: dict):
    phone = body.get("SchoolPhone")
    if phone is not None:
        phone_str = str(phone).strip()
        if phone_str and not (phone_str.isdigit() and len(phone_str) == 10):
            raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits.")

    pin_code = body.get("Pincode") or body.get("Pin Code") or body.get("pincode")
    if pin_code is not None:
        pin_code_str = str(pin_code).strip()
        if pin_code_str and not (pin_code_str.isdigit() and len(pin_code_str) == 6):
            raise HTTPException(status_code=400, detail="Pincode must be exactly 6 digits.")

@router.post("/schools", summary="Create school")
async def create_school(body: dict):
    validate_school_fields(body)
    cleaned_body = sanitize_payload(body, ["Board"])
    school_name = cleaned_body.get("SchoolName")
    if school_name:
        existing = await client.get_rows(TABLE_IDS["school"], search=school_name)
        results = existing.get("results", [])
        for r in results:
            if r.get("SchoolName", "").strip().lower() == school_name.strip().lower():
                raise HTTPException(status_code=400, detail="A school with this name already exists.")
    return await client.create_row(TABLE_IDS["school"], cleaned_body)

@router.patch("/schools/{row_id}", summary="Update school")
async def update_school(row_id: int, body: dict):
    validate_school_fields(body)
    cleaned_body = sanitize_payload(body, ["Board"])
    school_name = cleaned_body.get("SchoolName")
    if school_name:
        existing = await client.get_rows(TABLE_IDS["school"], search=school_name)
        results = existing.get("results", [])
        for r in results:
            if r.get("SchoolName", "").strip().lower() == school_name.strip().lower() and r.get("id") != row_id:
                raise HTTPException(status_code=400, detail="A school with this name already exists.")

    # Fetch previous values for diff logging
    old_school = {}
    try:
        old_school = await client.get_row(TABLE_IDS["school"], row_id)
    except Exception:
        pass

    updated_school = await client.update_row(TABLE_IDS["school"], row_id, cleaned_body)

    # Log audit entry
    if old_school:
        try:
            from db.blogs import log_school_edit
            log_school_edit(
                school_row_id=row_id,
                school_name=old_school.get("SchoolName") or updated_school.get("SchoolName", ""),
                old_dict=old_school,
                new_dict=updated_school,
                changed_keys=list(cleaned_body.keys()),
                changed_by="Admin"
            )
        except Exception as exc:
            logger.warning(f"[School Audit Log] Error logging edit: {exc}")

    return updated_school


@router.get("/schools/{row_id}/history", summary="Get school edit audit history")
async def get_school_audit_history(row_id: int):
    """Return all historical edit audit log entries for a school."""
    try:
        import json
        from db.blogs import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM school_audit_logs 
            WHERE school_row_id = ? 
            ORDER BY id DESC
        """, (row_id,))
        rows = cursor.fetchall()
        conn.close()

        logs = []
        for r in rows:
            item = dict(r)
            raw_changes = item.get("changes_json") or "[]"
            parsed_changes = []
            if isinstance(raw_changes, str):
                try:
                    res = json.loads(raw_changes)
                    if isinstance(res, str):
                        res = json.loads(res)
                    if isinstance(res, list):
                        parsed_changes = res
                except Exception:
                    parsed_changes = []
            elif isinstance(raw_changes, list):
                parsed_changes = raw_changes

            item["changes"] = parsed_changes
            logs.append(item)

        return {"school_id": row_id, "logs": logs}
    except Exception as exc:
        logger.error(f"[School Audit History] Error fetching history for {row_id}: {exc}")
        return {"school_id": row_id, "logs": []}


@router.delete("/schools/{row_id}", summary="Delete school")
async def delete_school(row_id: int):
    await client.delete_row(TABLE_IDS["school"], row_id)
    return {"message": "School deleted successfully"}



# ------------------- TEACHER ROUTER -------------------
async def enrich_teacher_data(teacher: dict) -> dict:
    """Enrich teacher dict with status computed from auth_users table or Notes parsing."""
    notes = teacher.get("Notes") or ""

    # Parse and enrich IdCardUrl (from dedicated field or fallback to Notes for legacy records)
    id_card_url = teacher.get("IdCardUrl")
    if not id_card_url:
        match = re.search(r"https?://[^\s;|,]+\.(?:png|jpg|jpeg|gif|webp)", notes, re.IGNORECASE) or re.search(r"IdCardUrl:\s*(https?://[^\s;|,]+)", notes, re.IGNORECASE)
        if match:
            id_card_url = match.group(1) if len(match.groups()) > 0 else match.group(0)
    teacher["IdCardUrl"] = id_card_url

    status_from_notes = None
    match = re.search(r"Status:\s*([a-zA-Z\s]+)", notes)
    if match:
        val = match.group(1).strip()
        if val in ["Approved", "Pending Approval", "Rejected"]:
            status_from_notes = val

    status_from_auth = None
    is_website_signup = False
    email = teacher.get("Email", "").lower().strip()

    if email:
        try:
            from db.auth import get_user_by_email
            user = await get_user_by_email(email)
            if user:
                is_website_signup = True
                is_approved = user.get("is_approved")
                is_active = user.get("is_active")
                if is_approved == 1:
                    status_from_auth = "Approved"
                elif is_approved == -1 or is_active == 0:
                    status_from_auth = "Rejected"
                else:
                    status_from_auth = "Pending Approval"
        except Exception:
            pass

    # Priority: auth_users -> Notes status -> Raw status
    raw_status = teacher.get("Status")
    raw_status_val = raw_status.get("value") if isinstance(raw_status, dict) else raw_status
    
    final_status = status_from_auth or status_from_notes or raw_status_val
    
    # If no status is set:
    # 1. Non-website CRM leads default to "Approved" (so they don't show Approve/Reject action buttons)
    # 2. Website signups default to "Pending Approval"
    if not final_status:
        if is_website_signup:
            final_status = "Pending Approval"
        else:
            final_status = "Approved"

    teacher["Status"] = final_status
    return teacher

@router.get("/teachers", summary="List teachers")
async def list_teachers(
    request: Request,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
):
    filters = {k: v for k, v in request.query_params.items() if k not in ["page", "size", "search"] and v}
    res = await client.get_rows(
        TABLE_IDS["teacher"],
        page=page,
        size=size,
        search=search,
        filters=filters,
        order_by="-Teacher ID",
    )
    results = res.get("results", [])
    if results:
        res["results"] = await asyncio.gather(*(enrich_teacher_data(r) for r in results))
    return res

@router.get("/teachers/{row_id}", summary="Get teacher details")
async def get_teacher(row_id: int):
    teacher = await client.get_row(TABLE_IDS["teacher"], row_id)
    return await enrich_teacher_data(teacher)

async def validate_teacher_schools(body: dict, row_id: Optional[int] = None):
    is_guest = body.get("Guest")
    school_ids = body.get("SchoolID")
    
    if is_guest is None and school_ids is None:
        return

    if row_id is not None:
        if is_guest is None or school_ids is None:
            try:
                current = await client.get_row(TABLE_IDS["teacher"], row_id)
                if is_guest is None:
                    is_guest = current.get("Guest", False)
                if school_ids is None:
                    school_ids_raw = current.get("SchoolID", [])
                    school_ids = [s.get("id") if isinstance(s, dict) else s for s in school_ids_raw]
            except Exception:
                pass

    is_guest = bool(is_guest)
    if school_ids is None:
        school_ids = []

    if not is_guest and len(school_ids) > 1:
        raise HTTPException(
            status_code=400,
            detail="Regular teachers can only be linked to a single school."
        )

def validate_teacher_fields(body: dict):
    # Whatsapp Phone
    whatsapp = body.get("Whatsapp Phone")
    if whatsapp is not None:
        whatsapp_str = str(whatsapp).strip()
        if whatsapp_str and not (whatsapp_str.isdigit() and len(whatsapp_str) == 10):
            raise HTTPException(status_code=400, detail="Whatsapp Phone must be exactly 10 digits.")

    # Alternate Number
    alt_num = body.get("Alternate Number")
    if alt_num is not None:
        alt_num_str = str(alt_num).strip()
        if alt_num_str and not (alt_num_str.isdigit() and len(alt_num_str) == 10):
            raise HTTPException(status_code=400, detail="Alternate Number must be exactly 10 digits.")

    # Pin Code
    pin_code = body.get("Pin Code")
    if pin_code is not None:
        pin_code_str = str(pin_code).strip()
        if pin_code_str and not (pin_code_str.isdigit() and len(pin_code_str) == 6):
            raise HTTPException(status_code=400, detail="Pin Code must be exactly 6 digits.")

@router.post("/teachers", summary="Create teacher")
async def create_teacher(body: dict):
    validate_teacher_fields(body)
    await validate_teacher_schools(body)
    cleaned_body = sanitize_payload(body, [])
    return await client.create_row(TABLE_IDS["teacher"], cleaned_body)

@router.get("/teachers/{row_id}/history", summary="Get teacher edit audit history")
async def get_teacher_audit_history(row_id: int):
    """Return all historical edit audit log entries for a teacher."""
    try:
        import json
        from db.blogs import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM teacher_audit_logs 
            WHERE teacher_row_id = ? 
            ORDER BY id DESC
        """, (row_id,))
        rows = cursor.fetchall()
        conn.close()

        logs = []
        for r in rows:
            item = dict(r)
            raw_changes = item.get("changes_json") or "[]"
            parsed_changes = []
            if isinstance(raw_changes, str):
                try:
                    res = json.loads(raw_changes)
                    if isinstance(res, str):
                        res = json.loads(res)
                    if isinstance(res, list):
                        parsed_changes = res
                except Exception:
                    parsed_changes = []
            elif isinstance(raw_changes, list):
                parsed_changes = raw_changes

            item["changes"] = parsed_changes
            logs.append(item)

        return {"teacher_id": row_id, "logs": logs}
    except Exception as exc:
        logger.error(f"[Teacher Audit History] Error fetching history for {row_id}: {exc}")
        return {"teacher_id": row_id, "logs": []}


@router.patch("/teachers/{row_id}", summary="Update teacher")
async def update_teacher(row_id: int, body: dict):
    validate_teacher_fields(body)
    await validate_teacher_schools(body, row_id)
    cleaned_body = sanitize_payload(body, [])

    # Fetch previous values for diff logging
    old_teacher = {}
    try:
        old_teacher = await client.get_row(TABLE_IDS["teacher"], row_id)
    except Exception:
        pass

    updated_teacher = await client.update_row(TABLE_IDS["teacher"], row_id, cleaned_body)

    # Log audit entry
    if old_teacher:
        try:
            from db.blogs import log_teacher_edit
            log_teacher_edit(
                teacher_row_id=row_id,
                teacher_name=old_teacher.get("Teacher Name") or updated_teacher.get("Teacher Name", ""),
                old_dict=old_teacher,
                new_dict=updated_teacher,
                changed_keys=list(cleaned_body.keys()),
                changed_by="Admin"
            )
        except Exception as exc:
            logger.warning(f"[Teacher Audit Log] Error logging edit: {exc}")

    return updated_teacher


@router.delete("/teachers/{row_id}", summary="Delete teacher")
async def delete_teacher(row_id: int):
    await client.delete_row(TABLE_IDS["teacher"], row_id)
    return {"message": "Teacher deleted successfully"}


@router.patch("/teachers/{row_id}/approve", summary="Approve teacher registration")
async def approve_teacher(row_id: int):
    teacher = await client.get_row(TABLE_IDS["teacher"], row_id)
    email = teacher.get("Email", "").lower().strip()
    phone = teacher.get("Whatsapp Phone", "") or teacher.get("Phone", "")
    teacher_name = teacher.get("Teacher Name", "") or "Teacher"
    
    updated_teacher = await client.update_row(TABLE_IDS["teacher"], row_id, {"Status": "Approved"})

    try:
        from db.blogs import log_teacher_edit
        log_teacher_edit(
            teacher_row_id=row_id,
            teacher_name=teacher_name,
            old_dict={"Status": teacher.get("Status", "Pending Approval")},
            new_dict={"Status": "Approved"},
            changed_by="Admin"
        )
    except Exception as exc:
        logger.warning(f"[Teacher Audit Log] Error logging approval: {exc}")
    
    if email:
        try:
            from db.auth import get_user_by_email, _client, T_USERS
            import re as _re
            user = await get_user_by_email(email)
            if user:
                if not phone and user.get("phone"):
                    phone = user["phone"]
                # Rebuild Notes: preserve designation, set role=teacher, is_approved=1
                old_notes = user.get("Notes") or ""
                desig_match = _re.search(r"designation:\s*([^\n;]+)", old_notes)
                designation = desig_match.group(1).strip() if desig_match else ""
                new_notes_parts = ["role: teacher", "is_approved: 1"]
                if designation:
                    new_notes_parts.append(f"designation: {designation}")
                await _client.update_row(T_USERS, user["id"], {
                    "Notes": "; ".join(new_notes_parts),
                    "is_verified": 1,
                })
        except Exception as e:
            print("Warning: Failed to update auth_users for approved teacher:", e)

    # Send WhatsApp Approval Message (awaited)
    if phone:
        try:
            from services.whatsapp import send_teacher_approved_notification
            await send_teacher_approved_notification(phone, teacher_name)
        except Exception as e:
            print("Warning: Failed to send WhatsApp approval notification:", e)

    # Send Email Approval Message (awaited)
    if email:
        try:
            from services.email import send_teacher_approved_email
            await send_teacher_approved_email(email, teacher_name)
        except Exception as e:
            print("Warning: Failed to send Email approval notification:", e)

    return {"message": "Teacher approved successfully", "teacher": await enrich_teacher_data(updated_teacher)}


@router.patch("/teachers/{row_id}/reject", summary="Reject teacher registration")
async def reject_teacher(row_id: int):
    teacher = await client.get_row(TABLE_IDS["teacher"], row_id)
    email = teacher.get("Email", "").lower().strip()
    phone = teacher.get("Whatsapp Phone", "") or teacher.get("Phone", "")
    teacher_name = teacher.get("Teacher Name", "") or "Teacher"
    
    updated_teacher = await client.update_row(TABLE_IDS["teacher"], row_id, {"Status": "Rejected"})
    
    if email:
        try:
            from db.auth import get_user_by_email, _client, T_USERS
            import re as _re
            user = await get_user_by_email(email)
            if user:
                if not phone and user.get("phone"):
                    phone = user["phone"]
                # Rebuild Notes: preserve designation, set is_approved=-1
                old_notes = user.get("Notes") or ""
                desig_match = _re.search(r"designation:\s*([^\n;]+)", old_notes)
                designation = desig_match.group(1).strip() if desig_match else ""
                new_notes_parts = ["role: teacher", "is_approved: -1"]
                if designation:
                    new_notes_parts.append(f"designation: {designation}")
                await _client.update_row(T_USERS, user["id"], {
                    "Notes": "; ".join(new_notes_parts),
                    "is_active": 0,
                })
        except Exception as e:
            print("Warning: Failed to update auth_users for rejected teacher:", e)

    # Send WhatsApp Rejection Message (awaited)
    if phone:
        try:
            from services.whatsapp import send_teacher_rejected_notification
            await send_teacher_rejected_notification(phone, teacher_name)
        except Exception as e:
            print("Warning: Failed to send WhatsApp rejection notification:", e)

    # Send Email Rejection Message (awaited)
    if email:
        try:
            from services.email import send_teacher_rejected_email
            await send_teacher_rejected_email(email, teacher_name)
        except Exception as e:
            print("Warning: Failed to send Email rejection notification:", e)

    return {"message": "Teacher registration rejected", "teacher": await enrich_teacher_data(updated_teacher)}


# ------------------- BOOKS ROUTER -------------------
@router.get("/books", summary="List CRM books catalog")
async def list_crm_books(
    request: Request,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
):
    filters = {k: v for k, v in request.query_params.items() if k not in ["page", "size", "search"] and v}
    return await get_sorted_rows(TABLE_IDS["books"], page, size, search, filters)

@router.get("/books/{row_id}", summary="Get CRM book details")
async def get_crm_book(row_id: int):
    return await client.get_row(TABLE_IDS["books"], row_id)

@router.post("/books", summary="Create CRM book")
async def create_crm_book(body: dict):
    cleaned_body = sanitize_payload(body, ["Series"])
    return await client.create_row(TABLE_IDS["books"], cleaned_body)

@router.patch("/books/{row_id}", summary="Update CRM book")
async def update_crm_book(row_id: int, body: dict):
    cleaned_body = sanitize_payload(body, ["Series"])
    return await client.update_row(TABLE_IDS["books"], row_id, cleaned_body)

@router.delete("/books/{row_id}", summary="Delete CRM book")
async def delete_crm_book(row_id: int):
    await client.delete_row(TABLE_IDS["books"], row_id)
    return {"message": "CRM book deleted successfully"}


# ------------------- SUBJECT ROUTER -------------------
@router.get("/subjects", summary="List subjects")
async def list_subjects(
    request: Request,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
):
    filters = {k: v for k, v in request.query_params.items() if k not in ["page", "size", "search"] and v}
    return await get_sorted_rows(TABLE_IDS["subject"], page, size, search, filters)

@router.get("/subjects/{row_id}", summary="Get subject details")
async def get_subject(row_id: int):
    return await client.get_row(TABLE_IDS["subject"], row_id)

@router.post("/subjects", summary="Create subject")
async def create_subject(body: dict):
    cleaned_body = sanitize_payload(body, [])
    return await client.create_row(TABLE_IDS["subject"], cleaned_body)

@router.patch("/subjects/{row_id}", summary="Update subject")
async def update_subject(row_id: int, body: dict):
    cleaned_body = sanitize_payload(body, [])
    return await client.update_row(TABLE_IDS["subject"], row_id, cleaned_body)

@router.delete("/subjects/{row_id}", summary="Delete subject")
async def delete_subject(row_id: int):
    await client.delete_row(TABLE_IDS["subject"], row_id)
    return {"message": "Subject deleted successfully"}


# ------------------- SUPPORT TICKETS ROUTER -------------------
import json
import os
import time
from datetime import datetime

_TICKETS_FILE = "uploads/support_tickets.json"

def _load_tickets() -> list:
    if not os.path.exists(_TICKETS_FILE):
        return []
    try:
        with open(_TICKETS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def _save_tickets(tickets: list):
    os.makedirs(os.path.dirname(_TICKETS_FILE), exist_ok=True)
    with open(_TICKETS_FILE, "w", encoding="utf-8") as f:
        json.dump(tickets, f, indent=2, ensure_ascii=False)


class CreateSupportTicketRequest(BaseModel):
    full_name: str
    phone: str
    email: str
    message: str
    subject: Optional[str] = "Contact Us Enquiry"


class UpdateSupportTicketStatusRequest(BaseModel):
    status: str   # "Pending", "Resolved", "Cancelled"
    notes: Optional[str] = ""


@router.post("/support-tickets", summary="Create support ticket / Contact Us submission")
async def create_support_ticket(body: CreateSupportTicketRequest):
    ticket_id = f"TKT-{int(time.time() * 1000) % 1000000:06d}"
    created_at = datetime.now().isoformat()

    new_ticket = {
        "id": ticket_id,
        "full_name": body.full_name,
        "phone": body.phone,
        "email": body.email,
        "subject": body.subject or "Contact Us Enquiry",
        "message": body.message,
        "status": "Pending",
        "notes": "",
        "created_at": created_at,
        "updated_at": created_at,
    }

    tickets = _load_tickets()
    tickets.insert(0, new_ticket)
    _save_tickets(tickets)

    # 1. Send Email
    try:
        from services.email import send_contact_us_email
        await send_contact_us_email(
            full_name=body.full_name,
            phone=body.phone,
            email=body.email,
            message=body.message,
        )
    except Exception as exc:
        print(f"[Support Ticket] Email send error: {exc}")

    # 2. Send WhatsApp Notification
    if body.phone:
        try:
            from services.whatsapp import send_support_request
            await send_support_request(
                phone=body.phone,
                customer_name=body.full_name,
                subject_or_type=body.subject or "Contact Us Enquiry",
                ticket_id=ticket_id,
            )
        except Exception as exc:
            print(f"[Support Ticket] WhatsApp send error: {exc}")

    return {
        "success": True,
        "ticket_id": ticket_id,
        "message": "Support ticket created successfully and WhatsApp notification sent.",
    }


@router.get("/support-tickets", summary="List support tickets for admin")
async def list_support_tickets(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
):
    tickets = _load_tickets()

    if status and status.lower() != "all":
        tickets = [t for t in tickets if str(t.get("status")).lower() == status.lower()]

    if search:
        s = search.lower()
        tickets = [
            t for t in tickets
            if s in str(t.get("id")).lower()
            or s in str(t.get("full_name")).lower()
            or s in str(t.get("email")).lower()
            or s in str(t.get("phone")).lower()
            or s in str(t.get("message")).lower()
        ]

    total = len(tickets)
    start = (page - 1) * size
    end = start + size
    paginated = tickets[start:end]

    return {
        "count": total,
        "page": page,
        "size": size,
        "results": paginated,
    }


@router.patch("/support-tickets/{ticket_id}", summary="Update support ticket status")
async def update_support_ticket(ticket_id: str, body: UpdateSupportTicketStatusRequest):
    valid_statuses = {"Pending", "Resolved", "Cancelled"}
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    tickets = _load_tickets()
    found = False
    updated_ticket = None

    for t in tickets:
        if t["id"] == ticket_id:
            t["status"] = body.status
            if body.notes:
                t["notes"] = body.notes
            t["updated_at"] = datetime.now().isoformat()
            updated_ticket = t
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Support ticket not found.")

    _save_tickets(tickets)
    return {"success": True, "ticket": updated_ticket}
