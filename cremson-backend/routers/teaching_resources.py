from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from db.blogs import get_db_connection
import sqlite3

router = APIRouter()

class TeachingResourceCreate(BaseModel):
    parent_id: Optional[int] = None
    label: str
    url: Optional[str] = None

class TeachingResourceResponse(BaseModel):
    id: int
    parent_id: Optional[int] = None
    label: str
    url: Optional[str] = None

@router.get("/", response_model=List[TeachingResourceResponse])
def get_teaching_resources():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM teaching_resources ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("/", response_model=TeachingResourceResponse)
def create_teaching_resource(resource: TeachingResourceCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        url_val = resource.url.strip() if resource.url else None
        if url_val == "":
            url_val = None
            
        cursor.execute("""
            INSERT INTO teaching_resources (parent_id, label, url)
            VALUES (?, ?, ?)
        """, (resource.parent_id, resource.label.strip(), url_val))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM teaching_resources WHERE id = ?", (new_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row)
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=TeachingResourceResponse)
def update_teaching_resource(id: int, resource: TeachingResourceCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM teaching_resources WHERE id = ?", (id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Teaching resource item not found")
    try:
        url_val = resource.url.strip() if resource.url else None
        if url_val == "":
            url_val = None
            
        cursor.execute("""
            UPDATE teaching_resources
            SET parent_id = ?, label = ?, url = ?
            WHERE id = ?
        """, (resource.parent_id, resource.label.strip(), url_val, id))
        conn.commit()
        cursor.execute("SELECT * FROM teaching_resources WHERE id = ?", (id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row)
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
def delete_teaching_resource(id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM teaching_resources WHERE id = ?", (id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Teaching resource item not found")
    
    # SQLite has cascade delete, but let's make sure it deletes child nodes by enabling foreign keys
    try:
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.execute("DELETE FROM teaching_resources WHERE id = ?", (id,))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Teaching resource item deleted successfully"}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
