from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional
from datetime import datetime, date
import logging
from db.blogs import get_db_connection
from services.baserow import BaserowClient
from config import TABLE_IDS

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", summary="Get reminders list")
async def get_reminders(status: Optional[str] = Query(None)):
    """Fetch all reminders with calculated overdue days."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if status:
            cursor.execute("SELECT * FROM reminders WHERE status = ? ORDER BY due_date ASC, id DESC", (status,))
        else:
            cursor.execute("SELECT * FROM reminders ORDER BY due_date ASC, id DESC")
            
        rows = cursor.fetchall()
        conn.close()

        today = date.today()
        reminders = []
        for r in rows:
            item = dict(r)
            due_d = None
            overdue_days = 0
            if item.get("due_date"):
                try:
                    due_d = datetime.strptime(item["due_date"], "%Y-%m-%d").date()
                except Exception:
                    pass

            if due_d and item.get("status") == "pending":
                delta = (today - due_d).days
                if delta > 0:
                    overdue_days = delta

            item["overdue_days"] = overdue_days
            item["is_today"] = (due_d == today) if due_d else False
            item["is_overdue"] = overdue_days > 0
            reminders.append(item)

        # Merge virtual teacher follow-up reminders if status is not completed
        if not status or status == "pending":
            try:
                baserow_client = BaserowClient()
                teacher_res = await baserow_client.get_rows(
                    TABLE_IDS["teacher"], 
                    size=200, 
                    not_empty_filters=["NextFollow-upDate"],
                    order_by="-Teacher ID"
                )
                teachers = teacher_res.get("results", [])
                for t in teachers:
                    follow_up_date_str = t.get("NextFollow-upDate")
                    if follow_up_date_str:
                        teacher_name = t.get("Teacher Name") or ""
                        teacher_id = t.get("id")
                        
                        school_name_list = t.get("School Name", []) or t.get("SchoolID", [])
                        s_name = ""
                        if school_name_list and isinstance(school_name_list, list) and len(school_name_list) > 0:
                            item = school_name_list[0]
                            s_name = item.get("value", "") if isinstance(item, dict) else str(item)
                        
                        due_d = None
                        overdue_days = 0
                        try:
                            due_d = datetime.strptime(follow_up_date_str, "%Y-%m-%d").date()
                        except Exception:
                            pass

                        if due_d:
                            delta = (today - due_d).days
                            if delta > 0:
                                overdue_days = delta

                        virtual_reminder = {
                            "id": f"teacher_{teacher_id}",
                            "title": f"Follow-up with Teacher: {teacher_name}",
                            "notes": t.get("Notes") or "",
                            "due_date": follow_up_date_str,
                            "due_time": "10:00 AM",
                            "teacher_name": teacher_name,
                            "school_name": s_name,
                            "status": "pending",
                            "completed_at": None,
                            "created_at": follow_up_date_str,
                            "overdue_days": overdue_days,
                            "is_today": (due_d == today),
                            "is_overdue": (overdue_days > 0),
                        }
                        reminders.append(virtual_reminder)
            except Exception as exc:
                logger.error(f"[Reminders API] Error fetching virtual teacher reminders: {exc}")

        return {"reminders": reminders, "count": len(reminders)}
    except Exception as exc:
        logger.error(f"[Reminders API] Error fetching reminders: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/", summary="Create a reminder")
async def create_reminder(payload: dict = Body(...)):
    title = payload.get("title")
    due_date = payload.get("due_date")
    if not title or not due_date:
        raise HTTPException(status_code=400, detail="Title and Due Date are required.")

    notes = payload.get("notes", "")
    due_time = payload.get("due_time", "")
    teacher_name = payload.get("teacher_name", "")
    school_name = payload.get("school_name", "")
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO reminders (title, notes, due_date, due_time, teacher_name, school_name, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        """, (title, notes, due_date, due_time, teacher_name, school_name, created_at))
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return {"success": True, "id": new_id, "message": "Reminder created successfully"}
    except Exception as exc:
        logger.error(f"[Reminders API] Error creating reminder: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.patch("/{reminder_id}/complete", summary="Mark reminder completed")
async def complete_reminder(reminder_id: str):
    if reminder_id.startswith("teacher_"):
        try:
            teacher_id = int(reminder_id.split("_")[1])
            baserow_client = BaserowClient()
            old_teacher = {}
            try:
                old_teacher = await baserow_client.get_row(TABLE_IDS["teacher"], teacher_id)
            except Exception:
                pass

            updated_teacher = await baserow_client.update_row(TABLE_IDS["teacher"], teacher_id, {"NextFollow-upDate": None})
            
            # Log edit history
            if old_teacher:
                try:
                    from db.blogs import log_teacher_edit
                    log_teacher_edit(
                        teacher_row_id=teacher_id,
                        teacher_name=old_teacher.get("Teacher Name") or updated_teacher.get("Teacher Name", ""),
                        old_dict=old_teacher,
                        new_dict=updated_teacher,
                        changed_keys=["NextFollow-upDate"],
                        changed_by="Admin"
                    )
                except Exception as exc:
                    logger.warning(f"[Teacher Audit Log] Error logging edit: {exc}")

            return {"success": True, "id": reminder_id, "message": "Teacher follow-up marked as completed"}
        except Exception as exc:
            logger.error(f"[Reminders API] Error completing teacher reminder {reminder_id}: {exc}")
            raise HTTPException(status_code=500, detail=str(exc))

    completed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE reminders 
            SET status = 'completed', completed_at = ? 
            WHERE id = ?
        """, (completed_at, int(reminder_id)))
        conn.commit()
        conn.close()
        return {"success": True, "id": reminder_id, "message": "Reminder marked as completed"}
    except Exception as exc:
        logger.error(f"[Reminders API] Error completing reminder {reminder_id}: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/{reminder_id}", summary="Delete reminder")
async def delete_reminder(reminder_id: str):
    if reminder_id.startswith("teacher_"):
        try:
            teacher_id = int(reminder_id.split("_")[1])
            baserow_client = BaserowClient()
            old_teacher = {}
            try:
                old_teacher = await baserow_client.get_row(TABLE_IDS["teacher"], teacher_id)
            except Exception:
                pass

            updated_teacher = await baserow_client.update_row(TABLE_IDS["teacher"], teacher_id, {"NextFollow-upDate": None})
            
            # Log edit history
            if old_teacher:
                try:
                    from db.blogs import log_teacher_edit
                    log_teacher_edit(
                        teacher_row_id=teacher_id,
                        teacher_name=old_teacher.get("Teacher Name") or updated_teacher.get("Teacher Name", ""),
                        old_dict=old_teacher,
                        new_dict=updated_teacher,
                        changed_keys=["NextFollow-upDate"],
                        changed_by="Admin"
                    )
                except Exception as exc:
                    logger.warning(f"[Teacher Audit Log] Error logging edit: {exc}")

            return {"success": True, "id": reminder_id, "message": "Teacher reminder deleted"}
        except Exception as exc:
            logger.error(f"[Reminders API] Error deleting teacher reminder {reminder_id}: {exc}")
            raise HTTPException(status_code=500, detail=str(exc))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM reminders WHERE id = ?", (int(reminder_id),))
        conn.commit()
        conn.close()
        return {"success": True, "id": reminder_id, "message": "Reminder deleted"}
    except Exception as exc:
        logger.error(f"[Reminders API] Error deleting reminder {reminder_id}: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


# ── 60-Day Reorder Reminders API ──────────────────────────────────────────────
import json


@router.get("/reorder-eligible", summary="List orders eligible for 60-day reorder reminders")
async def get_reorder_eligible_orders(
    days: int = Query(60, ge=1, description="Minimum days elapsed since order date"),
):
    """
    Find orders placed >= days (default 60 days) ago from Baserow Table 762.
    Returns list of orders with customer name, phone, books ordered, order date, and days elapsed.
    """
    baserow_client = BaserowClient()
    today = date.today()
    eligible_list = []

    try:
        data = await baserow_client.get_rows(TABLE_IDS["orders"], page=1, size=200, order_by="-created_at")
        results = data.get("results", [])

        for order in results:
            order_id = str(order.get("order_id") or order.get("id"))
            raw_date = order.get("order_date") or order.get("created_at") or ""
            if not raw_date:
                continue

            order_d = None
            try:
                clean_d_str = str(raw_date)[:10]
                order_d = datetime.strptime(clean_d_str, "%Y-%m-%d").date()
            except Exception:
                continue

            elapsed = (today - order_d).days
            if elapsed >= days:
                # Extract customer details
                u_raw = order.get("user_info") or "{}"
                user_info = json.loads(u_raw) if isinstance(u_raw, str) else (u_raw or {})
                customer_name = user_info.get("name") or "Customer"
                phone = user_info.get("phone") or user_info.get("whatsapp_phone") or ""

                # Extract items description
                items_raw = order.get("items") or "[]"
                items = json.loads(items_raw) if isinstance(items_raw, str) else (items_raw or [])
                book_names = [i.get("name") or i.get("title") for i in items if isinstance(i, dict) and (i.get("name") or i.get("title"))]
                items_desc = ", ".join(book_names[:2]) if book_names else "Educational Books"

                eligible_list.append({
                    "order_id": order_id,
                    "row_id": order.get("id"),
                    "customer_name": customer_name,
                    "phone": phone,
                    "order_date": str(order_d),
                    "days_elapsed": elapsed,
                    "items_desc": items_desc,
                    "total_amount": order.get("total_amount") or 0,
                    "order_status": order.get("order_status") or "CONFIRMED",
                })
    except Exception as exc:
        logger.error(f"[Reorder Reminders API] Error fetching eligible orders: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    return {"count": len(eligible_list), "results": eligible_list}


@router.post("/send-reorder-reminder/{order_id}", summary="Send 60-day reorder reminder WhatsApp notification")
async def send_reorder_reminder_endpoint(order_id: str):
    """
    Send the reorder_reminder_v1 WhatsApp notification for a specific order.
    """
    baserow_client = BaserowClient()
    order_row = None

    rows = await baserow_client.get_rows(TABLE_IDS["orders"], filters={"order_id": order_id})
    results = rows.get("results", [])
    if results:
        order_row = results[0]
    elif order_id.isdigit():
        try:
            order_row = await baserow_client.get_row(TABLE_IDS["orders"], int(order_id))
        except Exception:
            pass

    if not order_row:
        raise HTTPException(status_code=404, detail=f"Order #{order_id} not found.")

    u_raw = order_row.get("user_info") or "{}"
    user_info = json.loads(u_raw) if isinstance(u_raw, str) else (u_raw or {})
    customer_name = user_info.get("name") or "Customer"
    phone = user_info.get("phone") or user_info.get("whatsapp_phone") or ""

    if not phone:
        raise HTTPException(status_code=400, detail="Customer phone number is missing for this order.")

    items_raw = order_row.get("items") or "[]"
    items = json.loads(items_raw) if isinstance(items_raw, str) else (items_raw or [])
    book_names = [i.get("name") or i.get("title") for i in items if isinstance(i, dict) and (i.get("name") or i.get("title"))]
    items_desc = ", ".join(book_names[:2]) if book_names else "Educational Books"

    try:
        from services.whatsapp import send_reorder_reminder
        await send_reorder_reminder(
            phone=phone,
            customer_name=customer_name,
            book_or_items_name=items_desc,
            reorder_url="https://cremsonpublications.com/shop",
        )
        logger.info(f"[Reorder Reminder] Sent to {phone} for order #{order_id}")
        return {
            "success": True,
            "order_id": order_id,
            "phone": phone,
            "message": f"60-Day Reorder Reminder WhatsApp message sent to {customer_name} ({phone})!",
        }
    except Exception as exc:
        logger.error(f"[Reorder Reminder] Failed to send WhatsApp: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to send WhatsApp message: {str(exc)}")
