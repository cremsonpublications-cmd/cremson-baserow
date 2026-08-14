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
    """Return a paginated list of users from both new auth_users and old users tables."""
    import re

    # 1. Fetch new users from auth_users (Table 769)
    # We fetch up to 200 to keep performance fast and capture all active registrations
    auth_res = await client.get_rows(
        TABLE_IDS["auth_users"],
        size=200,
        search=search,
    )
    
    normalized_auth = []
    for r in auth_res.get("results", []):
        notes = r.get("Notes") or ""
        role = "customer"
        role_matches = re.findall(r"role:\s*([a-zA-Z0-9_-]+)", notes)
        if role_matches:
            role = role_matches[-1].strip()

        normalized_auth.append({
            "id": f"new_{r.get('id')}",
            "email": r.get("email") or "",
            "phone": r.get("phone") or "",
            "display_name": r.get("name") or "",
            "username": r.get("email", "").split("@")[0] if r.get("email") else "",
            "role": role,
            "confirmed_at": r.get("created_at") or "",
            "last_sign_in_at": r.get("created_at") or "", # Fallback to created_at
            "created_at": r.get("created_at") or "",
        })

    # 2. Fetch old users from users (Table 761) using pagination params
    users_res = await client.get_rows(
        TABLE_IDS["users"],
        page=page,
        size=size,
        search=search,
    )

    normalized_old = []
    for r in users_res.get("results", []):
        normalized_old.append({
            "id": r.get("id"),
            "email": r.get("email") or "",
            "phone": r.get("phone") or "",
            "display_name": r.get("display_name") or r.get("Name") or "",
            "username": r.get("username") or "",
            "role": r.get("role") or "customer",
            "confirmed_at": r.get("confirmed_at") or r.get("created_at") or "",
            "last_sign_in_at": r.get("last_sign_in_at") or "",
            "created_at": r.get("created_at") or "",
        })

    # Merge lists
    # Prepends new auth_users on the first page so they appear on top
    if page == 1:
        merged_results = normalized_auth + normalized_old
    else:
        merged_results = normalized_old

    # Sort results on this page by most recent login / creation date
    def _sort_key(u):
        return u.get("last_sign_in_at") or u.get("created_at") or ""

    merged_results.sort(key=_sort_key, reverse=True)

    return {
        "count": users_res.get("count", 0) + len(normalized_auth),
        "results": merged_results
    }


@router.get("/{row_id}", summary="Get a single user")
async def get_user(row_id: str):
    """Return a single user by Baserow row ID or auth user ID."""
    import re
    if str(row_id).startswith("new_"):
        try:
            auth_id = int(str(row_id).split("_")[1])
        except (IndexError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        r = await client.get_row(TABLE_IDS["auth_users"], auth_id)
        if not r:
            raise HTTPException(status_code=404, detail="User not found")
        
        notes = r.get("Notes") or ""
        role = "customer"
        role_matches = re.findall(r"role:\s*([a-zA-Z0-9_-]+)", notes)
        if role_matches:
            role = role_matches[-1].strip()
            
        return {
            "id": f"new_{r.get('id')}",
            "email": r.get("email") or "",
            "phone": r.get("phone") or "",
            "display_name": r.get("name") or "",
            "username": r.get("email", "").split("@")[0] if r.get("email") else "",
            "role": role,
            "confirmed_at": r.get("created_at") or "",
            "last_sign_in_at": r.get("created_at") or "",
            "created_at": r.get("created_at") or "",
        }
    else:
        try:
            r = await client.get_row(TABLE_IDS["users"], int(row_id))
            if not r:
                raise HTTPException(status_code=404, detail="User not found")
            return {
                "id": r.get("id"),
                "email": r.get("email") or "",
                "phone": r.get("phone") or "",
                "display_name": r.get("display_name") or r.get("Name") or "",
                "username": r.get("username") or "",
                "role": r.get("role") or "customer",
                "confirmed_at": r.get("confirmed_at") or r.get("created_at") or "",
                "last_sign_in_at": r.get("last_sign_in_at") or "",
                "created_at": r.get("created_at") or "",
            }
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")

