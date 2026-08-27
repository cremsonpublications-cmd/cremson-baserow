import os
import hmac
import hashlib
import base64
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from services.baserow import BaserowClient
from services.whatsapp import (
    send_order_confirmation,
    send_payment_failed,
    send_payment_success,
    send_shipment_created,
)
from services.shipway import create_shipment
from config import TABLE_IDS, WHATSAPP_MAIN_PHONE

load_dotenv(override=True)

logger = logging.getLogger(__name__)
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


# ── Background task: Shipway create shipment ──────────────────────────────────

async def _create_shipway_shipment(
    baserow_row_id: int,
    order_id: str,
    order_date: str,
    total_amount: float,
    items: List[Dict[str, Any]],
    user_info: Dict[str, Any],
    delivery: Dict[str, Any],
) -> None:
    """
    Called as a FastAPI BackgroundTask after the payment verify response is sent.
    Creates a shipment in Shipway, stores the result in Baserow,
    updates order status to READY_TO_PACK, and sends a WhatsApp notification.
    """
    logger.info(f"[Shipway BG] Starting shipment creation for order={order_id}")

    # Build items description for Shipway
    items_desc = ", ".join(
        (i.get("name") or i.get("title") or "Book")
        for i in items
    ) if items else "Books"

    # Extract shipping address from delivery payload
    shipping = delivery if isinstance(delivery, dict) else {}
    user_address = user_info.get("address") or {}
    if not isinstance(user_address, dict):
        user_address = {}

    cust_name = shipping.get("name") or user_info.get("name", "")
    cust_email = shipping.get("email") or user_info.get("email", "")
    cust_phone = shipping.get("phone") or user_info.get("phone", "")

    addr = shipping.get("address") or user_address.get("street") or ""
    addr2 = shipping.get("address2") or user_address.get("apartment") or ""
    city = shipping.get("city") or user_address.get("city") or ""
    state = shipping.get("state") or user_address.get("state") or ""
    pincode = shipping.get("pincode") or user_address.get("pincode") or ""

    order_payload = {
        "order_id": order_id,
        "order_date": order_date,
        "total_amount": total_amount,
        "items": items,
        "items_description": items_desc,
        "customer_name": cust_name,
        "customer_email": cust_email,
        "customer_phone": cust_phone,
        "address": addr,
        "address2": addr2,
        "city": city,
        "state": state,
        "pincode": pincode,
    }

    result = await create_shipment(order_payload)

    baserow = BaserowClient()

    # Build updated delivery dictionary
    deliv = dict(shipping) if isinstance(shipping, dict) else {}
    deliv.setdefault("name", cust_name)
    deliv.setdefault("email", cust_email)
    deliv.setdefault("phone", cust_phone)
    deliv.setdefault("address", addr)
    deliv.setdefault("address2", addr2)
    deliv.setdefault("city", city)
    deliv.setdefault("state", state)
    deliv.setdefault("pincode", pincode)

    if result["success"]:
        deliv["shipment_id"] = result.get("shipment_id", "")
        deliv["awb"] = result.get("awb", "")
        deliv["courier"] = result.get("courier_name", "")
        deliv["carrier_id"] = result.get("carrier_id", "")
        deliv["tracking_url"] = result.get("tracking_url", "")
        deliv["label_url"] = result.get("label_url", "")
        deliv["status"] = "Confirmed"

        shipment_update = {
            "order_status": "READY_TO_PACK",
            "delivery": json.dumps(deliv),
        }
        logger.info(
            f"[Shipway BG] Shipment created for order={order_id} "
            f"AWB={result.get('awb')} Courier={result.get('courier_name')}"
        )
    else:
        # Shipway failed — still update status so admin can see & retry
        deliv["shipment_id"] = ""
        deliv["awb"] = ""
        deliv["courier"] = ""
        deliv["carrier_id"] = ""
        deliv["tracking_url"] = ""
        deliv["label_url"] = ""

        shipment_update = {
            "order_status": "READY_TO_PACK",
            "delivery": json.dumps(deliv),
        }
        logger.error(
            f"[Shipway BG] Shipment creation FAILED for order={order_id}: "
            f"{result.get('error')}"
        )

    try:
        await baserow.update_row(TABLE_IDS["orders"], baserow_row_id, shipment_update)
        logger.info(f"[Shipway BG] Baserow updated for order={order_id}")
    except Exception as err:
        logger.error(f"[Shipway BG] Baserow update failed for order={order_id}: {err}")

    # WhatsApp & Email: notify customer that shipment is created (only if Shipway succeeded)
    if result["success"]:
        phone = user_info.get("phone") or user_info.get("whatsapp_phone") or ""
        email = user_info.get("email") or ""
        name = user_info.get("name", "Customer")
        
        # Email Dispatch
        if email:
            try:
                from services.email import send_shipment_created_email
                await send_shipment_created_email(
                    to_email=email,
                    customer_name=name,
                    order_id=order_id,
                    awb=result.get("awb", ""),
                    courier_name=result.get("courier_name", ""),
                    tracking_url=result.get("tracking_url", ""),
                )
                logger.info(f"[Shipway BG] Email shipment created sent successfully to {email}")
            except Exception as mail_err:
                logger.error(f"[Shipway BG] Email send_shipment_created failed: {mail_err}")

        # WhatsApp Dispatch
        if phone:
            try:
                await send_shipment_created(
                    phone=phone,
                    customer_name=name,
                    order_id=order_id,
                    awb=result.get("awb", ""),
                    courier_name=result.get("courier_name", ""),
                    tracking_url=result.get("tracking_url", ""),
                )
            except Exception as wa_err:
                logger.error(f"[Shipway BG] WhatsApp send_shipment_created failed: {wa_err}")


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
    return {
        "order_id":   order["id"],
        "amount":     order["amount"],
        "currency":   order["currency"],
        "key_id":     RAZORPAY_KEY_ID,
    }


@router.post("/verify")
async def verify_payment(body: VerifyPaymentRequest, background_tasks: BackgroundTasks):
    """
    1. Verify Razorpay signature
    2. Save order to Baserow
    3. Send WhatsApp: payment success + order confirmation
    4. [Background] Create Shipway shipment → store shipment data → update status
    Returns immediately without waiting for Shipway.
    """
    # ── Step 1: Verify signature ──────────────────────────────────────────────
    message = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        msg=message.encode(),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment verification failed — invalid signature")

    baserow_row_id: int = 0
    order_id: str = ""

    try:
        baserow_client = BaserowClient()

        # ── Step 2: Generate sequential order ID by date (CP<DD><MM><YY><INDEX>) ─────────
        try:
            from datetime import timedelta, timezone
            import re
            ist = timezone(timedelta(hours=5, minutes=30))
            now_ist = datetime.now(ist)
            date_prefix = now_ist.strftime("%d%m%y") # e.g. "270826"
            
            cp_res = await baserow_client.get_rows(TABLE_IDS["orders"], search=f"CP{date_prefix}", size=200)
            cp_results = cp_res.get("results", [])
            max_index = 0
            pattern = re.compile(rf"^CP{date_prefix}(\d+)$", re.IGNORECASE)
            for r in cp_results:
                oid = str(r.get("order_id") or "").strip()
                m = pattern.match(oid)
                if m:
                    index_val = int(m.group(1))
                    if index_val > max_index:
                        max_index = index_val
            order_id = f"CP{date_prefix}{max_index + 1}"
        except Exception as e:
            logger.warning(f"Error generating date-based CP order_id: {e}")
            from datetime import timedelta, timezone
            ist = timezone(timedelta(hours=5, minutes=30))
            now_ist = datetime.now(ist)
            date_prefix = now_ist.strftime("%d%m%y")
            import random
            fallback_rand = random.randint(10, 99)
            order_id = f"CP{date_prefix}{fallback_rand}"
        order_date = body.order_date
        if not order_date or len(order_date) <= 10:
            order_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        elif "T" in order_date:
            try:
                # Parse ISO formats like 2026-07-29T17:05:22.000Z
                cleaned = order_date.replace("Z", "+00:00")
                dt = datetime.fromisoformat(cleaned)
                order_date = dt.strftime("%Y-%m-%d %H:%M:%S")
            except Exception:
                order_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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
        delivery_str = (
            json.dumps(body.delivery)
            if body.delivery
            else json.dumps({"notes": "", "status": "Confirmed"})
        )

        order_data = {
            "order_id": order_id,
            "order_status": "READY_TO_PACK",   # Will be confirmed after Shipway succeeds
            "order_date": order_date,
            "user_info": user_info_str,
            "items": items_str,
            "order_summary": order_summary_str,
            "payment": json.dumps(payment_dict),
            "delivery": delivery_str,
            # Shipment fields — populated by background task
            "shipment_id": "",
            "awb": "",
            "courier": "",
            "tracking_url": "",
            "label_url": "",
        }

        created_row = await baserow_client.create_row(TABLE_IDS["orders"], order_data)
        baserow_row_id = created_row.get("id", 0)
        logger.info(f"[Payment] Order saved: order_id={order_id} row_id={baserow_row_id}")

        # ── Step 3: WhatsApp & Email — single combined order & payment confirmation ──
        try:
            user_info = body.user_info or {}
            phone = user_info.get("phone", "") or user_info.get("whatsapp_phone", "")
            email = user_info.get("email", "")
            name = user_info.get("name", "Customer")
            total = body.order_summary.get("grandTotal", 0) if body.order_summary else 0
            item_count = sum(i.get("quantity", 1) for i in (body.items or []))

            if email:
                try:
                    from services.email import send_order_confirmation_email
                    await send_order_confirmation_email(
                        to_email=email,
                        customer_name=name,
                        order_id=order_id,
                        total_amount=total,
                        transaction_id=body.razorpay_payment_id,
                        items=body.items,
                    )
                    logger.info(f"[Payment] Email order confirmation sent successfully to {email}")
                except Exception as mail_err:
                    logger.error(f"[Payment] Email order confirmation failed: {mail_err}")

            if phone:
                await send_order_confirmation(
                    phone=phone,
                    customer_name=name,
                    order_id=order_id,
                    total_amount=total,
                    transaction_id=body.razorpay_payment_id,
                    item_count=item_count,
                    items=body.items,
                )

            # Admin copy
            if WHATSAPP_MAIN_PHONE:
                def _clean(n: str) -> str:
                    n = "".join(filter(str.isdigit, n))
                    return "91" + n if len(n) == 10 else n

                if phone and _clean(phone) != _clean(WHATSAPP_MAIN_PHONE):
                    await send_order_confirmation(
                        phone=WHATSAPP_MAIN_PHONE,
                        customer_name=name,
                        order_id=order_id,
                        total_amount=total,
                        transaction_id=body.razorpay_payment_id,
                        item_count=item_count,
                        items=body.items,
                    )
        except Exception as notify_err:
            logger.error(f"[Payment] WhatsApp notification error (non-fatal): {notify_err}")

    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to save order: {str(exc)}")

    # ── Step 4: Shipway — runs in background, does NOT block the response ─────
    if baserow_row_id:
        background_tasks.add_task(
            _create_shipway_shipment,
            baserow_row_id,
            order_id,
            order_date,
            body.order_summary.get("grandTotal", 0) if body.order_summary else 0,
            body.items or [],
            body.user_info or {},
            body.delivery or {},
        )

    return {"success": True, "payment_id": body.razorpay_payment_id, "order_id": order_id}


class PaymentFailedRequest(BaseModel):
    phone: str
    name: str
    amount: float
    order_id: Optional[str] = "DRAFT"


@router.post("/failed")
async def payment_failed(body: PaymentFailedRequest):
    """Called by the frontend when a payment fails on Razorpay."""
    try:
        email = ""
        if body.order_id and body.order_id != "DRAFT":
            try:
                client = BaserowClient()
                rows = await client.get_rows(TABLE_IDS["orders"], filters={"order_id": body.order_id})
                results = rows.get("results", [])
                if results:
                    user_info_raw = results[0].get("user_info", "{}")
                    user_info = json.loads(user_info_raw) if isinstance(user_info_raw, str) else (user_info_raw or {})
                    email = user_info.get("email") or ""
            except Exception as e:
                logger.error(f"[Payment] Failed to get email for payment_failed order: {e}")

        await send_payment_failed(
            phone=body.phone,
            customer_name=body.name,
            order_id=body.order_id,
            amount=body.amount,
        )

        if email:
            try:
                from services.email import send_payment_failed_email
                await send_payment_failed_email(
                    to_email=email,
                    customer_name=body.name,
                    order_id=body.order_id,
                    amount=body.amount,
                )
            except Exception as mail_err:
                logger.error(f"[Payment] Email send_payment_failed failed: {mail_err}")
    except Exception as exc:
        logger.error(f"[Payment] send_payment_failed error: {exc}")
    return {"success": True}


class RefundNotificationRequest(BaseModel):
    phone: str
    name: str
    order_id: str
    amount: float
    refund_id: Optional[str] = "-"


@router.post("/refund/initiated")
async def refund_initiated(body: RefundNotificationRequest):
    """Trigger WhatsApp notification when a refund is initiated."""
    try:
        from services.whatsapp import send_refund_initiated
        await send_refund_initiated(
            phone=body.phone,
            customer_name=body.name,
            order_id=body.order_id,
            amount=body.amount,
            refund_id=body.refund_id or "-",
        )
    except Exception as exc:
        logger.error(f"[Payment] send_refund_initiated error: {exc}")
    return {"success": True}


@router.post("/refund/completed")
async def refund_completed(body: RefundNotificationRequest):
    """Trigger WhatsApp notification when a refund is completed."""
    try:
        from services.whatsapp import send_refund_completed
        await send_refund_completed(
            phone=body.phone,
            customer_name=body.name,
            order_id=body.order_id,
            amount=body.amount,
            refund_id=body.refund_id or "-",
        )
    except Exception as exc:
        logger.error(f"[Payment] send_refund_completed error: {exc}")
    return {"success": True}
