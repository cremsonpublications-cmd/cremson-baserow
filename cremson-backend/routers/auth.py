import os
import re
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
    is_guest_user,
    activate_guest_to_active,
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
    phone: Optional[str] = None
    phone_otp: Optional[str] = None


class SendWhatsAppVerifyOtpRequest(BaseModel):
    email: EmailStr
    phone: str
    otp: str  # The email OTP that verified their identity


class ChangePasswordRequest(BaseModel):
    otp: str
    new_password: str


# ── Helpers ───────────────────────────────────────────────────────────────────
def make_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


async def send_otp_to_user(email: str, name: str, phone: str, otp: str):
    # 1. Send via WhatsApp
    if phone:
        try:
            from services.whatsapp import send_whatsapp_otp
            await send_whatsapp_otp(phone, otp)
            print(f"WhatsApp OTP sent successfully to {phone}")
        except Exception as e:
            print(f"Warning: Failed to send WhatsApp OTP to {phone}: {e}")


def make_token(user: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE)
    return jwt.encode(
        {
            "sub": str(user["id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "customer"),
            "phone": user.get("phone", ""),
            "is_approved": int(user.get("is_approved") or (0 if user.get("role") == "teacher" else 1)),
            "permissions": user.get("permissions", []),
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
        sub = payload.get("sub")
        # Hardcoded superadmin token has sub="admin" (not a numeric user ID)
        if sub == "admin" and payload.get("is_admin"):
            return {
                "id": 0,
                "email": payload.get("email", "cremsonpublications@gmail.com"),
                "name": "Admin",
                "role": "superadmin",
                "is_active": 1,
                "is_verified": 1,
                "is_approved": 1,
                "permissions": [],
            }
        user_id = int(sub)
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    user = await get_user_by_id(user_id)
    if not user or not int(user.get("is_active") or 0):
        raise HTTPException(status_code=401, detail="User account not found or deactivated. Please sign in again.")
    return user


def require_permissions(required_permissions: list):
    async def dependency(user = Depends(current_user)):
        user_role = user.get("role", "customer")
        # superadmin or admin gets full access automatically
        if user_role in ("superadmin", "admin"):
            return user
        
        user_perms = user.get("permissions", [])
        if not all(p in user_perms for p in required_permissions):
            raise HTTPException(
                status_code=403,
                detail="Access Denied: You do not have the required permissions to perform this action."
            )
        return user
    return dependency


def validate_password_strength(password: str):
    if not password or len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter (A-Z).")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter (a-z).")
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number (0-9).")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character (!@#$%^&* etc.).")


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/register", status_code=201)
async def register(body: RegisterRequest):
    validate_password_strength(body.password)

    if body.phone:
        p_clean = "".join(filter(str.isdigit, str(body.phone)))
        if len(p_clean) == 12 and p_clean.startswith("91"):
            p_clean = p_clean[2:]
        if len(p_clean) != 10:
            raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits.")

        existing_phone = await get_user_by_phone(body.phone)
        if existing_phone:
            if existing_phone.get("is_approved") == -1 or existing_phone.get("is_active") == 0:
                raise HTTPException(status_code=409, detail="This phone number has been blocked or rejected by administration.")

            # ── GUEST-TO-ACTIVE conversion ─────────────────────────────────
            # If this phone belongs to a GUEST customer created via WhatsApp admin order,
            # convert the existing record instead of creating a duplicate user.
            # The existing orders remain linked to the same user_id.
            if is_guest_user(existing_phone):
                loop = asyncio.get_event_loop()
                pw_hash = await loop.run_in_executor(None, partial(pwd_ctx.hash, body.password))
                updated_user = await activate_guest_to_active(
                    user_id=existing_phone["id"],
                    email=body.email,
                    password_hash=pw_hash,
                    name=body.name,
                )
                otp = make_otp()
                await save_otp(body.email, otp, otp_expires_at())
                await send_otp_to_user(body.email, body.name, body.phone, otp)
                return {
                    "message": "Account created. Check your WhatsApp for the 6-digit verification code.",
                    "guest_activated": True,
                }
            # ── END GUEST-TO-ACTIVE ────────────────────────────────────────

            raise HTTPException(status_code=409, detail="An account with this phone number already exists.")

    existing = await get_user_by_email(body.email)

    if existing:
        if int(existing.get("is_verified") or 0):
            raise HTTPException(status_code=409, detail="Invalid email or password")
        else:
            otp = make_otp()
            await save_otp(body.email, otp, otp_expires_at())
            await send_otp_to_user(body.email, existing["name"], existing.get("phone", ""), otp)
            return {"message": "otp_resent", "email": body.email}

    loop = asyncio.get_event_loop()
    pw_hash = await loop.run_in_executor(None, partial(pwd_ctx.hash, body.password))
    await create_user(body.email, body.name, pw_hash, body.phone)

    otp = make_otp()
    await save_otp(body.email, otp, otp_expires_at())

    await send_otp_to_user(body.email, body.name, body.phone, otp)

    return {"message": "Account created. Check your WhatsApp for the 6-digit verification code."}


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
    validate_password_strength(body.password)

    if body.pincode:
        p_str = str(body.pincode).strip()
        if not (p_str.isdigit() and len(p_str) == 6):
            raise HTTPException(status_code=400, detail="Pincode must be exactly 6 digits.")

    if body.phone:
        p_clean = "".join(filter(str.isdigit, str(body.phone)))
        if len(p_clean) == 12 and p_clean.startswith("91"):
            p_clean = p_clean[2:]
        if len(p_clean) != 10:
            raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits.")

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
        is_approved=1,
        is_verified=0,
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
            "Status": "Approved",
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

    # Generate OTP for verification
    otp = make_otp()
    await save_otp(body.email, otp, otp_expires_at())

    await send_otp_to_user(body.email, body.name, body.phone, otp)

    return {
        "message": "Account created. Check your WhatsApp for the 6-digit verification code.",
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
        "message": "Phone number verified successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "phone": user.get("phone", ""),
            "role": user.get("role", "customer"),
            "is_approved": int(user.get("is_approved") or (0 if user.get("role") == "teacher" else 1)),
            "permissions": user.get("permissions", []),
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

    await send_otp_to_user(body.email, user["name"], user.get("phone", ""), otp)

    return {"message": "New OTP sent to your WhatsApp"}


async def get_teacher_details(email: str) -> dict:
    try:
        b_client = BaserowClient()
        results = await b_client.get_rows_by_email(TABLE_IDS["teacher"], email)
        if results:
            t_row = results[0]
            school_name_list = t_row.get("School Name", []) or t_row.get("SchoolID", [])
            s_name = ""
            if school_name_list and isinstance(school_name_list, list) and len(school_name_list) > 0:
                item = school_name_list[0]
                s_name = item.get("value", "") if isinstance(item, dict) else str(item)
            
            id_card_url = t_row.get("IdCardUrl") or ""
            notes = t_row.get("Notes") or ""
            
            limit = 2
            if "specimen_limit:" in notes.lower():
                import re
                m = re.search(r'specimen_limit:\s*(\d+)', notes, re.IGNORECASE)
                if m:
                    limit = int(m.group(1))

            requested_books = []
            try:
                teacher_row_id = t_row.get("id")
                if teacher_row_id:
                    prev_res = await b_client.get_rows(TABLE_IDS["specimen_requests"], filters={"TeacherID": teacher_row_id}, size=200)
                    for prow in prev_res.get("results", []):
                        d_status = prow.get("DeliveryStatus")
                        status_str = d_status.get("value") if isinstance(d_status, dict) else str(d_status or "")
                        if status_str.strip().lower() == "rejected":
                            continue
                            
                        b_raw = prow.get("BooksRequested") or ""
                        for b_item in b_raw.split(","):
                            b_clean = b_item.strip()
                            if b_clean:
                                requested_books.append(b_clean)
            except Exception as e:
                print("Warning: Failed to fetch previous specimen requests for auth:", e)

            return {
                "teacher_row_id": t_row.get("id"),
                "school_name": s_name,
                "id_card_url": id_card_url,
                "specimen_limit": limit,
                "residence": t_row.get("Residence") or "",
                "city": t_row.get("City") or "",
                "pincode": t_row.get("Pin Code") or "",
                "already_requested_books": requested_books,
            }
    except Exception as e:
        print("Warning: Failed to fetch teacher details:", e)
    return {"teacher_row_id": None, "school_name": "", "id_card_url": "", "specimen_limit": 2, "residence": "", "city": "", "pincode": "", "already_requested_books": []}


async def get_teacher_school_name(email: str) -> str:
    details = await get_teacher_details(email)
    return details.get("school_name", "")


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
    raw_approved = user.get("is_approved")
    is_approved = int(raw_approved) if raw_approved is not None and str(raw_approved) != "" else 1
    t_details = {"school_name": "", "id_card_url": "", "specimen_limit": 2}

    # If teacher account, verify approval status
    if role == "teacher":
        if is_approved == -1:
            raise HTTPException(
                status_code=403,
                detail="Your teacher registration request was rejected by admin.",
            )
        else:
            is_approved = 1
            t_details = await get_teacher_details(user["email"])

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
            "school_name": t_details.get("school_name", ""),
            "id_card_url": t_details.get("id_card_url", ""),
            "specimen_limit": t_details.get("specimen_limit", 2),
            "designation": user.get("designation", "Teacher"),
            "residence": t_details.get("residence") or user.get("residence", ""),
            "city": t_details.get("city") or user.get("city", ""),
            "pincode": t_details.get("pincode") or user.get("pincode", ""),
            "already_requested_books": t_details.get("already_requested_books", []),
            "permissions": user.get("permissions", []),
        },
    }


@router.get("/me")
async def me(user: dict = Depends(current_user)):
    role = user.get("role", "customer")
    t_details = {"school_name": "", "id_card_url": "", "specimen_limit": 2, "residence": "", "city": "", "pincode": ""}
    if role == "teacher":
        t_details = await get_teacher_details(user["email"])
        
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "phone": user.get("phone", ""),
        "role": role,
        "is_approved": int(user.get("is_approved") or (0 if role == "teacher" else 1)),
        "created_at": user.get("created_at", ""),
        "school_name": t_details.get("school_name", ""),
        "id_card_url": t_details.get("id_card_url", ""),
        "specimen_limit": t_details.get("specimen_limit", 2),
        "designation": user.get("designation", "Teacher"),
        "residence": t_details.get("residence") or user.get("residence", ""),
        "city": t_details.get("city") or user.get("city", ""),
        "pincode": t_details.get("pincode") or user.get("pincode", ""),
        "already_requested_books": t_details.get("already_requested_books", []),
        "permissions": user.get("permissions", []),
    }


@router.get("/teacher-status")
async def check_teacher_status_by_phone(phone: str):
    """
    Public endpoint used by the website's WhatsApp widget to check teacher status by phone number.
    Returns status: 'not_found', 'pending', or 'verified' along with some basic details.
    """
    phone_digits = "".join(filter(str.isdigit, phone))
    last_10_digits = phone_digits[-10:] if len(phone_digits) >= 10 else phone_digits
    if not last_10_digits:
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    try:
        b_client = BaserowClient()
        t_res = await b_client.get_rows(TABLE_IDS["teacher"], search=last_10_digits)
        teachers = t_res.get("results", [])

        matched_teacher = None
        for t in teachers:
            wp_phone = str(t.get("Whatsapp Phone") or t.get("Alternate Number") or "")
            wp_digits = "".join(filter(str.isdigit, wp_phone))
            if last_10_digits in wp_digits:
                matched_teacher = t
                break

        if not matched_teacher and teachers:
            matched_teacher = teachers[0]

        if not matched_teacher:
            return {"status": "not_found", "message": "Teacher account not found."}

        teacher_name = matched_teacher.get("Teacher Name") or "Educator"
        status_val = matched_teacher.get("Status")
        status_str = status_val.get("value") if isinstance(status_val, dict) else str(status_val or "").lower()

        is_pending = status_str and any(p in status_str for p in ["pending", "review", "unverified", "new"])
        
        if is_pending:
            return {
                "status": "pending",
                "teacher_name": teacher_name,
                "message": f"Welcome back, {teacher_name}! 🎓\n\nYour teacher registration status is currently: ⏳ Pending Verification.\n\nOur team is reviewing your profile and credentials. You will receive full portal access once verified.\n\n📚 Request Free Specimen Copies:\nhttps://cremsonpublications.com/specimen-request\n\nType 'Menu' anytime to go back."
            }
        else:
            return {
                "status": "verified",
                "teacher_name": teacher_name,
                "message": f"Welcome back, {teacher_name}! Your verified teacher portal is active. 🎉\n\n📥 Download Answer Keys, Lesson Plans & Question Banks:\nhttps://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link\n\n📚 Request Free Specimen Copies:\nhttps://cremsonpublications.com/specimen-request\n\nType 'Menu' anytime to go back."
            }
    except Exception as e:
        print(f"Error checking teacher status: {e}")
        return {
            "status": "verified",
            "teacher_name": "Educator",
            "message": "Welcome back! Your teacher portal is active. 🎉\n\n📥 Download Answer Keys, Lesson Plans & Question Banks:\nhttps://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link\n\n📚 Request Free Specimen Copies:\nhttps://cremsonpublications.com/specimen-request\n\nType 'Menu' anytime to go back."
        }


class UpdateIdCardRequest(BaseModel):
    id_card_url: str


@router.post("/update-id-card")
async def update_id_card(body: UpdateIdCardRequest, user: dict = Depends(current_user)):
    """Endpoint for teachers to upload/update their Teacher ID Card URL."""
    if not body.id_card_url:
        raise HTTPException(status_code=400, detail="id_card_url is required")
        
    b_client = BaserowClient()
    results = await b_client.get_rows_by_email(TABLE_IDS["teacher"], user["email"])
    if not results:
        await b_client.create_row(TABLE_IDS["teacher"], {
            "Teacher Name": user["name"],
            "Email": user["email"].lower().strip(),
            "Whatsapp Phone": user.get("phone", ""),
            "IdCardUrl": body.id_card_url,
            "Status": "Approved" if user.get("is_approved") == 1 else "Pending Approval"
        })
    else:
        teacher_id = results[0]["id"]
        await b_client.update_row(TABLE_IDS["teacher"], teacher_id, {"IdCardUrl": body.id_card_url})
        
    return {"message": "ID Card updated successfully", "id_card_url": body.id_card_url}


class UpdateSpecimenLimitRequest(BaseModel):
    specimen_limit: int


@router.post("/teacher-specimen-limit/{teacher_id}")
async def update_teacher_specimen_limit(teacher_id: int, body: UpdateSpecimenLimitRequest):
    """Admin endpoint to set max allowed specimen books for a teacher."""
    if body.specimen_limit < 1:
        raise HTTPException(status_code=400, detail="specimen_limit must be at least 1")

    b_client = BaserowClient()
    t_row = await b_client.get_row(TABLE_IDS["teacher"], teacher_id)
    notes = t_row.get("Notes") or ""
    
    import re
    if "specimen_limit:" in notes.lower():
        notes = re.sub(r'specimen_limit:\s*\d+', f'specimen_limit: {body.specimen_limit}', notes, flags=re.IGNORECASE)
    else:
        notes = (notes.strip() + f"; specimen_limit: {body.specimen_limit}").strip("; ")
        
    await b_client.update_row(TABLE_IDS["teacher"], teacher_id, {"Notes": notes})
    return {"message": "Specimen limit updated successfully", "teacher_id": teacher_id, "specimen_limit": body.specimen_limit}


@router.get("/teacher-history")
async def get_teacher_history(teacher_id: Optional[int] = None, email: Optional[str] = None, phone: Optional[str] = None):
    """Fetch all specimen requests, limit, and standard orders for a teacher by teacher_id, email or phone."""
    import re
    b_client = BaserowClient()
    specimen_history = []
    order_history = []
    specimen_limit = 2

    # 1. Fetch teacher details if teacher_id is provided
    if teacher_id:
        try:
            t_row = await b_client.get_row(TABLE_IDS["teacher"], teacher_id)
            if t_row:
                if not email:
                    email = t_row.get("Email") or ""
                if not phone:
                    phone = t_row.get("Whatsapp Phone") or t_row.get("Phone") or ""
                notes = t_row.get("Notes") or ""
                if "specimen_limit:" in notes.lower():
                    m = re.search(r'specimen_limit:\s*(\d+)', notes, re.IGNORECASE)
                    if m:
                        specimen_limit = int(m.group(1))
        except Exception as e:
            print("Warning: Error fetching teacher row:", e)
    elif email:
        try:
            results = await b_client.get_rows_by_email(TABLE_IDS["teacher"], email)
            if results:
                t_row = results[0]
                teacher_id = t_row["id"]
                if not phone:
                    phone = t_row.get("Whatsapp Phone") or t_row.get("Phone") or ""
                notes = t_row.get("Notes") or ""
                if "specimen_limit:" in notes.lower():
                    m = re.search(r'specimen_limit:\s*(\d+)', notes, re.IGNORECASE)
                    if m:
                        specimen_limit = int(m.group(1))
        except Exception as e:
            print("Warning: Error fetching teacher row by email:", e)

    # Normalise lookup values for matching
    email_lower = (email or "").lower().strip()
    phone_clean = (phone or "").strip()
    teacher_id_str = str(teacher_id) if teacher_id else ""

    def _extract_link_ids(field_val):
        """Return list of string IDs from a Baserow link-row field (array of dicts)."""
        if not isinstance(field_val, list):
            return []
        return [str(item.get("id", "")) for item in field_val if isinstance(item, dict)]

    def _extract_lookup_values(field_val):
        """Return list of string values from a Baserow lookup field (array of dicts)."""
        if not isinstance(field_val, list):
            return []
        return [str(item.get("value", "")).lower().strip() for item in field_val if isinstance(item, dict)]

    # 2. Fetch ALL specimen requests and match in Python
    # NOTE: TeacherID and Email are link/lookup fields — Baserow filter API cannot filter them.
    # We must fetch all rows and match on the Python side.
    seen_spec_ids = set()
    try:
        page = 1
        while True:
            res_spec = await b_client.get_rows(TABLE_IDS["specimen_requests"], page=page, size=200)
            rows = res_spec.get("results", [])
            for r in rows:
                if r["id"] in seen_spec_ids:
                    continue

                t_ids_in_row = _extract_link_ids(r.get("TeacherID", []))
                emails_in_row = _extract_lookup_values(r.get("Email", []))
                phones_in_row = _extract_lookup_values(r.get("Phone", []))

                matched = False
                if teacher_id_str and teacher_id_str in t_ids_in_row:
                    matched = True
                if email_lower and any(email_lower in v for v in emails_in_row):
                    matched = True
                if phone_clean and any(phone_clean in v or v in phone_clean for v in phones_in_row if v):
                    matched = True

                if matched:
                    seen_spec_ids.add(r["id"])
                    specimen_history.append(r)

            # Stop if this is the last page
            total = res_spec.get("count", 0)
            if page * 200 >= total:
                break
            page += 1
    except Exception as e:
        print("Warning: Error fetching specimen history:", e)

    # 3. Fetch standard orders using full-text search
    for search_query in filter(None, [email_lower or None, phone_clean or None]):
        try:
            res_orders = await b_client.get_rows(TABLE_IDS["orders"], search=search_query)
            seen_order_ids = {o["id"] for o in order_history}
            for o in res_orders.get("results", []):
                if o["id"] not in seen_order_ids:
                    seen_order_ids.add(o["id"])
                    order_history.append(o)
        except Exception as e:
            print("Warning: Error fetching orders history:", e)
        break  # one search is enough (email preferred)

    # 4. Calculate statistics — handle DeliveryStatus as both string and dict
    total_books_requested = 0
    total_books_approved = 0

    for req in specimen_history:
        b_str = req.get("BooksRequested") or ""
        b_list = [b.strip() for b in b_str.split(",") if b.strip()]
        b_count = len(b_list)
        total_books_requested += b_count

        status_raw = req.get("DeliveryStatus")
        status_val = status_raw.get("value") if isinstance(status_raw, dict) else str(status_raw or "")
        if status_val in ["Dispatched", "Delivered", "Approved"]:
            total_books_approved += b_count

    return {
        "teacher": {
            "id": teacher_id,
            "email": email,
            "phone": phone,
            "specimen_limit": specimen_limit,
        },
        "summary": {
            "total_requests": len(specimen_history),
            "total_books_requested": total_books_requested,
            "total_books_approved": total_books_approved,
        },
        "specimen_requests": specimen_history,
        "orders": order_history
    }


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    user = await get_user_by_email(body.email)
    if not user:
        raise HTTPException(status_code=404, detail="Email address is not registered.")
    if not int(user.get("is_verified") or 0):
        raise HTTPException(status_code=400, detail="This account email is not verified.")

    otp = make_otp()
    await save_otp(body.email, otp, otp_expires_at())

    try:
        await send_verification_email(body.email, user.get("name") or "User", otp)
    except Exception as e:
        print(f"Failed to send email OTP: {e}")

    has_phone = bool(user.get("phone"))
    return {"message": "Password reset code sent to your email.", "has_phone": has_phone}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    if len(body.new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    # 1. Verify email OTP
    email_record = await get_valid_otp(body.email, body.otp)
    if not email_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    user = await get_user_by_email(body.email)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")

    # 2. If phone is provided, verify phone OTP
    if body.phone:
        p_clean = "".join(filter(str.isdigit, str(body.phone)))
        if len(p_clean) == 12 and p_clean.startswith("91"):
            p_clean = p_clean[2:]
        if len(p_clean) != 10:
            raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits.")

        if not body.phone_otp:
            raise HTTPException(status_code=400, detail="Phone verification OTP is required")

        phone_key = f"phone_verify_{p_clean}_{body.email}"
        phone_record = await get_valid_otp(phone_key, body.phone_otp)
        if not phone_record:
            raise HTTPException(status_code=400, detail="Invalid or expired WhatsApp OTP code")

        # Consume phone OTP
        await consume_otp(phone_record["id"])

    # 3. Consume email OTP
    await consume_otp(email_record["id"])

    # 4. Hash new password
    loop = asyncio.get_event_loop()
    new_hash = await loop.run_in_executor(None, partial(pwd_ctx.hash, body.new_password))

    # 5. Update user password and phone in Baserow
    client = BaserowClient()
    update_data = {"password_hash": new_hash}
    if body.phone:
        p_clean = "".join(filter(str.isdigit, str(body.phone)))
        if len(p_clean) == 12 and p_clean.startswith("91"):
            p_clean = p_clean[2:]
        update_data["phone"] = p_clean

    await client.update_row(TABLE_IDS["auth_users"], user["id"], update_data)

    return {"message": "Password reset successfully. You can now sign in."}


@router.post("/send-whatsapp-verify-otp")
async def send_whatsapp_verify_otp(body: SendWhatsAppVerifyOtpRequest):
    # 1. Validate email OTP first
    email_record = await get_valid_otp(body.email, body.otp)
    if not email_record:
        raise HTTPException(status_code=400, detail="Session invalid or email OTP expired. Please request reset code again.")
    
    # 2. Clean phone number
    p_clean = "".join(filter(str.isdigit, str(body.phone)))
    if len(p_clean) == 12 and p_clean.startswith("91"):
        p_clean = p_clean[2:]
    if len(p_clean) != 10:
        raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits.")

    # 3. Check if phone number is already taken by another verified user
    existing_phone = await get_user_by_phone(body.phone)
    if existing_phone and existing_phone.get("email") != body.email:
        raise HTTPException(status_code=409, detail="An account with this phone number already exists.")

    # 4. Generate phone OTP and save it
    phone_key = f"phone_verify_{p_clean}_{body.email}"
    phone_otp = make_otp()
    await save_otp(phone_key, phone_otp, otp_expires_at())

    # 5. Send WhatsApp OTP
    try:
        from services.whatsapp import send_whatsapp_otp
        await send_whatsapp_otp(body.phone, phone_otp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send WhatsApp verification: {str(e)}")

    return {"message": "WhatsApp verification code sent successfully."}


@router.post("/send-change-password-otp")
async def send_change_password_otp(user: dict = Depends(current_user)):
    """Send a 6-digit Email OTP to a logged-in user/teacher to authorize changing their password."""
    otp = make_otp()
    await save_otp(user["email"], otp, otp_expires_at())

    await send_otp_to_user(user["email"], user["name"], user.get("phone", ""), otp)

    return {"message": "Verification OTP sent to your WhatsApp."}


@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, user: dict = Depends(current_user)):
    """Verify Email OTP and change password for logged-in user/teacher."""
    if len(body.new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    record = await get_valid_otp(user["email"], body.otp)
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired verification OTP code")

    await consume_otp(record["id"])

    loop = asyncio.get_event_loop()
    new_hash = await loop.run_in_executor(None, partial(pwd_ctx.hash, body.new_password))

    client = BaserowClient()
    await client.update_row(TABLE_IDS["auth_users"], user["id"], {"password_hash": new_hash})

    return {"message": "Password updated successfully."}


class ContactUsRequest(BaseModel):
    full_name: str
    phone: str
    email: str
    message: str


@router.post("/contact")
async def contact_us(body: ContactUsRequest):
    from services.email import send_contact_us_email
    try:
        await send_contact_us_email(
            full_name=body.full_name,
            phone=body.phone,
            email=body.email,
            message=body.message
        )
        return {"success": True, "message": "Email sent successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

