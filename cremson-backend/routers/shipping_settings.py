from fastapi import APIRouter, Query
from typing import Optional, Any
from pydantic import BaseModel
from services.baserow import BaserowClient
from config import TABLE_IDS

router = APIRouter()
client = BaserowClient()


class ShippingSettingUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[Any] = None
    description: Optional[str] = None
    shipping_charge: Optional[Any] = None
    free_delivery_threshold: Optional[Any] = None
    shipping_enabled: Optional[bool] = None
    Name: Optional[str] = None
    Notes: Optional[str] = None
    Active: Optional[bool] = None


@router.get("/", summary="List shipping settings")
async def list_shipping_settings(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
):
    """Return all shipping settings from Baserow (typically a small table)."""
    return await client.get_rows(
        TABLE_IDS["shipping_settings"],
        page=page,
        size=size,
    )


# IMPORTANT: /active must be declared BEFORE /{row_id} so FastAPI doesn't
# try to parse the literal string "active" as an integer row_id.
@router.get("/active", summary="Get active shipping config (public)")
async def get_active_shipping_config():
    """Return the active shipping charge and free delivery threshold for use in checkout."""
    rows = await client.get_rows(TABLE_IDS["shipping_settings"], page=1, size=10)
    results = rows.get("results", [])
    setting = results[0] if results else {}
    raw_charge = setting.get("shipping_charge")
    raw_threshold = setting.get("free_delivery_threshold")
    return {
        "shipping_charge": float(raw_charge) if raw_charge is not None else None,
        "free_delivery_threshold": float(raw_threshold) if raw_threshold is not None else None,
    }


@router.get("/{row_id}", summary="Get a single shipping setting")
async def get_shipping_setting(row_id: int):
    """Return a single shipping setting row by Baserow row ID."""
    return await client.get_row(TABLE_IDS["shipping_settings"], row_id)


@router.patch("/{row_id}", summary="Update shipping setting")
async def update_shipping_setting(row_id: int, body: ShippingSettingUpdate):
    return await client.update_row(TABLE_IDS["shipping_settings"], row_id, body.model_dump(exclude_none=True))
