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
