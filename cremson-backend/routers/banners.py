import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from config import BASEROW_URL, BASEROW_TOKEN, TABLE_IDS

router = APIRouter()


def _get_table_id() -> int:
    table_id = TABLE_IDS.get("banner_images", 0)
    if not table_id:
        raise HTTPException(
            status_code=503,
            detail="Banner Images table not configured. Set TABLE_BANNER_IMAGES in .env",
        )
    return table_id


def _row_to_banner(row: dict) -> dict:
    return {
        "id": row["id"],
        "image_url": row.get("image_url") or "",
        "title": row.get("title") or "",
        "sort_order": row.get("sort_order") or 0,
        "is_active": bool(row.get("is_active")),
    }


class BannerCreate(BaseModel):
    image_url: str
    title: str = ""
    sort_order: int = 0
    is_active: bool = True


class BannerUpdate(BaseModel):
    image_url: Optional[str] = None
    title: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


@router.get("/")
async def list_banners(active_only: bool = False):
    table_id = _get_table_id()
    headers = {"Authorization": f"Token {BASEROW_TOKEN}"}
    url = (
        f"{BASEROW_URL}/api/database/rows/table/{table_id}/"
        f"?user_field_names=true&size=100&order_by=sort_order"
    )

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()
        rows = resp.json().get("results", [])

    banners = [_row_to_banner(r) for r in rows]
    if active_only:
        banners = [b for b in banners if b["is_active"]]
    return banners


@router.post("/")
async def create_banner(body: BannerCreate):
    table_id = _get_table_id()
    headers = {
        "Authorization": f"Token {BASEROW_TOKEN}",
        "Content-Type": "application/json",
    }
    url = f"{BASEROW_URL}/api/database/rows/table/{table_id}/?user_field_names=true"
    payload = {
        "image_url": body.image_url,
        "title": body.title,
        "sort_order": body.sort_order,
        "is_active": body.is_active,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        return _row_to_banner(resp.json())


@router.patch("/{banner_id}")
async def update_banner(banner_id: int, body: BannerUpdate):
    table_id = _get_table_id()
    headers = {
        "Authorization": f"Token {BASEROW_TOKEN}",
        "Content-Type": "application/json",
    }
    url = f"{BASEROW_URL}/api/database/rows/table/{table_id}/{banner_id}/?user_field_names=true"
    payload = {k: v for k, v in body.model_dump().items() if v is not None}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.patch(url, json=payload, headers=headers)
        resp.raise_for_status()
        return _row_to_banner(resp.json())


@router.delete("/{banner_id}")
async def delete_banner(banner_id: int):
    table_id = _get_table_id()
    headers = {"Authorization": f"Token {BASEROW_TOKEN}"}
    url = f"{BASEROW_URL}/api/database/rows/table/{table_id}/{banner_id}/"

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.delete(url, headers=headers)
        resp.raise_for_status()
    return {"success": True}
