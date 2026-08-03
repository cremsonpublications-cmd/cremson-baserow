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
    minimum_order_amount: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_uses: Optional[int] = None
    expiry_date: Optional[str] = None
    valid_until: Optional[str] = None
    is_active: Optional[bool] = True
    show_in_ui: Optional[bool] = True
    free_delivery: Optional[bool] = False
    benefit: Optional[str] = None
    benefits: Optional[str] = None
    applicable_products: Optional[str] = None
    product_ids: Optional[str] = None


class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    discount_percentage: Optional[float] = None
    minimum_order_amount: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_uses: Optional[int] = None
    expiry_date: Optional[str] = None
    valid_until: Optional[str] = None
    is_active: Optional[bool] = None
    show_in_ui: Optional[bool] = None
    free_delivery: Optional[bool] = None
    benefit: Optional[str] = None
    benefits: Optional[str] = None
    applicable_products: Optional[str] = None
    product_ids: Optional[str] = None


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
    data = body.model_dump(exclude_none=True)

    # Ensure minimum_order_amount is set for Baserow table 766
    min_val = data.get("minimum_order_amount") if data.get("minimum_order_amount") is not None else data.get("min_order_amount")
    if min_val is not None:
        int_min = int(round(min_val))
        data["minimum_order_amount"] = int_min
        data["min_order_amount"] = int_min

    # Ensure valid_until is set for Baserow
    date_val = data.get("valid_until") or data.get("expiry_date")
    if date_val:
        data["valid_until"] = date_val
        data["expiry_date"] = date_val

    for field in ["discount_value", "discount_percentage", "minimum_order_amount", "min_order_amount"]:
        if field in data and data[field] is not None:
            data[field] = int(round(data[field]))
    return await client.create_row(TABLE_IDS["coupons"], data)


@router.patch("/{row_id}", summary="Update coupon")
async def update_coupon(row_id: int, body: CouponUpdate):
    data = body.model_dump(exclude_none=True)

    # Ensure minimum_order_amount is set for Baserow table 766
    min_val = data.get("minimum_order_amount") if data.get("minimum_order_amount") is not None else data.get("min_order_amount")
    if min_val is not None:
        int_min = int(round(min_val))
        data["minimum_order_amount"] = int_min
        data["min_order_amount"] = int_min

    # Ensure valid_until is set for Baserow
    date_val = data.get("valid_until") or data.get("expiry_date")
    if date_val:
        data["valid_until"] = date_val
        data["expiry_date"] = date_val

    for field in ["discount_value", "discount_percentage", "minimum_order_amount", "min_order_amount"]:
        if field in data and data[field] is not None:
            data[field] = int(round(data[field]))
    return await client.update_row(TABLE_IDS["coupons"], row_id, data)


@router.delete("/{row_id}", summary="Delete coupon")
async def delete_coupon(row_id: int):
    await client.delete_row(TABLE_IDS["coupons"], row_id)
    return {"success": True}
