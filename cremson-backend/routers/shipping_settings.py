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


@router.get("/{row_id}", summary="Get a single shipping setting")
async def get_shipping_setting(row_id: int):
    """Return a single shipping setting row by Baserow row ID."""
    return await client.get_row(TABLE_IDS["shipping_settings"], row_id)


@router.patch("/{row_id}", summary="Update shipping setting")
async def update_shipping_setting(row_id: int, body: ShippingSettingUpdate):
    return await client.update_row(TABLE_IDS["shipping_settings"], row_id, body.model_dump(exclude_none=True))
