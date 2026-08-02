from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from db.blogs import get_db_connection
import sqlite3

router = APIRouter()

class PostCreate(BaseModel):
    title: str
    slug: str
    category: Optional[str] = ""
    image: str
    author: str
    date: str
    description: str
    content: str
    status: Optional[str] = "Published"
    pdf_url: Optional[str] = ""
    pdf_name: Optional[str] = ""

class PostResponse(BaseModel):
    id: int
    slug: str
    title: str
    category: Optional[str] = ""
    image: str
    author: str
    date: str
    description: str
    content: str
    status: str
    pdf_url: Optional[str] = ""
    pdf_name: Optional[str] = ""

class CategoryCreate(BaseModel):
    name: str

class CategoryResponse(BaseModel):
    id: int
    name: str

# Categories endpoints defined first to prevent collision with /{slug_or_id}
@router.get("/categories", response_model=List[CategoryResponse])
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM study_material_categories ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("/categories", response_model=CategoryResponse)
def create_category(category: CategoryCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        name_clean = category.name.strip()
        if not name_clean:
            raise HTTPException(status_code=400, detail="Category name cannot be empty.")
            
        cursor.execute("INSERT INTO study_material_categories (name) VALUES (?)", (name_clean,))
        conn.commit()
        cat_id = cursor.lastrowid
        cursor.execute("SELECT * FROM study_material_categories WHERE id = ?", (cat_id,))
        new_row = cursor.fetchone()
        conn.close()
        return dict(new_row)
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="This category already exists.")
    except HTTPException:
        raise
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/categories/{id_or_name}")
def delete_category(id_or_name: str, reassign_to: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if id_or_name.isdigit():
        cursor.execute("SELECT * FROM study_material_categories WHERE id = ?", (int(id_or_name),))
    else:
        cursor.execute("SELECT * FROM study_material_categories WHERE name = ?", (id_or_name,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Category not found")
        
    cat_name = row["name"]
    cat_id = row["id"]
    
    # Check if any post is using this category
    cursor.execute("SELECT COUNT(*) FROM study_material_posts WHERE category = ?", (cat_name,))
    count = cursor.fetchone()[0]
    
    if count > 0:
        if reassign_to is None:
            conn.close()
            return {
                "requires_reassignment": True,
                "blog_count": count,
                "message": f"Category '{cat_name}' is assigned to {count} study material post(s)."
            }
        else:
            reassign_val = "" if reassign_to in ["None", "none", ""] else reassign_to
            cursor.execute("UPDATE study_material_posts SET category = ? WHERE category = ?", (reassign_val, cat_name))
            conn.commit()
            
    cursor.execute("DELETE FROM study_material_categories WHERE id = ?", (cat_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Category '{cat_name}' deleted successfully."}

@router.get("/", response_model=List[PostResponse])
def get_posts(category: Optional[str] = None, status: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM study_material_posts"
    params = []
    
    conditions = []
    if category:
        if category in ["None", "none", "Uncategorized", "uncategorized"]:
            conditions.append("(category = ? OR category = ? OR category IS NULL)")
            params.extend(["", "None"])
        else:
            conditions.append("category = ?")
            params.append(category)
    if status:
        conditions.append("status = ?")
        params.append(status)
        
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
        
    query += " ORDER BY id DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

@router.get("/{slug_or_id}", response_model=PostResponse)
def get_post(slug_or_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if slug_or_id.isdigit():
        cursor.execute("SELECT * FROM study_material_posts WHERE id = ?", (int(slug_or_id),))
    else:
        cursor.execute("SELECT * FROM study_material_posts WHERE slug = ?", (slug_or_id,))
        
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Study material post not found")
        
    return dict(row)

@router.post("/", response_model=PostResponse)
def create_post(post: PostCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cat_val = post.category or ""
        cursor.execute("""
            INSERT INTO study_material_posts (slug, title, category, image, author, date, description, content, status, pdf_url, pdf_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            post.slug,
            post.title,
            cat_val,
            post.image,
            post.author,
            post.date,
            post.description,
            post.content,
            post.status,
            post.pdf_url or "",
            post.pdf_name or ""
        ))
        conn.commit()
        post_id = cursor.lastrowid
        cursor.execute("SELECT * FROM study_material_posts WHERE id = ?", (post_id,))
        new_row = cursor.fetchone()
        conn.close()
        return dict(new_row)
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="A post with this title or slug already exists.")
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=PostResponse)
def update_post(id: int, post: PostCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM study_material_posts WHERE id = ?", (id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
        
    try:
        cursor.execute("""
            UPDATE study_material_posts
            SET slug = ?, title = ?, category = ?, image = ?, author = ?, date = ?, description = ?, content = ?, status = ?, pdf_url = ?, pdf_name = ?
            WHERE id = ?
        """, (
            post.slug,
            post.title,
            post.category or "",
            post.image,
            post.author,
            post.date,
            post.description,
            post.content,
            post.status,
            post.pdf_url or "",
            post.pdf_name or "",
            id
        ))
        conn.commit()
        cursor.execute("SELECT * FROM study_material_posts WHERE id = ?", (id,))
        updated_row = cursor.fetchone()
        conn.close()
        return dict(updated_row)
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="A post with this title or slug already exists.")
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

def delete_cloudinary_image_helper(image_url: str, resource_type: str = "image"):
    import os
    import time
    import hashlib
    import requests
    
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "dkxxa3xt0").strip()
    api_key = os.getenv("CLOUDINARY_API_KEY", "").strip()
    api_secret = os.getenv("CLOUDINARY_API_SECRET", "").strip()
    
    if not api_key or not api_secret or not image_url:
        return
        
    try:
        if "raw/upload" in image_url or image_url.lower().endswith(".pdf"):
            resource_type = "raw"
            
        if "res.cloudinary.com/" in image_url:
            cloud_name = image_url.split("res.cloudinary.com/")[1].split("/")[0]

        url_parts = image_url.split("/upload/")
        if len(url_parts) < 2:
            url_parts = image_url.split("/raw/upload/")
            
        if len(url_parts) < 2:
            return

        after_upload = url_parts[1]
        parts = after_upload.split("/")
        if parts[0].startswith("v") and parts[0][1:].isdigit():
            path_with_ext = "/".join(parts[1:])
        else:
            path_with_ext = after_upload

        if resource_type == "raw":
            public_id = path_with_ext
        else:
            public_id = path_with_ext.rsplit(".", 1)[0]

        timestamp = int(time.time())
        string_to_sign = f"public_id={public_id}&timestamp={timestamp}{api_secret}"
        signature = hashlib.sha1(string_to_sign.encode("utf-8")).hexdigest()

        payload = {
            "public_id": public_id,
            "api_key": api_key,
            "timestamp": timestamp,
            "signature": signature,
        }
        if resource_type == "raw":
            payload["resource_type"] = "raw"

        res = requests.post(
            f"https://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/destroy",
            data=payload
        )
        print("Cloudinary delete response:", res.json())
    except Exception as e:
        print("Failed to delete resource from Cloudinary:", str(e))

@router.delete("/{id}")
def delete_post(id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM study_material_posts WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
        
    image_url = row["image"]
    if image_url and "education_banner" not in image_url:
        delete_cloudinary_image_helper(image_url, resource_type="image")

    pdf_url_val = row["pdf_url"]
    if pdf_url_val:
        import json
        if pdf_url_val.startswith("["):
            try:
                attachments = json.loads(pdf_url_val)
                for att in attachments:
                    url = att.get("url")
                    if url:
                        delete_cloudinary_image_helper(url, resource_type="raw")
            except Exception:
                delete_cloudinary_image_helper(pdf_url_val, resource_type="raw")
        else:
            delete_cloudinary_image_helper(pdf_url_val, resource_type="raw")

    cursor.execute("DELETE FROM study_material_posts WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Post deleted successfully"}

@router.put("/{id}/status", response_model=PostResponse)
def toggle_post_status(id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM study_material_posts WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
        
    new_status = "Draft" if row["status"] == "Published" else "Published"
    cursor.execute("UPDATE study_material_posts SET status = ? WHERE id = ?", (new_status, id))
    conn.commit()
    
    cursor.execute("SELECT * FROM study_material_posts WHERE id = ?", (id,))
    updated_row = cursor.fetchone()
    conn.close()
    return dict(updated_row)
