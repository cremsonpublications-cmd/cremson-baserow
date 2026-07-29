from fastapi import APIRouter, Query
from typing import Optional
from pydantic import BaseModel
from services.baserow import BaserowClient
from config import TABLE_IDS

router = APIRouter()
client = BaserowClient()


class OrderStatusUpdate(BaseModel):
    order_status: str


@router.get("/", summary="List orders")
async def list_orders(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
    order_status: str = Query(None, description="Filter by order status value"),
    user_id: str = Query(None, description="Filter orders by user ID"),
    email: str = Query(None, description="Filter orders by user email"),
):
    """Return a paginated list of orders. Optionally filter by order_status, user_id, or email."""
    filters = {}
    if order_status is not None:
        filters["order_status"] = order_status

    contains_filters = {}
    if email is not None:
        contains_filters["user_info"] = f'"email": "{email}"'
    elif user_id is not None:
        contains_filters["user_info"] = f'"userId": {user_id}'

    return await client.get_rows(
        TABLE_IDS["orders"],
        page=page,
        size=size,
        search=search,
        filters=filters if filters else None,
        contains_filters=contains_filters if contains_filters else None,
        order_by="-order_date",
    )


@router.get("/{row_id}", summary="Get a single order")
async def get_order(row_id: int):
    """Return a single order by Baserow row ID."""
    return await client.get_row(TABLE_IDS["orders"], row_id)


@router.patch("/{row_id}", summary="Update order status")
async def update_order(row_id: int, body: OrderStatusUpdate):
    return await client.update_row(TABLE_IDS["orders"], row_id, body.model_dump(exclude_none=True))
