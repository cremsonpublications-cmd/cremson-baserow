import asyncio
from fastapi import APIRouter, Query, HTTPException, Request
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
    return await client.update_row(TABLE_IDS["school"], row_id, cleaned_body)

@router.delete("/schools/{row_id}", summary="Delete school")
async def delete_school(row_id: int):
    await client.delete_row(TABLE_IDS["school"], row_id)
    return {"message": "School deleted successfully"}


# ------------------- TEACHER ROUTER -------------------
@router.get("/teachers", summary="List teachers")
async def list_teachers(
    request: Request,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
):
    filters = {k: v for k, v in request.query_params.items() if k not in ["page", "size", "search"] and v}
    return await client.get_rows(
        TABLE_IDS["teacher"],
        page=page,
        size=size,
        search=search,
        filters=filters,
        order_by="-Teacher ID",
    )

@router.get("/teachers/{row_id}", summary="Get teacher details")
async def get_teacher(row_id: int):
    return await client.get_row(TABLE_IDS["teacher"], row_id)

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

@router.patch("/teachers/{row_id}", summary="Update teacher")
async def update_teacher(row_id: int, body: dict):
    validate_teacher_fields(body)
    await validate_teacher_schools(body, row_id)
    cleaned_body = sanitize_payload(body, [])
    return await client.update_row(TABLE_IDS["teacher"], row_id, cleaned_body)

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
    
    if email:
        try:
            from db.auth import get_user_by_email, _client, T_USERS
            user = await get_user_by_email(email)
            if user:
                await _client.update_row(T_USERS, user["id"], {"is_approved": 1, "is_verified": 1})
                if not phone and user.get("phone"):
                    phone = user["phone"]
        except Exception as e:
            print("Warning: Failed to update auth_users for approved teacher:", e)

    # Send WhatsApp Approval Message to Teacher
    if phone:
        try:
            from services.whatsapp import send_teacher_approved_notification
            await send_teacher_approved_notification(phone, teacher_name)
        except Exception as e:
            print("Warning: Failed to send WhatsApp approval notification:", e)

    return {"message": "Teacher approved successfully", "teacher": updated_teacher}


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
            user = await get_user_by_email(email)
            if user:
                await _client.update_row(T_USERS, user["id"], {"is_approved": -1, "is_active": 0})
                if not phone and user.get("phone"):
                    phone = user["phone"]
        except Exception as e:
            print("Warning: Failed to update auth_users for rejected teacher:", e)

    # Send WhatsApp Rejection Message to Teacher
    if phone:
        try:
            from services.whatsapp import send_teacher_rejected_notification
            await send_teacher_rejected_notification(phone, teacher_name)
        except Exception as e:
            print("Warning: Failed to send WhatsApp rejection notification:", e)

    return {"message": "Teacher registration rejected", "teacher": updated_teacher}


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
