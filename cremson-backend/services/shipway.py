"""
Shipway Shipping Integration Service
API v2 — correct endpoint, Basic Auth, warehouse_id, weight in grams.
Handles: create_shipment, request_pickup, get_tracking, webhook status parsing.
"""

import base64
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)


def _cfg():
    """Lazy-load Shipway config to avoid circular imports."""
    from config import (
        SHIPWAY_USERNAME,
        SHIPWAY_LICENSE_KEY,
        SHIPWAY_BASE_URL,
        SHIPWAY_WAREHOUSE_ID,
        SHIPWAY_CARRIER_ID,
    )
    return SHIPWAY_USERNAME, SHIPWAY_LICENSE_KEY, SHIPWAY_BASE_URL, SHIPWAY_WAREHOUSE_ID, SHIPWAY_CARRIER_ID


def _auth_header(username: str, license_key: str) -> str:
    """Return Basic Auth header value: Basic base64(username:license_key)."""
    token = base64.b64encode(f"{username}:{license_key}".encode()).decode()
    return f"Basic {token}"


# ── Auth ──────────────────────────────────────────────────────────────────────


async def authenticate() -> bool:
    """Verify Shipway credentials are valid (lightweight API ping)."""
    username, license_key, base_url, _, _ = _cfg()
    if not username or not license_key:
        logger.error("[Shipway] SHIPWAY_USERNAME or SHIPWAY_LICENSE_KEY not set")
        return False

    url = f"{base_url}/api/getcarrier"
    headers = {"Authorization": _auth_header(username, license_key)}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            logger.info(f"[Shipway] Auth check → HTTP {resp.status_code}")
            return resp.status_code == 200
    except Exception as exc:
        logger.error(f"[Shipway] Auth check error: {exc}")
        return False


# ── Create Shipment ───────────────────────────────────────────────────────────


async def create_shipment(order: Dict[str, Any]) -> Dict[str, Any]:
    """
    Register a new shipment with Shipway (API v2) immediately after payment.

    Expected keys in `order`:
        order_id, order_date, total_amount, items (list of dicts with name/price/qty),
        customer_name, customer_email, customer_phone,
        address, address2, city, state, pincode,
        weight_grams (default 500), length/breadth/height (cm)

    Returns:
        {
            success: bool,
            shipment_id: str,
            awb: str,
            courier_name: str,
            tracking_url: str,
            label_url: str,
            error: str (on failure)
        }
    """
    username, license_key, base_url, warehouse_id, carrier_id = _cfg()
    url = f"{base_url}/api/v2orders"

    headers = {
        "Authorization": _auth_header(username, license_key),
        "Content-Type": "application/json",
    }

    # Build products array from items or fall back to a single generic product
    items: List[dict] = order.get("items") or []
    if items:
        products = [
            {
                "product": item.get("name") or item.get("title") or "Book",
                "price": float(item.get("currentPrice") or item.get("price") or 0),
                "product_code": str(item.get("product_id") or item.get("id") or "BOOK"),
                "product_quantity": int(item.get("quantity") or item.get("qty") or 1),
                "discount": 0,
                "tax_rate": 0,
                "tax_title": "GST",
            }
            for item in items
        ]
    else:
        products = [
            {
                "product": order.get("items_description") or "Books",
                "price": float(order.get("total_amount") or 0),
                "product_code": "BOOK",
                "product_quantity": 1,
                "discount": 0,
                "tax_rate": 0,
                "tax_title": "GST",
            }
        ]

    # Weight must be in grams for Shipway v2
    weight_grams = str(int(order.get("weight_grams") or order.get("weight", 0.5) * 1000 or 500))

    payload: Dict[str, Any] = {
        "order_id": order["order_id"],
        "order_date": (order.get("order_date") or "").split(" ")[0] or datetime.now().strftime("%Y-%m-%d"),
        "payment_type": "P",  # Prepaid
        "products": products,
        "shipping_firstname": order.get("customer_name", ""),
        "shipping_email": order.get("customer_email", ""),
        "shipping_phone": order.get("customer_phone", ""),
        "shipping_address": order.get("address", ""),
        "shipping_address_2": order.get("address2", ""),
        "shipping_city": order.get("city", ""),
        "shipping_state": order.get("state", ""),
        "shipping_zipcode": str(order.get("pincode", "")),
        "shipping_country": "India",
        "order_weight": weight_grams,
        "length": str(order.get("length", 20)),
        "breadth": str(order.get("breadth", 15)),
        "height": str(order.get("height", 5)),
        "collectable_amount": "0",
        "comment": f"Cremson order {order['order_id']}",
    }

    # Warehouse IDs (numeric strings from Shipway Settings → Pickup Address)
    if warehouse_id:
        payload["warehouse_id"] = warehouse_id
        payload["return_warehouse_id"] = warehouse_id

    # Carrier (0 or blank = auto-assign by Shipway)
    if carrier_id is not None:
        payload["carrier_id"] = str(carrier_id)

    logger.info(f"[Shipway] → create_shipment: order={order['order_id']}")
    logger.debug(f"[Shipway] Payload: {json.dumps(payload, default=str)}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            raw = resp.text
            logger.info(f"[Shipway] ← create_shipment HTTP {resp.status_code}: {raw[:500]}")

            try:
                data = resp.json()
            except Exception:
                return {"success": False, "error": f"Non-JSON response: {raw[:300]}"}

            # v2 API: success=true means it worked
            if not data.get("success"):
                err = data.get("message") or data.get("error") or "Shipway returned failure"
                logger.error(f"[Shipway] create_shipment failed: {err} | full={raw[:400]}")
                return {"success": False, "error": err}

            awb_resp = data.get("awb_response")
            if not isinstance(awb_resp, dict):
                awb_resp = {}
            awb = awb_resp.get("AWB") or awb_resp.get("awb") or ""
            carrier = str(awb_resp.get("carrier_id") or awb_resp.get("courier_name") or "")
            label_url = awb_resp.get("shipping_url") or awb_resp.get("label") or ""
            tracking_url = f"https://app-v1.shipway.com/tracking/forward/{awb}/" if awb else ""
            shipment_id = str(
                data.get("shipment_id")
                or awb_resp.get("shipment_id")
                or awb  # fallback: use AWB as ID
            )

            logger.info(
                f"[Shipway] Shipment created ✓ AWB={awb} ID={shipment_id} Carrier={carrier}"
            )
            return {
                "success": True,
                "shipment_id": shipment_id,
                "awb": awb,
                "courier_name": carrier,
                "carrier_id": str(awb_resp.get("carrier_id") or ""),
                "tracking_url": tracking_url,
                "label_url": label_url,
            }

    except httpx.TimeoutException:
        logger.error("[Shipway] create_shipment timed out after 30s")
        return {"success": False, "error": "Shipway API timed out"}
    except Exception as exc:
        logger.error(f"[Shipway] create_shipment exception: {exc}", exc_info=True)
        return {"success": False, "error": str(exc)}


# ── Request Pickup ────────────────────────────────────────────────────────────


async def request_pickup(
    shipment_id: str,
    awb: str,
    order_id: str,
    carrier_id: str = "",
    warehouse_id: str = "",
) -> Dict[str, Any]:
    """
    Ask Shipway to schedule a courier pickup using the createpickup API.
    Called when admin clicks 'Packed & Request Pickup'.

    Returns: { success: bool, data: dict, error: str }
    """
    username, license_key, base_url, default_warehouse_id, default_carrier_id = _cfg()
    url = f"{base_url}/api/createpickup"

    headers = {
        "Authorization": _auth_header(username, license_key),
        "Content-Type": "application/json",
    }

    # Format pickup date as YYYY-MM-DD
    pickup_date = datetime.now().strftime("%Y-%m-%d")
    pickup_time = "15:00"
    office_close_time = "19:00"

    w_id = warehouse_id or default_warehouse_id or "0"
    c_id = carrier_id or str(default_carrier_id or "0")

    payload = {
        "pickup_date": pickup_date,
        "pickup_time": pickup_time,
        "office_close_time": office_close_time,
        "package_count": "1",
        "carrier_id": str(c_id),
        "warehouse_id": str(w_id),
        "return_warehouse_id": str(w_id),
        "payment_type": "P",  # Prepaid
        "order_ids": [order_id],
    }

    logger.info(f"[Shipway] → request_pickup: order={order_id} AWB={awb} payload={payload}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            raw = resp.text
            logger.info(f"[Shipway] ← request_pickup HTTP {resp.status_code}: {raw[:400]}")

            try:
                data = resp.json()
            except Exception:
                data = raw

            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except Exception:
                    pass

            if isinstance(data, dict):
                ok = (
                    data.get("success") is True
                    or data.get("status") in [1, "1", "success", True]
                    or resp.status_code == 200
                )
                error_msg = data.get("message") or data.get("error") if not ok else None
            else:
                ok = resp.status_code == 200 and "success" in str(data).lower()
                error_msg = str(data) if not ok else None
                data = {"raw": data}

            return {
                "success": ok,
                "data": data,
                "error": error_msg,
            }

    except Exception as exc:
        logger.error(f"[Shipway] request_pickup exception: {exc}", exc_info=True)
        return {"success": False, "data": {}, "error": str(exc)}


# ── Get Tracking ──────────────────────────────────────────────────────────────


async def get_tracking(order_id: str) -> Dict[str, Any]:
    """Poll current tracking status for an order from Shipway."""
    username, license_key, base_url, _, _ = _cfg()
    url = f"{base_url}/api/getTrackingByOrderId"

    headers = {"Authorization": _auth_header(username, license_key)}
    params = {"order_id": order_id}

    logger.info(f"[Shipway] → get_tracking: order={order_id}")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers, params=params)
            logger.info(f"[Shipway] ← get_tracking HTTP {resp.status_code}")
            return resp.json()
    except Exception as exc:
        logger.error(f"[Shipway] get_tracking exception: {exc}")
        return {"error": str(exc)}


# ── Webhook Status Normalizer ─────────────────────────────────────────────────

SHIPWAY_STATUS_MAP: Dict[str, str] = {
    # Picked up
    "Picked Up": "PICKED_UP",
    "Shipment Picked Up": "PICKED_UP",
    "PP": "PICKED_UP",
    # In transit
    "In Transit": "IN_TRANSIT",
    "Reached at Hub": "IN_TRANSIT",
    "IT": "IN_TRANSIT",
    # Out for delivery
    "Out For Delivery": "OUT_FOR_DELIVERY",
    "Out for Delivery": "OUT_FOR_DELIVERY",
    "OD": "OUT_FOR_DELIVERY",
    # Delivered
    "Delivered": "DELIVERED",
    "DL": "DELIVERED",
    "DEL": "DELIVERED",
    # RTO
    "RTO": "RTO",
    "RTO Initiated": "RTO",
    "Return to Origin": "RTO",
    "RT": "RTO",
    # Undelivered
    "Undelivered": "UNDELIVERED",
    "UD": "UNDELIVERED",
    # Cancelled
    "Cancelled": "CANCELLED",
    # Exception
    "Exception": "DELIVERY_EXCEPTION",
    "Delivery Exception": "DELIVERY_EXCEPTION",
    "EX": "DELIVERY_EXCEPTION",
}


def parse_webhook_status(payload: Dict[str, Any]) -> str:
    """Normalise a Shipway webhook payload status to our internal status code."""
    raw = (
        payload.get("current_status")
        or payload.get("current_status_body")
        or payload.get("Status")
        or payload.get("status")
        or payload.get("api_input", {}).get("current_status")
        or payload.get("api_input", {}).get("current_status_desc")
        or "UNKNOWN"
    )
    return SHIPWAY_STATUS_MAP.get(str(raw), str(raw).upper().replace(" ", "_"))
