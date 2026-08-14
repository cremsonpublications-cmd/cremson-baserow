from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from passlib.context import CryptContext
import re

from services.baserow import BaserowClient
from config import TABLE_IDS
from db.auth import create_user, get_user_by_email, get_user_by_phone, update_user_profile_admin
from routers.auth import require_permissions, current_user

router = APIRouter()
client = BaserowClient()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def require_admin_only():
    """Dependency: only main admin (role=admin/superadmin) can access. Staff are blocked."""
    async def dependency(user=Depends(current_user)):
        role = user.get("role", "").lower()
        if role not in ("admin", "superadmin"):
            raise HTTPException(
                status_code=403,
                detail="Access Denied: Only the main administrator can manage user accounts."
            )
        return user
    return dependency


class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    password: str
    role: str = "staff"
    permissions: List[str] = []


class UpdateUserRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    role: str = "staff"
    permissions: List[str] = []
    password: Optional[str] = None  # If provided, update password hash


@router.get("/", summary="List users", dependencies=[Depends(require_admin_only())])
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
):
    """Return a paginated list of users from both new auth_users and old users tables."""
    # 1. Fetch new users from auth_users (Table 769)
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

        permissions = []
        perm_matches = re.findall(r"permissions:\s*([^;|]+)", notes)
        if perm_matches:
            permissions = [p.strip() for p in perm_matches[-1].split(",") if p.strip()]

        normalized_auth.append({
            "id": f"new_{r.get('id')}",
            "email": r.get("email") or "",
            "phone": r.get("phone") or "",
            "display_name": r.get("name") or "",
            "username": r.get("email", "").split("@")[0] if r.get("email") else "",
            "role": role,
            "permissions": permissions,
            "confirmed_at": r.get("created_at") or "",
            "last_sign_in_at": r.get("created_at") or "", # Fallback to created_at
            "created_at": r.get("created_at") or "",
        })

    # 2. Fetch old users from users (Table 761)
    users_res = await client.get_rows(
        TABLE_IDS["users"],
        page=page,
        size=size,
        search=search,
    )

    normalized_old = []
    for r in users_res.get("results", []):
        notes = r.get("Notes") or ""
        permissions = []
        perm_matches = re.findall(r"permissions:\s*([^;|]+)", notes)
        if perm_matches:
            permissions = [p.strip() for p in perm_matches[-1].split(",") if p.strip()]

        normalized_old.append({
            "id": r.get("id"),
            "email": r.get("email") or "",
            "phone": r.get("phone") or "",
            "display_name": r.get("display_name") or r.get("Name") or "",
            "username": r.get("username") or "",
            "role": r.get("role") or "customer",
            "permissions": permissions,
            "confirmed_at": r.get("confirmed_at") or r.get("created_at") or "",
            "last_sign_in_at": r.get("last_sign_in_at") or "",
            "created_at": r.get("created_at") or "",
        })

    # Merge lists
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


@router.post("/", summary="Create a new admin/staff user", dependencies=[Depends(require_admin_only())])
async def admin_create_user(body: CreateUserRequest):
    # 1. Check if email/phone exists
    existing = await get_user_by_email(body.email)
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
        
    if body.phone:
        existing_phone = await get_user_by_phone(body.phone)
        if existing_phone:
            raise HTTPException(status_code=400, detail="A user with this phone number already exists.")

    # 2. Hash password
    import asyncio
    from functools import partial
    loop = asyncio.get_event_loop()
    pw_hash = await loop.run_in_executor(None, partial(pwd_ctx.hash, body.password))

    # 3. Create user
    user = await create_user(
        email=body.email,
        name=body.name,
        password_hash=pw_hash,
        phone=body.phone,
        role=body.role,
        is_approved=1,
        is_verified=1,  # Admin-created users are pre-verified
        permissions=body.permissions,
        plain_password=body.password,  # Store plain text for admin reference
    )
    return user


@router.patch("/{row_id}", summary="Update an admin/staff user profile and permissions", dependencies=[Depends(require_admin_only())])
async def admin_update_user(row_id: str, body: UpdateUserRequest):
    if str(row_id).startswith("new_"):
        try:
            auth_id = int(str(row_id).split("_")[1])
        except (IndexError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
    else:
        try:
            auth_id = int(row_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
    try:
        # If a new password is provided, hash it and update separately
        new_pw_hash = None
        if body.password and body.password.strip():
            import asyncio
            from functools import partial
            loop = asyncio.get_event_loop()
            new_pw_hash = await loop.run_in_executor(None, partial(pwd_ctx.hash, body.password.strip()))

        user = await update_user_profile_admin(
            user_id=auth_id,
            name=body.name,
            email=body.email,
            phone=body.phone,
            role=body.role,
            is_approved=1,
            designation=None,
            permissions=body.permissions,
            password_hash=new_pw_hash,
            plain_password=body.password if body.password and body.password.strip() else None,
        )
        return user
    except Exception as e:
        if not str(row_id).startswith("new_"):
            try:
                payload = {
                    "email": body.email.lower().strip(),
                    "phone": body.phone,
                    "Name": body.name.strip(),
                    "role": body.role,
                    "Notes": f"permissions: {','.join(body.permissions)}"
                }
                updated = await client.update_row(TABLE_IDS["users"], auth_id, payload)
                return updated
            except Exception as ex:
                raise HTTPException(status_code=400, detail=f"Failed to update user: {ex}")
        raise HTTPException(status_code=400, detail=f"Failed to update user: {e}")


@router.delete("/{row_id}", summary="Delete a user", dependencies=[Depends(require_admin_only())])
async def delete_user(row_id: str):
    if str(row_id).startswith("new_"):
        try:
            auth_id = int(str(row_id).split("_")[1])
        except (IndexError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        await client.delete_row(TABLE_IDS["auth_users"], auth_id)
    else:
        try:
            auth_id = int(row_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        await client.delete_row(TABLE_IDS["users"], auth_id)
    return {"message": "User deleted successfully"}


@router.get("/{row_id}", summary="Get a single user", dependencies=[Depends(require_admin_only())])
async def get_user(row_id: str):
    """Return a single user by Baserow row ID or auth user ID."""
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

        permissions = []
        perm_matches = re.findall(r"permissions:\s*([^;|]+)", notes)
        if perm_matches:
            permissions = [p.strip() for p in perm_matches[-1].split(",") if p.strip()]
            
        return {
            "id": f"new_{r.get('id')}",
            "email": r.get("email") or "",
            "phone": r.get("phone") or "",
            "display_name": r.get("name") or "",
            "username": r.get("email", "").split("@")[0] if r.get("email") else "",
            "role": role,
            "permissions": permissions,
            "confirmed_at": r.get("created_at") or "",
            "last_sign_in_at": r.get("created_at") or "",
            "created_at": r.get("created_at") or "",
        }
    else:
        try:
            r = await client.get_row(TABLE_IDS["users"], int(row_id))
            if not r:
                raise HTTPException(status_code=404, detail="User not found")
            
            notes = r.get("Notes") or ""
            permissions = []
            perm_matches = re.findall(r"permissions:\s*([^;|]+)", notes)
            if perm_matches:
                permissions = [p.strip() for p in perm_matches[-1].split(",") if p.strip()]

            return {
                "id": r.get("id"),
                "email": r.get("email") or "",
                "phone": r.get("phone") or "",
                "display_name": r.get("display_name") or r.get("Name") or "",
                "username": r.get("username") or "",
                "role": r.get("role") or "customer",
                "permissions": permissions,
                "confirmed_at": r.get("confirmed_at") or r.get("created_at") or "",
                "last_sign_in_at": r.get("last_sign_in_at") or "",
                "created_at": r.get("created_at") or "",
            }
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
