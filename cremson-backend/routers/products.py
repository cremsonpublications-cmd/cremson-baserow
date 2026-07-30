from fastapi import APIRouter, Query
from typing import Optional
from pydantic import BaseModel
from services.baserow import BaserowClient
from config import TABLE_IDS
import json

router = APIRouter()
client = BaserowClient()


class ProductCreate(BaseModel):
    name: str
    author: Optional[str] = None
    mrp: Optional[float] = None
    price: Optional[float] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    isbn: Optional[str] = None
    stock_status: Optional[str] = "in_stock"
    status: Optional[str] = None
    is_active: Optional[bool] = True
    main_image: Optional[str] = None
    class_: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    author: Optional[str] = None
    mrp: Optional[float] = None
    price: Optional[float] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    isbn: Optional[str] = None
    stock_status: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    main_image: Optional[str] = None
    class_: Optional[str] = None


def map_product_out(row: dict) -> dict:
    if not row:
        return row
    
    # 1. Map price
    mrp_val = row.get("mrp")
    try:
        mrp = float(mrp_val) if mrp_val is not None else 0.0
    except (ValueError, TypeError):
        mrp = 0.0

    discount_val = row.get("own_discount_percentage")
    try:
        discount_pct = float(discount_val) if discount_val is not None else 0.0
    except (ValueError, TypeError):
        discount_pct = 0.0

    has_discount = bool(row.get("has_own_discount"))
    
    if has_discount and discount_pct > 0:
        price = round(mrp * (1.0 - discount_pct / 100.0))
    else:
        price = mrp

    row["price"] = price

    # 2. Map class_
    classes_str = row.get("classes")
    if classes_str:
        try:
            classes_arr = json.loads(classes_str)
            if isinstance(classes_arr, list) and len(classes_arr) > 0:
                row["class_"] = classes_arr[0]
            else:
                row["class_"] = ""
        except Exception:
            row["class_"] = ""
    else:
        row["class_"] = ""
            
    return row


def map_product_in(data: dict, existing_mrp: float = 0.0) -> dict:
    # Handle price mapping to discount fields
    if "price" in data:
        price = data.pop("price")
        # mrp can come from data or from existing_mrp
        mrp_val = data.get("mrp")
        if mrp_val is not None:
            try:
                mrp = float(mrp_val)
            except (ValueError, TypeError):
                mrp = 0.0
        else:
            mrp = existing_mrp

        if price is not None and mrp > 0:
            if price < mrp:
                data["has_own_discount"] = True
                data["own_discount_percentage"] = int(round(((mrp - price) / mrp) * 100))
            else:
                data["has_own_discount"] = False
                data["own_discount_percentage"] = 0
        else:
            data["has_own_discount"] = False
            data["own_discount_percentage"] = 0

    # Handle class_ mapping to classes
    if "class_" in data:
        class_val = data.pop("class_")
        if class_val:
            data["classes"] = json.dumps([class_val])
        else:
            data["classes"] = json.dumps([])

    return data


@router.get("/", summary="List products")
async def list_products(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
):
    """Return a paginated list of products. Optionally filter by category_id and/or is_active."""
    filters = {}
    if category_id is not None:
        filters["category_id"] = category_id
    if is_active is not None:
        filters["is_active"] = str(is_active).lower()

    res = await client.get_rows(
        TABLE_IDS["products"],
        page=page,
        size=size,
        search=search,
        filters=filters if filters else None,
    )
    if isinstance(res, dict) and "results" in res:
        res["results"] = [map_product_out(r) for r in res["results"]]
    elif isinstance(res, list):
        res = [map_product_out(r) for r in res]
    return res


@router.get("/{row_id}", summary="Get a single product")
async def get_product(row_id: int):
    """Return a single product by Baserow row ID."""
    row = await client.get_row(TABLE_IDS["products"], row_id)
    return map_product_out(row)


@router.post("/", summary="Create product")
async def create_product(body: ProductCreate):
    data = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    data = map_product_in(data)
    row = await client.create_row(TABLE_IDS["products"], data)
    return map_product_out(row)


@router.patch("/{row_id}", summary="Update product")
async def update_product(row_id: int, body: ProductUpdate):
    data = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    
    existing_mrp = 0.0
    if "price" in data and "mrp" not in data:
        # Fetch the existing product to get mrp
        try:
            existing = await client.get_row(TABLE_IDS["products"], row_id)
            existing_mrp_val = existing.get("mrp")
            existing_mrp = float(existing_mrp_val) if existing_mrp_val is not None else 0.0
        except Exception:
            pass
            
    data = map_product_in(data, existing_mrp)
    row = await client.update_row(TABLE_IDS["products"], row_id, data)
    return map_product_out(row)


@router.delete("/{row_id}", summary="Delete product")
async def delete_product(row_id: int):
    await client.delete_row(TABLE_IDS["products"], row_id)
    return {"success": True}

