import os
import random
import string
import asyncio
from datetime import datetime, timedelta, timezone
from functools import partial

from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from db.auth import (
    create_user,
    get_user_by_email,
    get_user_by_phone,
    get_user_by_id,
    mark_user_verified,
    save_otp,
    get_valid_otp,
    consume_otp,
    normalize_phone,
)
from services.baserow import BaserowClient
from config import TABLE_IDS
from services.email import send_verification_email

router = APIRouter()

# ── Config ────────────────────────────────────────────────────────────────────
JWT_SECRET    = os.getenv("JWT_SECRET", "changeme")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
TOKEN_EXPIRE  = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "14400"))

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer  = HTTPBearer()


# ── Schemas ───────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str = ""


class TeacherRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    school_name: str = ""
    school_id: Optional[int] = None
    school_address: Optional[str] = ""
    school_phone: Optional[str] = ""
    school_email: Optional[str] = ""
    affiliation_code: Optional[str] = ""
    student_strength: Optional[str] = ""
    region: Optional[str] = ""
    id_card_url: str = ""
    designation: str = "Teacher"
    city: str = ""
    pincode: Optional[int] = None
    residence: str = ""


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
        {
            "sub": str(user["id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "customer"),
            "is_approved": int(user.get("is_approved") or (0 if user.get("role") == "teacher" else 1)),
            "exp": expire,
        },
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

    if body.phone:
        existing_phone = await get_user_by_phone(body.phone)
        if existing_phone:
            if existing_phone.get("is_approved") == -1 or existing_phone.get("is_active") == 0:
                raise HTTPException(status_code=409, detail="This phone number has been blocked or rejected by administration.")
            raise HTTPException(status_code=409, detail="An account with this phone number already exists.")

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


@router.get("/check-phone")
async def check_phone(phone: str):
    user = await get_user_by_phone(phone)
    if user:
        if user.get("is_approved") == -1 or user.get("is_active") == 0:
            return {"available": False, "reason": "This phone number has been blocked or rejected."}
        return {"available": False, "reason": "This phone number is already registered."}
    return {"available": True}


@router.post("/teacher-register", status_code=201)
async def teacher_register(body: TeacherRegisterRequest):
    if len(body.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    existing_email = await get_user_by_email(body.email)
    if existing_email:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    existing_phone = await get_user_by_phone(body.phone)
    if existing_phone:
        if existing_phone.get("is_approved") == -1 or existing_phone.get("is_active") == 0:
            raise HTTPException(status_code=409, detail="This phone number has been blocked or rejected by administration.")
        raise HTTPException(status_code=409, detail="An account with this phone number already exists.")

    loop = asyncio.get_event_loop()
    pw_hash = await loop.run_in_executor(None, partial(pwd_ctx.hash, body.password))
    
    b_client = BaserowClient()
    final_school_id = body.school_id
    final_school_name = body.school_name or ""

    # Auto-create school in Baserow Schools CRM table (ID 876) if not exists
    if not final_school_id and final_school_name:
        try:
            # Check if school already exists by name
            schools_res = await b_client.get_rows(TABLE_IDS["school"], search=final_school_name)
            match_school = None
            for s in schools_res.get("results", []):
                if s.get("SchoolName", "").strip().lower() == final_school_name.strip().lower():
                    match_school = s
                    break
            if match_school:
                final_school_id = match_school["id"]
            else:
                new_school_row = await b_client.create_row(TABLE_IDS["school"], {
                    "SchoolName": final_school_name.strip(),
                    "City": body.city or "",
                    "SchoolAddress": body.school_address or "",
                    "SchoolPhone": body.school_phone or "",
                    "SchoolEmail": body.school_email or "",
                    "AffiliationCode": body.affiliation_code or "",
                    "StudentStrength": body.student_strength or "",
                    "Region": body.region or "",
                    "Pincode": body.pincode,
                })
                final_school_id = new_school_row.get("id")
        except Exception as e:
            print("Warning: Auto-creating school failed:", e)

    new_user = await create_user(
        email=body.email,
        name=body.name,
        password_hash=pw_hash,
        phone=body.phone,
        role="teacher",
        is_approved=0,
        is_verified=1,
        designation=body.designation,
    )

    # Automatically create record in Baserow Teachers CRM table (ID 877)
    try:
        residence_address = body.residence or ""
        city_name = body.city or ""

        if final_school_id:
            try:
                school_row = await b_client.get_row(TABLE_IDS["school"], final_school_id)
                if school_row:
                    if not residence_address and school_row.get("SchoolAddress"):
                        residence_address = school_row.get("SchoolAddress")
                    if not city_name:
                        city_name = school_row.get("SchoolCity") or school_row.get("City") or ""
            except Exception as e:
                print("Warning: Failed to fetch school details for teacher address auto-fill:", e)
        elif body.school_address:
            if not residence_address:
                residence_address = body.school_address

        teacher_payload = {
            "Teacher Name": body.name,
            "Email": body.email.lower().strip(),
            "Whatsapp Phone": normalize_phone(body.phone),
            "Status": "Pending Approval",
            "IdCardUrl": body.id_card_url or "",
            "City": city_name or "",
            "Residence": residence_address or "",
            "Notes": f"Designation: {body.designation}",
        }
        if final_school_id:
            teacher_payload["SchoolID"] = [final_school_id]
        
        if body.pincode:
            try:
                teacher_payload["Pin Code"] = int(body.pincode)
            except Exception:
                pass

        await b_client.create_row(TABLE_IDS["teacher"], teacher_payload)
    except Exception as e:
        print("Warning: Failed to create Baserow teacher record:", e)

    # Send WhatsApp Confirmation Message to Teacher
    try:
        from services.whatsapp import send_teacher_signup_confirmation
        await send_teacher_signup_confirmation(body.phone, body.name)
    except Exception as e:
        print("Warning: Failed to send WhatsApp signup confirmation:", e)

    return {
        "message": "Teacher account created successfully. Your account is pending admin approval.",
        "email": body.email,
    }


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
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "phone": user.get("phone", ""),
            "role": user.get("role", "customer"),
            "is_approved": int(user.get("is_approved") or (0 if user.get("role") == "teacher" else 1)),
        },
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


async def get_teacher_school_name(email: str) -> str:
    try:
        b_client = BaserowClient()
        res = await b_client.get_rows(TABLE_IDS["teacher"], filters={"Email": email.lower().strip()})
        results = res.get("results", [])
        if results:
            t_row = results[0]
            school_name_list = t_row.get("School Name", []) or t_row.get("SchoolID", [])
            if school_name_list:
                return school_name_list[0].get("value", "")
    except Exception as e:
        print("Warning: Failed to fetch teacher school name:", e)
    return ""


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

    role = user.get("role", "customer")
    is_approved = int(user.get("is_approved") or (0 if role == "teacher" else 1))
    school_name = ""

    # If teacher account, verify approval status
    if role == "teacher":
        if is_approved == 1:
            school_name = await get_teacher_school_name(user["email"])
        elif is_approved == -1:
            raise HTTPException(
                status_code=403,
                detail="Your teacher registration request was rejected by admin.",
            )
        else:
            raise HTTPException(
                status_code=403,
                detail="Your teacher account is pending admin approval. You will be able to log in once an admin approves your account.",
            )

    token = make_token({**user, "role": role, "is_approved": is_approved})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "phone": user.get("phone", ""),
            "role": role,
            "is_approved": is_approved,
            "school_name": school_name,
            "designation": user.get("designation", "Teacher"),
        },
    }


@router.get("/me")
async def me(user: dict = Depends(current_user)):
    role = user.get("role", "customer")
    school_name = ""
    if role == "teacher":
        school_name = await get_teacher_school_name(user["email"])
        
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "phone": user.get("phone", ""),
        "role": role,
        "is_approved": int(user.get("is_approved") or (0 if role == "teacher" else 1)),
        "created_at": user.get("created_at", ""),
        "school_name": school_name,
        "designation": user.get("designation", "Teacher"),
    }


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
