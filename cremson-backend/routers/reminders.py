from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional
from datetime import datetime, date
import logging
from db.blogs import get_db_connection

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
async def complete_reminder(reminder_id: int):
    completed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE reminders 
            SET status = 'completed', completed_at = ? 
            WHERE id = ?
        """, (completed_at, reminder_id))
        conn.commit()
        conn.close()
        return {"success": True, "id": reminder_id, "message": "Reminder marked as completed"}
    except Exception as exc:
        logger.error(f"[Reminders API] Error completing reminder {reminder_id}: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/{reminder_id}", summary="Delete reminder")
async def delete_reminder(reminder_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
        conn.commit()
        conn.close()
        return {"success": True, "id": reminder_id, "message": "Reminder deleted"}
    except Exception as exc:
        logger.error(f"[Reminders API] Error deleting reminder {reminder_id}: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
