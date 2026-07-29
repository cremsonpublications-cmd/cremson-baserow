from fastapi import APIRouter, Query
from services.baserow import BaserowClient
from config import TABLE_IDS

router = APIRouter()
client = BaserowClient()


@router.get("/", summary="List reviews")
async def list_reviews(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
):
    """Return a paginated list of reviews from Baserow."""
    return await client.get_rows(
        TABLE_IDS["reviews"],
        page=page,
        size=size,
        search=search,
    )


@router.get("/{row_id}", summary="Get a single review")
async def get_review(row_id: int):
    """Return a single review by Baserow row ID."""
    return await client.get_row(TABLE_IDS["reviews"], row_id)


@router.delete("/{row_id}", summary="Delete review")
async def delete_review(row_id: int):
    await client.delete_row(TABLE_IDS["reviews"], row_id)
    return {"success": True}
