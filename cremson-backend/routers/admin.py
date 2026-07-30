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
    if body.email.lower().strip() != ADMIN_EMAIL or body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE)
    token = jwt.encode(
        {
            "sub": "admin",
            "email": ADMIN_EMAIL,
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


@router.post("/cloudinary/delete")
async def delete_cloudinary_image(body: DeleteImageRequest):
    """Endpoint to trigger Cloudinary image removal if configured."""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "dkxxa3xt0").strip()
    api_key = os.getenv("CLOUDINARY_API_KEY", "").strip()
    api_secret = os.getenv("CLOUDINARY_API_SECRET", "").strip()

    if not api_key or not api_secret:
        return {
            "status": "warning",
            "message": "Cloudinary API Key/Secret not set in backend .env. Skipped remote deletion.",
            "url": body.url,
        }

    try:
        import hashlib
        import time
        import httpx

        # Extract cloud_name and public_id from Cloudinary URL
        # e.g., https://res.cloudinary.com/dkxxa3xt0/image/upload/v1785408052/review-images/fwnqzcbivfsk8k3h4dhk.png
        if "res.cloudinary.com/" in body.url:
            cloud_name = body.url.split("res.cloudinary.com/")[1].split("/")[0]

        url_parts = body.url.split("/upload/")
        if len(url_parts) < 2:
            return {"status": "error", "message": "Invalid Cloudinary URL"}

        after_upload = url_parts[1]
        # Remove version string (e.g. v1785408052/) if present
        parts = after_upload.split("/")
        if parts[0].startswith("v") and parts[0][1:].isdigit():
            path_with_ext = "/".join(parts[1:])
        else:
            path_with_ext = after_upload

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

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.cloudinary.com/v1_1/{cloud_name}/image/destroy",
                data=payload,
            )
            res_data = response.json()
        return {"status": "success", "cloudinary_response": res_data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

