"""
Bulk Order System — FastAPI Router
Handles bulk order creation (no auth), admin approval, split payments, and shipping.
"""
import os
import uuid
import json
import base64
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

import httpx
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from services.baserow import BaserowClient
from services.whatsapp import (
    send_bulk_order_received,
    send_bulk_order_admin_notify,
    send_bulk_order_approved,
)
from services.shipway import create_shipment
from config import TABLE_IDS, WHATSAPP_MAIN_PHONE

logger = logging.getLogger(__name__)
router = APIRouter()
client = BaserowClient()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_API = "https://api.razorpay.com/v1"
SITE_URL = os.getenv("SITE_URL", "https://cremsonpublications.com")


def _razorpay_auth() -> str:
    token = base64.b64encode(f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode()).decode()
    return f"Basic {token}"


# ── Schemas ────────────────────────────────────────────────────────────────────

class BulkOrderItem(BaseModel):
    product_id: int
    title: str
    qty: int
    price: float


class BulkOrderCreate(BaseModel):
    contact_name: str
    school_name: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str
    items: List[BulkOrderItem]


class BulkOrderApprove(BaseModel):
    discount_type: Optional[str] = "percentage"   # "percentage" or "fixed"
    discount_value: Optional[float] = 0
    admin_notes: Optional[str] = ""


class SplitPaymentCreate(BaseModel):
    split_count: int         # Number of students
    student_names: Optional[List[str]] = []   # Optional names per student


# ── Helpers ────────────────────────────────────────────────────────────────────

def _calc_final_amount(subtotal: float, discount_type: str, discount_value: float) -> float:
    if discount_type == "percentage":
        disc = (subtotal * discount_value) / 100
    else:
        disc = discount_value
    return max(0, round(subtotal - disc, 2))


def _to_paise(amount: float) -> int:
    return int(round(amount * 100))


async def _razorpay_create_order(amount_inr: float, receipt: str) -> dict:
    async with httpx.AsyncClient(timeout=20) as http:
        resp = await http.post(
            f"{RAZORPAY_API}/orders",
            headers={"Authorization": _razorpay_auth(), "Content-Type": "application/json"},
            json={"amount": _to_paise(amount_inr), "currency": "INR", "receipt": receipt},
        )
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail=f"Razorpay error: {resp.text}")
        return resp.json()


def _get_row_items(row: dict) -> list:
    raw = row.get("items", "[]")
    if isinstance(raw, list):
        return raw
    try:
        return json.loads(raw) if raw else []
    except Exception:
        return []


def _get_student_payments(row: dict) -> list:
    raw = row.get("student_payments", "[]")
    if isinstance(raw, list):
        return raw
    try:
        return json.loads(raw) if raw else []
    except Exception:
        return []


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/", summary="Submit a new bulk order (no auth required)")
async def create_bulk_order(body: BulkOrderCreate, bg: BackgroundTasks):
    token = str(uuid.uuid4())
    subtotal = round(sum(item.price * item.qty for item in body.items), 2)
    items_json = json.dumps([i.model_dump() for i in body.items])

    row = await client.create_row(TABLE_IDS["bulk_orders"], {
        "token": token,
        "contact_name": body.contact_name,
        "school_name": body.school_name,
        "phone": body.phone,
        "address": body.address,
        "city": body.city,
        "state": body.state,
        "pincode": body.pincode,
        "items": items_json,
        "subtotal": subtotal,
        "discount_type": "percentage",
        "discount_value": 0,
        "final_amount": subtotal,
        "split_count": 0,
        "paid_count": 0,
        "status": "pending_review",
        "student_payments": "[]",
        "order_date": datetime.utcnow().isoformat(),
    })

    order_link = f"{SITE_URL}/bulk-order/{token}"

    bg.add_task(
        send_bulk_order_received,
        phone=body.phone,
        name=body.contact_name,
        school=body.school_name,
        order_link=order_link,
    )
    bg.add_task(
        send_bulk_order_admin_notify,
        admin_phone=WHATSAPP_MAIN_PHONE,
        name=body.contact_name,
        school=body.school_name,
        total=subtotal,
        order_link=f"{SITE_URL}/admin/bulk-orders",
    )

    return {"success": True, "token": token, "order_link": order_link, "id": row["id"]}


@router.get("/", summary="List all bulk orders (admin)")
async def list_bulk_orders(page: int = 1, size: int = 50, search: str = None):
    return await client.get_rows(TABLE_IDS["bulk_orders"], page=page, size=size, search=search)


@router.get("/{token}", summary="Get a bulk order by token (public)")
async def get_bulk_order(token: str):
    data = await client.get_rows(TABLE_IDS["bulk_orders"], size=1, search=token)
    rows = data.get("results", data.get("items", []))
    matched = [r for r in rows if r.get("token") == token]
    if not matched:
        raise HTTPException(status_code=404, detail="Bulk order not found")
    row = matched[0]
    # Parse JSON fields for response
    row["items"] = _get_row_items(row)
    row["student_payments"] = _get_student_payments(row)
    return row


@router.patch("/{row_id}/approve", summary="Admin approves bulk order + sets discount")
async def approve_bulk_order(row_id: int, body: BulkOrderApprove, bg: BackgroundTasks):
    row = await client.get_row(TABLE_IDS["bulk_orders"], row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Bulk order not found")

    subtotal = float(row.get("subtotal", 0))
    final_amount = _calc_final_amount(subtotal, body.discount_type, body.discount_value)

    updated = await client.update_row(TABLE_IDS["bulk_orders"], row_id, {
        "status": "approved",
        "discount_type": body.discount_type,
        "discount_value": body.discount_value,
        "final_amount": final_amount,
        "admin_notes": body.admin_notes or "",
        "approved_at": datetime.utcnow().isoformat(),
    })

    token = row.get("token", "")
    order_link = f"{SITE_URL}/bulk-order/{token}"
    phone = row.get("phone", "")
    name = row.get("contact_name", "")

    bg.add_task(
        send_bulk_order_approved,
        phone=phone,
        name=name,
        final_amount=final_amount,
        order_link=order_link,
    )

    updated["items"] = _get_row_items(updated)
    updated["student_payments"] = _get_student_payments(updated)
    return updated


@router.post("/{token}/create-payment", summary="Teacher pays full amount — create Razorpay order")
async def create_full_payment(token: str):
    data = await client.get_rows(TABLE_IDS["bulk_orders"], size=1, search=token)
    rows = data.get("results", data.get("items", []))
    matched = [r for r in rows if r.get("token") == token]
    if not matched:
        raise HTTPException(status_code=404, detail="Bulk order not found")

    row = matched[0]
    if row.get("status") != "approved":
        raise HTTPException(status_code=400, detail="Order is not approved yet")

    final_amount = float(row.get("final_amount", 0))
    rz_order = await _razorpay_create_order(final_amount, f"bulk_{row['id']}")

    await client.update_row(TABLE_IDS["bulk_orders"], row["id"], {
        "razorpay_order_id": rz_order["id"],
    })

    return {
        "razorpay_order_id": rz_order["id"],
        "amount": rz_order["amount"],
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
        "contact_name": row.get("contact_name", ""),
        "phone": row.get("phone", ""),
    }


@router.post("/{token}/split", summary="Generate N student payment tokens")
async def create_split_payment(token: str, body: SplitPaymentCreate):
    if body.split_count < 2:
        raise HTTPException(status_code=400, detail="Split count must be at least 2")

    data = await client.get_rows(TABLE_IDS["bulk_orders"], size=1, search=token)
    rows = data.get("results", data.get("items", []))
    matched = [r for r in rows if r.get("token") == token]
    if not matched:
        raise HTTPException(status_code=404, detail="Bulk order not found")

    row = matched[0]
    if row.get("status") != "approved":
        raise HTTPException(status_code=400, detail="Order is not approved yet")

    final_amount = float(row.get("final_amount", 0))
    per_student = round(final_amount / body.split_count, 2)

    students = []
    for i in range(body.split_count):
        name = (body.student_names[i] if body.student_names and i < len(body.student_names) else f"Student {i+1}")
        students.append({
            "student_token": str(uuid.uuid4()),
            "name": name,
            "amount": per_student,
            "paid": False,
            "razorpay_payment_id": None,
        })

    await client.update_row(TABLE_IDS["bulk_orders"], row["id"], {
        "split_count": body.split_count,
        "paid_count": 0,
        "status": "approved",
        "student_payments": json.dumps(students),
    })

    site = SITE_URL
    main_token = row.get("token", "")
    return {
        "split_count": body.split_count,
        "per_student_amount": per_student,
        "students": [
            {**s, "pay_link": f"{site}/bulk-order/{main_token}/pay/{s['student_token']}"}
            for s in students
        ],
    }


@router.post("/{token}/student-payment/{student_token}", summary="Create Razorpay order for a student")
async def create_student_payment(token: str, student_token: str):
    data = await client.get_rows(TABLE_IDS["bulk_orders"], size=1, search=token)
    rows = data.get("results", data.get("items", []))
    matched = [r for r in rows if r.get("token") == token]
    if not matched:
        raise HTTPException(status_code=404, detail="Bulk order not found")

    row = matched[0]
    students = _get_student_payments(row)
    student = next((s for s in students if s.get("student_token") == student_token), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student payment link not found")
    if student.get("paid"):
        raise HTTPException(status_code=400, detail="Already paid")

    rz_order = await _razorpay_create_order(
        student["amount"],
        f"bulk_{row['id']}_s_{student_token[:8]}"
    )

    return {
        "razorpay_order_id": rz_order["id"],
        "amount": rz_order["amount"],
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
        "student_name": student.get("name", ""),
        "bulk_order_token": token,
        "student_token": student_token,
    }


@router.post("/{token}/verify-payment", summary="Verify Razorpay payment (teacher or student)")
async def verify_bulk_payment(token: str, body: dict):
    import hmac, hashlib

    razorpay_order_id = body.get("razorpay_order_id", "")
    razorpay_payment_id = body.get("razorpay_payment_id", "")
    razorpay_signature = body.get("razorpay_signature", "")
    student_token = body.get("student_token")  # None = teacher full pay

    # Verify signature
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    if expected != razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    data = await client.get_rows(TABLE_IDS["bulk_orders"], size=1, search=token)
    rows = data.get("results", data.get("items", []))
    matched = [r for r in rows if r.get("token") == token]
    if not matched:
        raise HTTPException(status_code=404, detail="Bulk order not found")

    row = matched[0]
    row_id = row["id"]

    if student_token:
        # Student split payment
        students = _get_student_payments(row)
        for s in students:
            if s.get("student_token") == student_token:
                s["paid"] = True
                s["razorpay_payment_id"] = razorpay_payment_id
                break

        paid_count = sum(1 for s in students if s.get("paid"))
        split_count = int(row.get("split_count", len(students)))
        new_status = "fully_paid" if paid_count >= split_count else "partially_paid"

        await client.update_row(TABLE_IDS["bulk_orders"], row_id, {
            "student_payments": json.dumps(students),
            "paid_count": paid_count,
            "status": new_status,
        })
        return {"success": True, "status": new_status, "paid_count": paid_count, "split_count": split_count}
    else:
        # Teacher full payment
        await client.update_row(TABLE_IDS["bulk_orders"], row_id, {
            "razorpay_payment_id": razorpay_payment_id,
            "status": "fully_paid",
            "paid_count": 1,
        })
        return {"success": True, "status": "fully_paid"}


@router.post("/{row_id}/ship", summary="Admin initiates shipping for a fully paid bulk order")
async def ship_bulk_order(row_id: int, bg: BackgroundTasks):
    row = await client.get_row(TABLE_IDS["bulk_orders"], row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Bulk order not found")
    if row.get("status") != "fully_paid":
        raise HTTPException(status_code=400, detail="Order is not fully paid yet")

    items = _get_row_items(row)
    item_count = sum(i.get("qty", 1) for i in items)

    shipment_data = {
        "first_name": row.get("contact_name", "").split()[0],
        "last_name": " ".join(row.get("contact_name", "").split()[1:]) or "-",
        "email": "",
        "phone": row.get("phone", ""),
        "address": row.get("address", ""),
        "city": row.get("city", ""),
        "state": row.get("state", ""),
        "pincode": row.get("pincode", ""),
        "order_id": f"BULK-{row_id}",
        "item_name": f"{row.get('school_name', 'Bulk')} - {item_count} items",
        "item_count": item_count,
        "cod": 0,
        "total": float(row.get("final_amount", 0)),
        "weight": item_count * 0.3,
    }

    try:
        result = await create_shipment(shipment_data)
        awb = result.get("awb") or result.get("data", {}).get("awb", "")
    except Exception as e:
        logger.error(f"[BulkOrder] Shipway error: {e}")
        raise HTTPException(status_code=502, detail=f"Shipway error: {str(e)}")

    await client.update_row(TABLE_IDS["bulk_orders"], row_id, {
        "status": "shipped",
        "shipway_awb": str(awb),
    })

    return {"success": True, "awb": awb, "status": "shipped"}
