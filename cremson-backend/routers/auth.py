import os
import random
import string
import asyncio
from datetime import datetime, timedelta, timezone
from functools import partial

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from db.auth import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    mark_user_verified,
    save_otp,
    get_valid_otp,
    consume_otp,
)
from services.baserow import BaserowClient
from config import TABLE_IDS
from services.email import send_verification_email

router = APIRouter()

# ── Config ────────────────────────────────────────────────────────────────────
JWT_SECRET    = os.getenv("JWT_SECRET", "changeme")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
TOKEN_EXPIRE  = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer  = HTTPBearer()


# ── Schemas ───────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str = ""


class VerifyRequest(BaseModel):
    email: EmailStr
    otp: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ResendOTPRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


# ── Helpers ───────────────────────────────────────────────────────────────────
def make_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def make_token(user: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE)
    return jwt.encode(
        {"sub": str(user["id"]), "email": user["email"], "name": user["name"], "exp": expire},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def otp_expires_at() -> str:
    return (datetime.utcnow() + timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S")


# ── Auth dependency ───────────────────────────────────────────────────────────
async def current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await get_user_by_id(user_id)
    if not user or not int(user.get("is_active") or 0):
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/register", status_code=201)
async def register(body: RegisterRequest):
    if len(body.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    existing = await get_user_by_email(body.email)

    if existing:
        if int(existing.get("is_verified") or 0):
            raise HTTPException(status_code=409, detail="Invalid email or password")
        else:
            otp = make_otp()
            await save_otp(body.email, otp, otp_expires_at())
            try:
                await send_verification_email(body.email, existing["name"], otp)
            except Exception:
                pass
            return {"message": "otp_resent", "email": body.email}

    loop = asyncio.get_event_loop()
    pw_hash = await loop.run_in_executor(None, partial(pwd_ctx.hash, body.password))
    await create_user(body.email, body.name, pw_hash, body.phone)

    otp = make_otp()
    await save_otp(body.email, otp, otp_expires_at())

    try:
        await send_verification_email(body.email, body.name, otp)
    except Exception:
        pass

    return {"message": "Account created. Check your email for the 6-digit verification code."}


@router.post("/verify-email")
async def verify_email(body: VerifyRequest):
    record = await get_valid_otp(body.email, body.otp)
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    await consume_otp(record["id"])
    await mark_user_verified(body.email)

    user = await get_user_by_email(body.email)
    token = make_token(user)
    return {
        "message": "Email verified successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "phone": user.get("phone", "")},
    }


@router.post("/resend-otp")
async def resend_otp(body: ResendOTPRequest):
    user = await get_user_by_email(body.email)
    if not user:
        raise HTTPException(status_code=404, detail="Email not registered")
    if int(user.get("is_verified") or 0):
        raise HTTPException(status_code=400, detail="Email already verified")

    otp = make_otp()
    await save_otp(body.email, otp, otp_expires_at())

    try:
        await send_verification_email(body.email, user["name"], otp)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to send email. Try again later.")

    return {"message": "New OTP sent to your email"}


@router.post("/login")
async def login(body: LoginRequest):
    user = await get_user_by_email(body.email)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    loop = asyncio.get_event_loop()
    password_ok = await loop.run_in_executor(
        None, partial(pwd_ctx.verify, body.password, user["password_hash"])
    )
    if not password_ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not int(user.get("is_verified") or 0):
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Please check your inbox for the OTP.",
        )

    token = make_token(user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "phone": user.get("phone", "")},
    }


@router.get("/me")
async def me(user: dict = Depends(current_user)):
    return {"id": user["id"], "email": user["email"], "name": user["name"], "phone": user.get("phone", ""), "created_at": user.get("created_at", "")}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    user = await get_user_by_email(body.email)
    if not user or not int(user.get("is_verified") or 0):
        return {"message": "If this email is registered, you will receive a reset code."}

    otp = make_otp()
    await save_otp(body.email, otp, otp_expires_at())

    try:
        await send_verification_email(body.email, user["name"], otp)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to send reset email. Try again later.")

    return {"message": "Password reset code sent to your email."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    if len(body.new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    record = await get_valid_otp(body.email, body.otp)
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    user = await get_user_by_email(body.email)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")

    await consume_otp(record["id"])

    loop = asyncio.get_event_loop()
    new_hash = await loop.run_in_executor(None, partial(pwd_ctx.hash, body.new_password))

    client = BaserowClient()
    await client.update_row(TABLE_IDS["auth_users"], user["id"], {"password_hash": new_hash})

    return {"message": "Password reset successfully. You can now sign in."}
