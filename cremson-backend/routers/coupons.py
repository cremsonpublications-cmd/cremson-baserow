from fastapi import APIRouter, Query
from typing import Optional
from pydantic import BaseModel
from services.baserow import BaserowClient
from config import TABLE_IDS

router = APIRouter()
client = BaserowClient()


class CouponCreate(BaseModel):
    code: str
    discount_type: Optional[str] = "percentage"
    discount_value: Optional[float] = None
    discount_percentage: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    max_uses: Optional[int] = None
    expiry_date: Optional[str] = None
    valid_until: Optional[str] = None
    is_active: Optional[bool] = True
    show_in_ui: Optional[bool] = True
    free_delivery: Optional[bool] = False
    delivery_discount_amount: Optional[float] = None
    benefit: Optional[str] = None
    benefits: Optional[str] = None


class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    discount_percentage: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    max_uses: Optional[int] = None
    expiry_date: Optional[str] = None
    valid_until: Optional[str] = None
    is_active: Optional[bool] = None
    show_in_ui: Optional[bool] = None
    free_delivery: Optional[bool] = None
    delivery_discount_amount: Optional[float] = None
    benefit: Optional[str] = None
    benefits: Optional[str] = None


@router.get("/", summary="List coupons")
async def list_coupons(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
):
    """Return a paginated list of coupons from Baserow."""
    return await client.get_rows(
        TABLE_IDS["coupons"],
        page=page,
        size=size,
        search=search,
    )


@router.get("/{row_id}", summary="Get a single coupon")
async def get_coupon(row_id: int):
    """Return a single coupon by Baserow row ID."""
    return await client.get_row(TABLE_IDS["coupons"], row_id)


@router.post("/", summary="Create coupon")
async def create_coupon(body: CouponCreate):
    return await client.create_row(TABLE_IDS["coupons"], body.model_dump(exclude_none=True))


@router.patch("/{row_id}", summary="Update coupon")
async def update_coupon(row_id: int, body: CouponUpdate):
    return await client.update_row(TABLE_IDS["coupons"], row_id, body.model_dump(exclude_none=True))


@router.delete("/{row_id}", summary="Delete coupon")
async def delete_coupon(row_id: int):
    await client.delete_row(TABLE_IDS["coupons"], row_id)
    return {"success": True}
