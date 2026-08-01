from fastapi import APIRouter, Query, Request
from typing import Optional
import asyncio
from pydantic import BaseModel
from services.baserow import BaserowClient
from config import TABLE_IDS

router = APIRouter()
client = BaserowClient()


class SpecimenStatusUpdate(BaseModel):
    status: str


async def _resolve_specimen_names(rows: list):
    """Resolve School Name lookup values (which show autonumber IDs) to actual school names.
    Teacher names are already present in TeacherID[].value from Baserow."""
    school_ids = set()
    for row in rows:
        for s in row.get("SchoolID", []):
            if isinstance(s, dict):
                sid = s.get("ids", {}).get("database_table_876")
                if sid:
                    school_ids.add(sid)

    if not school_ids:
        return

    async def fetch_school(sid):
        try:
            r = await client.get_row(TABLE_IDS["school"], sid)
            return sid, r.get("SchoolName", "")
        except Exception:
            return sid, ""

    school_names = dict(await asyncio.gather(*[fetch_school(sid) for sid in school_ids]))

    for row in rows:
        # Patch both "School Name" lookup array and "SchoolID" link array
        for field in ("School Name", "SchoolID"):
            for s in row.get(field, []):
                if isinstance(s, dict):
                    sid = s.get("ids", {}).get("database_table_876")
                    if sid and sid in school_names:
                        s["value"] = school_names[sid]


@router.get("/", summary="List specimen requests")
async def list_specimen_requests(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
):
    """Return a paginated list of specimen requests from Baserow."""
    filters = {k: v for k, v in request.query_params.items() if k not in ["page", "size", "search"] and v}
    res = await client.get_rows(
        TABLE_IDS["specimen_requests"],
        page=page,
        size=size,
        search=search,
        filters=filters,
        order_by="-SpecimenID",
    )
    await _resolve_specimen_names(res.get("results", []))
    return res


@router.get("/{row_id}", summary="Get a single specimen request")
async def get_specimen_request(row_id: int):
    """Return a single specimen request by Baserow row ID."""
    row = await client.get_row(TABLE_IDS["specimen_requests"], row_id)
    await _resolve_specimen_names([row])
    return row


@router.post("/", summary="Create specimen request")
async def create_specimen_request(body: dict):
    return await client.create_row(TABLE_IDS["specimen_requests"], body)


@router.patch("/{row_id}", summary="Update specimen request")
async def update_specimen_request(row_id: int, body: dict):
    return await client.update_row(TABLE_IDS["specimen_requests"], row_id, body)


@router.patch("/{row_id}/approve", summary="Approve specimen request")
async def approve_specimen_request(row_id: int):
    """Set DeliveryStatus to Dispatched."""
    result = await client.update_row(
        TABLE_IDS["specimen_requests"],
        row_id,
        {"DeliveryStatus": "Dispatched"},
    )
    return result


@router.patch("/{row_id}/reject", summary="Reject specimen request")
async def reject_specimen_request(row_id: int):
    """Set DeliveryStatus to RTO (rejected/returned)."""
    result = await client.update_row(
        TABLE_IDS["specimen_requests"],
        row_id,
        {"DeliveryStatus": "RTO"},
    )
    return result


@router.delete("/{row_id}", summary="Delete specimen request")
async def delete_specimen_request(row_id: int):
    await client.delete_row(TABLE_IDS["specimen_requests"], row_id)
    return {"message": "Specimen request deleted successfully"}


