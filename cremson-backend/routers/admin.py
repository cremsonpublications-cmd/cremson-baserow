import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from jose import jwt
from pydantic import BaseModel, EmailStr

router = APIRouter()

JWT_SECRET    = os.getenv("JWT_SECRET", "changeme")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
TOKEN_EXPIRE  = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

ADMIN_EMAIL    = "cremsonpublications@gmail.com"
ADMIN_PASSWORD = "12345678"


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
async def admin_login(body: AdminLoginRequest):
    if body.email.lower().strip() != ADMIN_EMAIL or body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE * 24)
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
