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
    is_active: Optional[bool] = True


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/", summary="List categories")
async def list_categories(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
):
    """Return a paginated list of categories from Baserow."""
    return await client.get_rows(
        TABLE_IDS["categories"],
        page=page,
        size=size,
        search=search,
    )


@router.get("/{row_id}", summary="Get a single category")
async def get_category(row_id: int):
    """Return a single category by Baserow row ID."""
    return await client.get_row(TABLE_IDS["categories"], row_id)


@router.post("/", summary="Create category")
async def create_category(body: CategoryCreate):
    return await client.create_row(TABLE_IDS["categories"], body.model_dump(exclude_none=True))


@router.patch("/{row_id}", summary="Update category")
async def update_category(row_id: int, body: CategoryUpdate):
    return await client.update_row(TABLE_IDS["categories"], row_id, body.model_dump(exclude_none=True))


@router.delete("/{row_id}", summary="Delete category")
async def delete_category(row_id: int):
    await client.delete_row(TABLE_IDS["categories"], row_id)
    return {"success": True}
