from fastapi import APIRouter, Query, Request
from typing import Optional
from pydantic import BaseModel
from services.baserow import BaserowClient
from config import TABLE_IDS

router = APIRouter()
client = BaserowClient()


class SpecimenStatusUpdate(BaseModel):
    status: str


@router.get("/", summary="List specimen requests")
async def list_specimen_requests(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
):
    """Return a paginated list of specimen requests from Baserow."""
    filters = {k: v for k, v in request.query_params.items() if k not in ["page", "size", "search"] and v}
    return await client.get_rows(
        TABLE_IDS["specimen_requests"],
        page=page,
        size=size,
        search=search,
        filters=filters,
        order_by="-SpecimenID",
    )


@router.get("/{row_id}", summary="Get a single specimen request")
async def get_specimen_request(row_id: int):
    """Return a single specimen request by Baserow row ID."""
    return await client.get_row(TABLE_IDS["specimen_requests"], row_id)


@router.post("/", summary="Create specimen request")
async def create_specimen_request(body: dict):
    return await client.create_row(TABLE_IDS["specimen_requests"], body)


@router.patch("/{row_id}", summary="Update specimen request")
async def update_specimen_request(row_id: int, body: dict):
    return await client.update_row(TABLE_IDS["specimen_requests"], row_id, body)


@router.delete("/{row_id}", summary="Delete specimen request")
async def delete_specimen_request(row_id: int):
    await client.delete_row(TABLE_IDS["specimen_requests"], row_id)
    return {"message": "Specimen request deleted successfully"}
