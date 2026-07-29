from fastapi import APIRouter, Query
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
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
):
    """Return a paginated list of specimen requests from Baserow."""
    return await client.get_rows(
        TABLE_IDS["specimen_requests"],
        page=page,
        size=size,
        search=search,
    )


@router.get("/{row_id}", summary="Get a single specimen request")
async def get_specimen_request(row_id: int):
    """Return a single specimen request by Baserow row ID."""
    return await client.get_row(TABLE_IDS["specimen_requests"], row_id)


@router.patch("/{row_id}", summary="Update specimen request status")
async def update_specimen_request(row_id: int, body: SpecimenStatusUpdate):
    return await client.update_row(TABLE_IDS["specimen_requests"], row_id, body.model_dump(exclude_none=True))
