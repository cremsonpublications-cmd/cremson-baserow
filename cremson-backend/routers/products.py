from fastapi import APIRouter, Query
from typing import Optional
from pydantic import BaseModel
from services.baserow import BaserowClient
from config import TABLE_IDS

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

    return await client.get_rows(
        TABLE_IDS["products"],
        page=page,
        size=size,
        search=search,
        filters=filters if filters else None,
    )


@router.get("/{row_id}", summary="Get a single product")
async def get_product(row_id: int):
    """Return a single product by Baserow row ID."""
    return await client.get_row(TABLE_IDS["products"], row_id)


@router.post("/", summary="Create product")
async def create_product(body: ProductCreate):
    data = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if "class_" in data:
        data["class"] = data.pop("class_")
    return await client.create_row(TABLE_IDS["products"], data)


@router.patch("/{row_id}", summary="Update product")
async def update_product(row_id: int, body: ProductUpdate):
    data = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if "class_" in data:
        data["class"] = data.pop("class_")
    return await client.update_row(TABLE_IDS["products"], row_id, data)


@router.delete("/{row_id}", summary="Delete product")
async def delete_product(row_id: int):
    await client.delete_row(TABLE_IDS["products"], row_id)
    return {"success": True}
