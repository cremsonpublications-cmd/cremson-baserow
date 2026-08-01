"""
Razorpay Payment & Refund Service
Handles: Automated payment refunds via Razorpay API v1.
"""

import os
import base64
import logging
from typing import Any, Dict, Optional
import httpx
from dotenv import load_dotenv

load_dotenv(override=True)
logger = logging.getLogger(__name__)

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_API_URL = "https://api.razorpay.com/v1"


def _auth_header() -> str:
    """Generate Basic Auth header for Razorpay API."""
    key_id = os.getenv("RAZORPAY_KEY_ID", RAZORPAY_KEY_ID or "")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", RAZORPAY_KEY_SECRET or "")
    token = base64.b64encode(f"{key_id}:{key_secret}".encode()).decode()
    return f"Basic {token}"


async def issue_refund(
    payment_id: str,
    amount_rupees: Optional[float] = None,
    reason: str = "",
    notes: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Issue an immediate refund for a Razorpay payment transaction.

    Args:
        payment_id: Razorpay payment transaction ID (e.g. 'pay_TJa291havfGQzB')
        amount_rupees: Amount in INR to refund (if None, refunds full payment amount)
        reason: Description/reason for refund
        notes: Additional metadata key-value dictionary

    Returns:
        {
            "success": bool,
            "refund_id": str,
            "amount": float,
            "status": str,
            "error": str (on failure)
        }
    """
    if not payment_id:
        return {"success": False, "error": "Missing Razorpay payment ID"}

    url = f"{RAZORPAY_API_URL}/payments/{payment_id}/refund"
    headers = {
        "Authorization": _auth_header(),
        "Content-Type": "application/json",
    }

    payload: Dict[str, Any] = {
        "speed": "optimum",
        "notes": notes or {"reason": reason or "Return & Refund requested by admin"},
    }

    if amount_rupees is not None and amount_rupees > 0:
        # Convert INR rupees to paise (e.g. ₹434.00 -> 43400 paise)
        payload["amount"] = int(round(amount_rupees * 100))

    logger.info(f"[Razorpay Refund] Initiating refund for payment={payment_id}, payload={payload}")

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            logger.info(f"[Razorpay Refund] HTTP {resp.status_code}: {resp.text[:300]}")

            try:
                data = resp.json()
            except Exception:
                return {"success": False, "error": f"Invalid API response: {resp.text[:200]}"}

            if resp.status_code in (200, 201) and data.get("id"):
                refund_id = str(data.get("id"))
                amount_paise = data.get("amount", 0)
                status = str(data.get("status", "processed"))
                logger.info(
                    f"[Razorpay Refund] ✓ Refund successful! Refund ID={refund_id}, "
                    f"Amount=₹{amount_paise / 100:.2f}, Status={status}"
                )
                return {
                    "success": True,
                    "refund_id": refund_id,
                    "amount": amount_paise / 100.0,
                    "status": status,
                    "raw_response": data,
                }
            else:
                err_msg = data.get("error", {}).get("description") or data.get("message") or "Refund failed"
                logger.error(f"[Razorpay Refund] ❌ Refund failed: {err_msg}")
                return {"success": False, "error": err_msg, "raw_response": data}

    except Exception as exc:
        logger.error(f"[Razorpay Refund] Exception during refund: {exc}", exc_info=True)
        return {"success": False, "error": str(exc)}
