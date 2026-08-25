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
    max_discount_amount: Optional[float] = None
    max_discount: Optional[float] = None
    max_uses: Optional[int] = None
    expiry_date: Optional[str] = None
    valid_until: Optional[str] = None
    is_active: Optional[bool] = True
    show_in_ui: Optional[bool] = True
    free_delivery: Optional[bool] = False
    first_order_only: Optional[bool] = False
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
    max_discount_amount: Optional[float] = None
    max_discount: Optional[float] = None
    max_uses: Optional[int] = None
    expiry_date: Optional[str] = None
    valid_until: Optional[str] = None
    is_active: Optional[bool] = None
    show_in_ui: Optional[bool] = None
    free_delivery: Optional[bool] = None
    first_order_only: Optional[bool] = None
    benefit: Optional[str] = None
    benefits: Optional[str] = None
    applicable_products: Optional[str] = None
    product_ids: Optional[str] = None


import re

def _normalize_coupon_row(row: dict) -> dict:
    if not isinstance(row, dict):
        return row
    notes = row.get("Notes") or ""
    if notes:
        parts = re.split(r'[;\n]', str(notes))
        for part in parts:
            if ":" in part:
                k, v = part.split(":", 1)
                k_clean = k.strip()
                v_clean = v.strip()
                if k_clean not in row or row[k_clean] is None or row[k_clean] == "":
                    row[k_clean] = v_clean
    if "first_order_only" in row:
        val = row["first_order_only"]
        row["first_order_only"] = str(val).lower() in ("true", "1", "yes")
    else:
        row["first_order_only"] = False

    max_disc = row.get("max_discount_amount") if row.get("max_discount_amount") is not None else row.get("max_discount")
    if max_disc is not None and str(max_disc).strip() != "":
        try:
            row["max_discount_amount"] = float(max_disc)
            row["max_discount"] = float(max_disc)
        except (ValueError, TypeError):
            pass
    return row


@router.get("/", summary="List coupons")
async def list_coupons(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
):
    """Return a paginated list of coupons from Baserow."""
    res = await client.get_rows(
        TABLE_IDS["coupons"],
        page=page,
        size=size,
        search=search,
    )
    if isinstance(res, dict) and "results" in res:
        res["results"] = [_normalize_coupon_row(r) for r in res["results"]]
    return res


@router.get("/{row_id}", summary="Get a single coupon")
async def get_coupon(row_id: int):
    """Return a single coupon by Baserow row ID."""
    res = await client.get_row(TABLE_IDS["coupons"], row_id)
    return _normalize_coupon_row(res)


@router.post("/", summary="Create coupon")
async def create_coupon(body: CouponCreate):
    data = body.model_dump(exclude_none=True)

    # Ensure minimum_order_amount is set for Baserow table 766
    min_val = data.get("minimum_order_amount") if data.get("minimum_order_amount") is not None else data.get("min_order_amount")
    if min_val is not None:
        int_min = int(round(min_val))
        data["minimum_order_amount"] = int_min
        data["min_order_amount"] = int_min

    # Ensure max_discount_amount is set
    max_disc_val = data.get("max_discount_amount") if data.get("max_discount_amount") is not None else data.get("max_discount")
    if max_disc_val is not None:
        int_max = int(round(max_disc_val))
        data["max_discount_amount"] = int_max
        data["max_discount"] = int_max

    # Ensure valid_until is set for Baserow
    date_val = data.get("valid_until") or data.get("expiry_date")
    if date_val:
        data["valid_until"] = date_val
        data["expiry_date"] = date_val

    for field in ["discount_value", "discount_percentage", "minimum_order_amount", "min_order_amount", "max_discount_amount", "max_discount"]:
        if field in data and data[field] is not None:
            data[field] = int(round(data[field]))
    res = await client.create_row(TABLE_IDS["coupons"], data)
    return _normalize_coupon_row(res)


@router.patch("/{row_id}", summary="Update coupon")
async def update_coupon(row_id: int, body: CouponUpdate):
    data = body.model_dump(exclude_none=True)

    # Ensure minimum_order_amount is set for Baserow table 766
    min_val = data.get("minimum_order_amount") if data.get("minimum_order_amount") is not None else data.get("min_order_amount")
    if min_val is not None:
        int_min = int(round(min_val))
        data["minimum_order_amount"] = int_min
        data["min_order_amount"] = int_min

    # Ensure max_discount_amount is set
    max_disc_val = data.get("max_discount_amount") if data.get("max_discount_amount") is not None else data.get("max_discount")
    if max_disc_val is not None:
        int_max = int(round(max_disc_val))
        data["max_discount_amount"] = int_max
        data["max_discount"] = int_max

    # Ensure valid_until is set for Baserow
    date_val = data.get("valid_until") or data.get("expiry_date")
    if date_val:
        data["valid_until"] = date_val
        data["expiry_date"] = date_val

    # If applicable_products or product_ids is explicitly set to empty string ""
    if body.applicable_products == "" or body.product_ids == "":
        try:
            current = await client.get_row(TABLE_IDS["coupons"], row_id)
            current_notes = current.get("Notes") or ""
            if "applicable_products" in current_notes or "product_ids" in current_notes:
                new_notes_parts = [p for p in re.split(r'[;\n]', current_notes) if not (p.strip().startswith("applicable_products:") or p.strip().startswith("product_ids:"))]
                data["Notes"] = "; ".join(new_notes_parts).strip()
        except Exception:
            pass

    for field in ["discount_value", "discount_percentage", "minimum_order_amount", "min_order_amount", "max_discount_amount", "max_discount"]:
        if field in data and data[field] is not None:
            data[field] = int(round(data[field]))
    res = await client.update_row(TABLE_IDS["coupons"], row_id, data)
    return _normalize_coupon_row(res)


@router.delete("/{row_id}", summary="Delete coupon")
async def delete_coupon(row_id: int):
    await client.delete_row(TABLE_IDS["coupons"], row_id)
    return {"success": True}
