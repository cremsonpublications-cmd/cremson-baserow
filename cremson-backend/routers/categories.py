from fastapi import APIRouter, Query
from typing import Optional
from pydantic import BaseModel
from services.baserow import BaserowClient
from config import TABLE_IDS

router = APIRouter()
client = BaserowClient()


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sub_categories: Optional[str] = None
    offer_type: Optional[str] = None
    discount_value: Optional[float] = None
    is_active: Optional[bool] = True


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sub_categories: Optional[str] = None
    offer_type: Optional[str] = None
    discount_value: Optional[float] = None
    is_active: Optional[bool] = None


def _clean_category(row: dict) -> dict:
    if not isinstance(row, dict):
        return row
    pct = row.get("offer_percentage")
    amt = row.get("offer_amount")
    return {
        "id": row.get("id"),
        "name": row.get("Name") or row.get("name") or row.get("main_category_name") or "",
        "sub_categories": row.get("sub_categories") or row.get("Notes") or "",
        "offer_type": row.get("offer_type") or "none",
        "offer_percentage": float(pct) if pct is not None else None,
        "offer_amount": float(amt) if amt is not None else None,
        "is_active": row.get("is_active") if row.get("is_active") is not None else row.get("Active", True),
    }


@router.get("/", summary="List categories")
async def list_categories(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
):
    """Return a paginated list of categories from Baserow."""
    res = await client.get_rows(
        TABLE_IDS["categories"],
        page=page,
        size=size,
        search=search,
    )
    items = res.get("results") or res.get("items") or []
    cleaned_items = [_clean_category(item) for item in items if item.get("Name") != "SYSTEM_GLOBAL_SETTINGS" and item.get("name") != "SYSTEM_GLOBAL_SETTINGS"]
    return {
        "count": len(cleaned_items),
        "next": res.get("next"),
        "previous": res.get("previous"),
        "results": cleaned_items,
    }


@router.get("/{row_id}", summary="Get a single category")
async def get_category(row_id: int):
    """Return a single category by Baserow row ID."""
    row = await client.get_row(TABLE_IDS["categories"], row_id)
    return _clean_category(row)


@router.post("/", summary="Create category")
async def create_category(body: CategoryCreate):
    data = body.model_dump(exclude_none=True)
    payload = {
        "Name": data.get("name", ""),
        "offer_type": data.get("offer_type", "none"),
        "is_active": data.get("is_active", True),
    }
    if "sub_categories" in data:
        payload["Notes"] = data["sub_categories"]
        payload["sub_categories"] = data["sub_categories"]
    val = data.get("discount_value")
    if data.get("offer_type") == "percentage" and val is not None:
        payload["offer_percentage"] = str(int(val)) if float(val).is_integer() else str(val)
    elif data.get("offer_type") == "flat" and val is not None:
        payload["offer_amount"] = str(int(val)) if float(val).is_integer() else str(val)

    res = await client.create_row(TABLE_IDS["categories"], payload)
    return _clean_category(res)


@router.patch("/{row_id}", summary="Update category")
async def update_category(row_id: int, body: CategoryUpdate):
    data = body.model_dump(exclude_none=True)
    payload = {}
    if "name" in data:
        payload["Name"] = data["name"]
    if "sub_categories" in data:
        payload["Notes"] = data["sub_categories"]
        payload["sub_categories"] = data["sub_categories"]
    if "is_active" in data:
        payload["is_active"] = data["is_active"]
    if "offer_type" in data:
        payload["offer_type"] = data["offer_type"]
    if "discount_value" in data:
        val = data["discount_value"]
        if data.get("offer_type") == "percentage" and val is not None:
            payload["offer_percentage"] = str(int(val)) if float(val).is_integer() else str(val)
            payload["offer_amount"] = None
        elif data.get("offer_type") == "flat" and val is not None:
            payload["offer_amount"] = str(int(val)) if float(val).is_integer() else str(val)
            payload["offer_percentage"] = None

    res = await client.update_row(TABLE_IDS["categories"], row_id, payload)
    return _clean_category(res)


@router.delete("/{row_id}", summary="Delete category")
async def delete_category(row_id: int):
    await client.delete_row(TABLE_IDS["categories"], row_id)
    return {"success": True}
