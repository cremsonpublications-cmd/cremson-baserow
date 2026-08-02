from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from db.blogs import get_db_connection
import sqlite3

router = APIRouter()

class StudyMaterialCreate(BaseModel):
    parent_id: Optional[int] = None
    label: str
    url: Optional[str] = None

class StudyMaterialResponse(BaseModel):
    id: int
    parent_id: Optional[int] = None
    label: str
    url: Optional[str] = None

@router.get("/", response_model=List[StudyMaterialResponse])
def get_study_materials():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM study_materials ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("/", response_model=StudyMaterialResponse)
def create_study_material(material: StudyMaterialCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        url_val = material.url.strip() if material.url else None
        if url_val == "":
            url_val = None
            
        cursor.execute("""
            INSERT INTO study_materials (parent_id, label, url)
            VALUES (?, ?, ?)
        """, (material.parent_id, material.label.strip(), url_val))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM study_materials WHERE id = ?", (new_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row)
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=StudyMaterialResponse)
def update_study_material(id: int, material: StudyMaterialCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM study_materials WHERE id = ?", (id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Study material item not found")
    try:
        url_val = material.url.strip() if material.url else None
        if url_val == "":
            url_val = None
            
        cursor.execute("""
            UPDATE study_materials
            SET parent_id = ?, label = ?, url = ?
            WHERE id = ?
        """, (material.parent_id, material.label.strip(), url_val, id))
        conn.commit()
        cursor.execute("SELECT * FROM study_materials WHERE id = ?", (id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row)
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
def delete_study_material(id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM study_materials WHERE id = ?", (id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Study material item not found")
    
    # SQLite has cascade delete, but let's make sure it deletes child nodes by enabling foreign keys
    try:
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.execute("DELETE FROM study_materials WHERE id = ?", (id,))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Study material item deleted successfully"}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
