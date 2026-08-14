import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from jose import jwt
from pydantic import BaseModel, EmailStr

router = APIRouter()

JWT_SECRET    = os.getenv("JWT_SECRET", "changeme")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
TOKEN_EXPIRE  = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "14400"))

ADMIN_EMAIL    = "cremsonpublications@gmail.com"
ADMIN_PASSWORD = "12345678"


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
async def admin_login(body: AdminLoginRequest):
    email_clean = body.email.lower().strip()
    
    # 1. Check hardcoded admin credentials
    if email_clean == ADMIN_EMAIL and body.password == ADMIN_PASSWORD:
        expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE)
        token = jwt.encode(
            {
                "sub": "admin",
                "email": ADMIN_EMAIL,
                "role": "admin",
                "is_admin": True,
                "exp": expire,
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM,
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "admin": {"email": ADMIN_EMAIL, "name": "Admin"},
        }

    # 2. Check database admin/staff accounts
    from db.auth import get_user_by_email
    from routers.auth import pwd_ctx
    import asyncio
    from functools import partial
    
    user = await get_user_by_email(email_clean)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid admin/staff credentials")
        
    role = user.get("role", "customer").lower()
    if role not in ("admin", "superadmin", "staff"):
        raise HTTPException(status_code=403, detail="Access Denied: You do not have admin or staff privileges.")
        
    loop = asyncio.get_event_loop()
    password_ok = await loop.run_in_executor(
        None, partial(pwd_ctx.verify, body.password, user["password_hash"])
    )
    if not password_ok:
        raise HTTPException(status_code=401, detail="Invalid admin/staff credentials")
        
    if not int(user.get("is_verified") or 0):
        raise HTTPException(status_code=403, detail="Account email not verified.")

    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE)
    token = jwt.encode(
        {
            "sub": str(user["id"]),
            "email": user["email"],
            "name": user["name"],
            "role": role,
            "permissions": user.get("permissions", []),
            "is_admin": True,
            "exp": expire,
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {"email": user["email"], "name": user["name"], "role": role},
    }


@router.get("/verify")
async def verify_admin(token: str):
    """Verify admin token validity."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if not payload.get("is_admin"):
            raise HTTPException(status_code=403, detail="Not an admin token")
        return {"valid": True, "email": payload.get("email")}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


class DeleteImageRequest(BaseModel):
    url: str
    resource_type: str = "image"


@router.post("/cloudinary/delete")
async def delete_cloudinary_image(body: DeleteImageRequest):
    """Endpoint to trigger Cloudinary image or raw file removal if configured."""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "dkxxa3xt0").strip()
    api_key = os.getenv("CLOUDINARY_API_KEY", "").strip()
    api_secret = os.getenv("CLOUDINARY_API_SECRET", "").strip()

    if not api_key or not api_secret or not body.url:
        return {
            "status": "warning",
            "message": "Cloudinary credentials not set or URL empty.",
            "url": body.url,
        }

    try:
        import hashlib
        import time
        import httpx

        # Determine resource type dynamically
        resource_type = body.resource_type or "image"
        if "raw/upload" in body.url or body.url.lower().endswith(".pdf"):
            resource_type = "raw"

        if "res.cloudinary.com/" in body.url:
            cloud_name = body.url.split("res.cloudinary.com/")[1].split("/")[0]

        url_parts = body.url.split("/upload/")
        if len(url_parts) < 2:
            url_parts = body.url.split("/raw/upload/")
            
        if len(url_parts) < 2:
            return {"status": "error", "message": "Invalid Cloudinary URL"}

        after_upload = url_parts[1]
        parts = after_upload.split("/")
        if parts[0].startswith("v") and parts[0][1:].isdigit():
            path_with_ext = "/".join(parts[1:])
        else:
            path_with_ext = after_upload

        if resource_type == "raw":
            public_id = path_with_ext
        else:
            public_id = path_with_ext.rsplit(".", 1)[0]

        timestamp = int(time.time())
        string_to_sign = f"public_id={public_id}&timestamp={timestamp}{api_secret}"
        signature = hashlib.sha1(string_to_sign.encode("utf-8")).hexdigest()

        payload = {
            "public_id": public_id,
            "api_key": api_key,
            "timestamp": timestamp,
            "signature": signature,
        }
        if resource_type == "raw":
            payload["resource_type"] = "raw"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/destroy",
                data=payload,
            )
            res_data = response.json()
        return {"status": "success", "cloudinary_response": res_data}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

