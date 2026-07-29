import os
import hmac
import hashlib
import base64
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

import httpx
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.baserow import BaserowClient
from services.whatsapp import send_order_confirmation, send_payment_success, send_payment_failed
from config import TABLE_IDS, WHATSAPP_MAIN_PHONE

load_dotenv(override=True)

router = APIRouter()

RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

RAZORPAY_API = "https://api.razorpay.com/v1"


def _auth_header() -> str:
    token = base64.b64encode(f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode()).decode()
    return f"Basic {token}"


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    amount: float          # in INR (e.g. 299.00)
    currency: str = "INR"
    receipt: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id:   str
    razorpay_payment_id: str
    razorpay_signature:  str

    order_status: Optional[str] = "Confirmed"
    order_date: Optional[str] = None
    user_info: Optional[Dict[str, Any]] = None
    items: Optional[List[Dict[str, Any]]] = None
    order_summary: Optional[Dict[str, Any]] = None
    delivery: Optional[Dict[str, Any]] = None



# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/create-order")
async def create_order(body: CreateOrderRequest):
    """Create a Razorpay order and return the order details to the frontend."""
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    payload = {
        "amount":   int(round(body.amount * 100)),   # paise
        "currency": body.currency,
        "receipt":  body.receipt or f"receipt_{int(__import__('time').time())}",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{RAZORPAY_API}/orders",
            json=payload,
            headers={
                "Authorization":  _auth_header(),
                "Content-Type":   "application/json",
            },
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Razorpay error: {resp.text}")

    order = resp.json()
    # Return key_id too so frontend can open the checkout
    return {
        "order_id":   order["id"],
        "amount":     order["amount"],
        "currency":   order["currency"],
        "key_id":     RAZORPAY_KEY_ID,
    }


@router.post("/verify")
async def verify_payment(body: VerifyPaymentRequest):
    """
    Verify the Razorpay payment signature.
    Razorpay signs: razorpay_order_id + '|' + razorpay_payment_id
    using HMAC-SHA256 with the key secret.
    """
    message = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        msg=message.encode(),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment verification failed — invalid signature")

    try:
        baserow_client = BaserowClient()

        # Generate sequential order ID: BOOK1, BOOK2, BOOK3 ...
        existing = await baserow_client.get_rows(TABLE_IDS["orders"], page=1, size=1)
        next_number = (existing.get("count") or 0) + 1
        order_id = f"BOOK{next_number}"

        user_info_str = json.dumps(body.user_info) if body.user_info else None
        items_str = json.dumps(body.items) if body.items else None
        order_summary_str = json.dumps(body.order_summary) if body.order_summary else None

        payment_dict = {
            "amount": body.order_summary.get("grandTotal") if body.order_summary else 0.0,
            "method": "Razorpay",
            "status": "Paid",
            "transactionId": body.razorpay_payment_id,
            "razorpay_order_id": body.razorpay_order_id,
            "razorpay_signature": body.razorpay_signature,
        }
        payment_str = json.dumps(payment_dict)
        delivery_str = json.dumps(body.delivery) if body.delivery else json.dumps({"notes": "", "status": "Confirmed"})

        order_data = {
            "order_id": order_id,
            "order_status": body.order_status or "Confirmed",
            "order_date": body.order_date or datetime.now().strftime("%Y-%m-%d"),
            "user_info": user_info_str,
            "items": items_str,
            "order_summary": order_summary_str,
            "payment": payment_str,
            "delivery": delivery_str,
        }
        await baserow_client.create_row(TABLE_IDS["orders"], order_data)

        # Send WhatsApp order confirmation via Meta WhatsApp API
        try:
            user_info = body.user_info or {}
            phone = user_info.get("phone", "") or user_info.get("whatsapp_phone", "")
            name = user_info.get("name", "Customer")
            total = body.order_summary.get("grandTotal", 0) if body.order_summary else 0
            item_count = sum(i.get("quantity", 1) for i in (body.items or []))
            
            # Send to customer
            if phone:
                await send_order_confirmation(
                    phone=phone,
                    customer_name=name,
                    order_id=order_id,
                    total_amount=total,
                    item_count=item_count,
                    items=body.items,
                )
                await send_payment_success(
                    phone=phone,
                    customer_name=name,
                    order_id=order_id,
                    amount=total,
                    transaction_id=body.razorpay_payment_id
                )
            
            # Send to main number (admin notification)
            if WHATSAPP_MAIN_PHONE:
                def clean_num(n):
                    return "".join(filter(str.isdigit, n))
                
                c_phone = clean_num(phone)
                m_phone = clean_num(WHATSAPP_MAIN_PHONE)
                if len(c_phone) == 10:
                    c_phone = "91" + c_phone
                if len(m_phone) == 10:
                    m_phone = "91" + m_phone
                
                if m_phone != c_phone:
                    await send_order_confirmation(
                        phone=WHATSAPP_MAIN_PHONE,
                        customer_name=name,
                        order_id=order_id,
                        total_amount=total,
                        item_count=item_count,
                        items=body.items,
                    )
        except Exception as notify_err:
            print(f"[WhatsApp] Notification error (non-fatal): {notify_err}")

    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to save order in Baserow: {str(e)}")

    return {"success": True, "payment_id": body.razorpay_payment_id, "order_id": order_id}


class PaymentFailedRequest(BaseModel):
    phone: str
    name: str
    amount: float
    order_id: Optional[str] = "DRAFT"

@router.post("/failed")
async def payment_failed(body: PaymentFailedRequest):
    """
    Called by the frontend when a payment fails on Razorpay.
    Sends a WhatsApp notification to the customer.
    """
    try:
        await send_payment_failed(
            phone=body.phone,
            customer_name=body.name,
            order_id=body.order_id,
            amount=body.amount,
        )
    except Exception as e:
        print(f"[WhatsApp] Failed to send payment failed notification: {e}")
    return {"success": True}

