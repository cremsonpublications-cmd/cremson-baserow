from fastapi import APIRouter, Query
import asyncio
from services.baserow import BaserowClient
from config import TABLE_IDS

router = APIRouter()
client = BaserowClient()


async def _resolve_review_products(rows: list):
    """Resolve product_id to product name in-place for each review row."""
    product_ids = {row["product_id"] for row in rows if row.get("product_id")}
    if not product_ids:
        return

    async def fetch_product(pid):
        try:
            r = await client.get_row(TABLE_IDS["products"], pid)
            return pid, r.get("name", "") or r.get("Name", "")
        except Exception:
            return pid, ""

    product_names = dict(await asyncio.gather(*[fetch_product(pid) for pid in product_ids]))

    for row in rows:
        pid = row.get("product_id")
        if pid and pid in product_names:
            row["product_name"] = product_names[pid]


@router.get("/", summary="List reviews")
async def list_reviews(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
):
    """Return a paginated list of reviews from Baserow with product names resolved."""
    res = await client.get_rows(
        TABLE_IDS["reviews"],
        page=page,
        size=size,
        search=search,
    )
    await _resolve_review_products(res.get("results", []))
    return res


@router.get("/{row_id}", summary="Get a single review")
async def get_review(row_id: int):
    """Return a single review by Baserow row ID with product name resolved."""
    row = await client.get_row(TABLE_IDS["reviews"], row_id)
    await _resolve_review_products([row])
    return row


@router.delete("/{row_id}", summary="Delete review")
async def delete_review(row_id: int):
    await client.delete_row(TABLE_IDS["reviews"], row_id)
    return {"success": True}
