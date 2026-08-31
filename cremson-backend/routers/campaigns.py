from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from db.campaigns_db import get_campaign_db
import sqlite3
import json
from datetime import datetime, timezone

router = APIRouter()
security = HTTPBearer(auto_error=False)

ADMIN_EMAIL = "cremsonpublications@gmail.com"


# ─── Auth helpers ──────────────────────────────────────────────────────────────

def _get_admin_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Require a valid admin token on mutation endpoints."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required.")
    import os
    from jose import jwt, JWTError
    secret = os.getenv("JWT_SECRET", "supersecret")
    try:
        payload = jwt.decode(credentials.credentials, secret, algorithms=["HS256"])
        if not payload.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required.")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")


# ─── Pydantic schemas ──────────────────────────────────────────────────────────

class CampaignCreate(BaseModel):
    slug: str
    title: str
    is_active: bool = True
    data: dict = {}


class CampaignUpdate(BaseModel):
    slug: Optional[str] = None
    title: Optional[str] = None
    is_active: Optional[bool] = None
    data: Optional[dict] = None


# ─── Row mapper ────────────────────────────────────────────────────────────────

def _row_to_campaign(row: sqlite3.Row, full: bool = False) -> dict:
    r = dict(row)
    campaign_data = {}
    try:
        campaign_data = json.loads(r.get("data") or "{}")
    except (json.JSONDecodeError, TypeError):
        campaign_data = {}

    result = {
        "id": r["id"],
        "slug": r["slug"],
        "title": r["title"],
        "is_active": bool(r["is_active"]),
        "created_at": r.get("created_at", ""),
        "updated_at": r.get("updated_at", ""),
    }

    if full:
        result["data"] = campaign_data
        # Flatten hero_headline and hero_image for convenience
        hero = campaign_data.get("hero", {})
        result["hero_headline"] = hero.get("headline", "")
        result["hero_image"] = hero.get("image", "")
    else:
        # For list view, include hero_headline and hero_image from nested data
        hero = campaign_data.get("hero", {})
        result["hero_headline"] = hero.get("headline", "")
        result["hero_image"] = hero.get("image", "")

    return result


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/")
def list_campaigns():
    """List all campaigns (id, slug, title, is_active, hero_headline, hero_image)."""
    conn = get_campaign_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM landing_campaigns ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_campaign(r, full=False) for r in rows]


@router.get("/{slug}")
def get_campaign(slug: str):
    """Get a single campaign by slug. Returns the full data JSON."""
    conn = get_campaign_db()
    cursor = conn.cursor()

    # Allow lookup by numeric ID as well
    if slug.isdigit():
        cursor.execute("SELECT * FROM landing_campaigns WHERE id = ?", (int(slug),))
    else:
        cursor.execute("SELECT * FROM landing_campaigns WHERE slug = ?", (slug,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    return _row_to_campaign(row, full=True)


@router.post("/")
def create_campaign(body: CampaignCreate, _admin=Depends(_get_admin_token)):
    """Create a new landing campaign. Admin only."""
    conn = get_campaign_db()
    cursor = conn.cursor()
    now = _now_iso()
    data_json = json.dumps(body.data)

    try:
        cursor.execute(
            """
            INSERT INTO landing_campaigns (slug, title, is_active, data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (body.slug.strip(), body.title.strip(), int(body.is_active), data_json, now, now),
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM landing_campaigns WHERE id = ?", (new_id,))
        new_row = cursor.fetchone()
        conn.close()
        return _row_to_campaign(new_row, full=True)
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="A campaign with this slug already exists.")
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{campaign_id}")
def update_campaign(campaign_id: int, body: CampaignUpdate, _admin=Depends(_get_admin_token)):
    """Update an existing campaign by ID. Admin only."""
    conn = get_campaign_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM landing_campaigns WHERE id = ?", (campaign_id,))
    existing = cursor.fetchone()

    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Campaign not found.")

    existing_dict = dict(existing)
    now = _now_iso()

    slug = body.slug.strip() if body.slug is not None else existing_dict["slug"]
    title = body.title.strip() if body.title is not None else existing_dict["title"]
    is_active = int(body.is_active) if body.is_active is not None else existing_dict["is_active"]

    if body.data is not None:
        data_json = json.dumps(body.data)
    else:
        data_json = existing_dict.get("data", "{}")

    try:
        cursor.execute(
            """
            UPDATE landing_campaigns
            SET slug = ?, title = ?, is_active = ?, data = ?, updated_at = ?
            WHERE id = ?
            """,
            (slug, title, is_active, data_json, now, campaign_id),
        )
        conn.commit()
        cursor.execute("SELECT * FROM landing_campaigns WHERE id = ?", (campaign_id,))
        updated_row = cursor.fetchone()
        conn.close()
        return _row_to_campaign(updated_row, full=True)
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="A campaign with this slug already exists.")
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, _admin=Depends(_get_admin_token)):
    """Delete a campaign by ID. Admin only."""
    conn = get_campaign_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM landing_campaigns WHERE id = ?", (campaign_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Campaign not found.")

    cursor.execute("DELETE FROM landing_campaigns WHERE id = ?", (campaign_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Campaign deleted successfully."}
