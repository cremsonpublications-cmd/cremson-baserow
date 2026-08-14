from fastapi import APIRouter, Query, HTTPException
from services.baserow import BaserowClient
from config import TABLE_IDS

router = APIRouter()
client = BaserowClient()


@router.get("/", summary="List users")
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
):
    """Return a paginated list of users from Baserow."""
    res = await client.get_rows(
        TABLE_IDS["users"],
        page=page,
        size=size,
        search=search,
    )
    # Sort by most-recent login first
    if isinstance(res, dict) and "results" in res:
        def _login_ts(u):
            val = u.get("last_sign_in_at") or u.get("last_login") or ""
            return val  # ISO strings sort lexicographically = chronologically
        res["results"] = sorted(res["results"], key=_login_ts, reverse=True)
    return res


@router.get("/{row_id}", summary="Get a single user")
async def get_user(row_id: int):
    """Return a single user by Baserow row ID."""
    return await client.get_row(TABLE_IDS["users"], row_id)
