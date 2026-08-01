import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel

from config import TABLE_IDS
from services.baserow import BaserowClient
from services.shipway import request_pickup, create_shipment
from services.whatsapp import send_pickup_requested

logger = logging.getLogger(__name__)
router = APIRouter()
client = BaserowClient()


class OrderStatusUpdate(BaseModel):
    order_status: str


# ── List / Get / Patch (unchanged) ────────────────────────────────────────────


@router.get("/", summary="List orders")
async def list_orders(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
    order_status: str = Query(None, description="Filter by order status value"),
    user_id: str = Query(None, description="Filter orders by user ID"),
    email: str = Query(None, description="Filter orders by user email"),
):
    """Return a paginated list of orders. Optionally filter by order_status, user_id, or email."""
    filters = {}
    if order_status is not None:
        filters["order_status"] = order_status

    contains_filters = {}
    if email is not None:
        contains_filters["user_info"] = f'"email": "{email}"'
    elif user_id is not None:
        contains_filters["user_info"] = f'"userId": {user_id}'

    return await client.get_rows(
        TABLE_IDS["orders"],
        page=page,
        size=size,
        search=search,
        filters=filters if filters else None,
        contains_filters=contains_filters if contains_filters else None,
        order_by="-order_date",
    )


@router.get("/{row_id}", summary="Get a single order by Baserow row ID")
async def get_order(row_id: int):
    """Return a single order by Baserow row ID."""
    return await client.get_row(TABLE_IDS["orders"], row_id)


@router.patch("/{row_id}", summary="Update order status by Baserow row ID")
async def update_order(row_id: int, body: OrderStatusUpdate):
    return await client.update_row(TABLE_IDS["orders"], row_id, body.model_dump(exclude_none=True))


# ── Admin action: Packed & Ready for Pickup ───────────────────────────────────


async def _notify_pickup_requested(
    phone: str,
    name: str,
    order_id: str,
    tracking_url: str,
) -> None:
    """Background task: send WhatsApp after marking pickup requested."""
    try:
        await send_pickup_requested(
            phone=phone,
            customer_name=name,
            order_id=order_id,
            tracking_url=tracking_url,
        )
    except Exception as exc:
        logger.error(f"[Orders] send_pickup_requested WhatsApp error: {exc}")


@router.post(
    "/{order_id}/ready-for-pickup",
    summary="Admin: Mark order as packed and request courier pickup",
)
async def ready_for_pickup(order_id: str, background_tasks: BackgroundTasks):
    """
    Called when admin clicks 'Packed & Ready for Pickup'.
    1. Finds the order by order_id string (e.g. BOOK5)
    2. Validates status is READY_TO_PACK
    3. Calls Shipway request_pickup()
    4. Updates Baserow status → PICKUP_REQUESTED
    5. Sends WhatsApp to customer (background task)
    """
    # ── 1. Find order ─────────────────────────────────────────────────────────
    rows = await client.get_rows(TABLE_IDS["orders"], filters={"order_id": order_id})
    results = rows.get("results", [])
    if not results:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    order = results[0]
    row_id: int = order["id"]

    # ── 2. Guard: must be READY_TO_PACK ──────────────────────────────────────
    current_status = order.get("order_status", "")
    if current_status not in ("READY_TO_PACK", "Confirmed"):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Order {order_id} is in status '{current_status}'. "
                "Only READY_TO_PACK orders can be marked for pickup."
            ),
        )

    delivery_raw = order.get("delivery") or "{}"
    try:
        delivery_data = json.loads(delivery_raw) if isinstance(delivery_raw, str) else (delivery_raw or {})
    except Exception:
        delivery_data = {}

    shipment_id: str = delivery_data.get("shipment_id") or ""
    awb: str = delivery_data.get("awb") or ""
    carrier_id: str = delivery_data.get("carrier_id") or ""
    tracking_url: str = delivery_data.get("tracking_url") or ""

    if not shipment_id and not awb:
        logger.info(f"[Orders] Order {order_id} has no shipment_id/awb. Attempting shipment creation first...")
        
        # Build items description for Shipway
        items_raw = order.get("items") or "[]"
        try:
            items = json.loads(items_raw) if isinstance(items_raw, str) else (items_raw or [])
        except Exception:
            items = []

        items_desc = ", ".join(
            (i.get("name") or i.get("title") or "Book")
            for i in items
        ) if items else "Books"

        # Extract shipping address
        user_info_raw = order.get("user_info") or "{}"
        try:
            user_info = json.loads(user_info_raw) if isinstance(user_info_raw, str) else (user_info_raw or {})
        except Exception:
            user_info = {}

        user_address = user_info.get("address") or {}
        if not isinstance(user_address, dict):
            user_address = {}

        cust_name = delivery_data.get("name") or user_info.get("name", "")
        cust_email = delivery_data.get("email") or user_info.get("email", "")
        cust_phone = delivery_data.get("phone") or user_info.get("phone", "")

        addr = delivery_data.get("address") or user_address.get("street") or ""
        addr2 = delivery_data.get("address2") or user_address.get("apartment") or ""
        city = delivery_data.get("city") or user_address.get("city") or ""
        state = delivery_data.get("state") or user_address.get("state") or ""
        pincode = delivery_data.get("pincode") or user_address.get("pincode") or ""

        # Weight/dimensions
        weight = order.get("weight") or 0.5
        weight_grams = int(weight * 1000)

        # Check total amount
        order_summary_raw = order.get("order_summary") or "{}"
        try:
            order_summary = json.loads(order_summary_raw) if isinstance(order_summary_raw, str) else (order_summary_raw or {})
        except Exception:
            order_summary = {}
        total_amount = order_summary.get("grandTotal") or order.get("total_amount") or 0.0

        order_payload = {
            "order_id": order_id,
            "order_date": order.get("order_date") or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
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
            "weight_grams": weight_grams,
        }

        shipment_result = await create_shipment(order_payload)
        if not shipment_result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=f"Failed to auto-create Shipway shipment: {shipment_result.get('error', 'Unknown error')}"
            )

        # Store shipment details back to delivery_data
        shipment_id = shipment_result.get("shipment_id", "")
        awb = shipment_result.get("awb", "")
        carrier_id = shipment_result.get("carrier_id", "")
        tracking_url = shipment_result.get("tracking_url", "")
        label_url = shipment_result.get("label_url", "")

        delivery_data["shipment_id"] = shipment_id
        delivery_data["awb"] = awb
        delivery_data["courier"] = shipment_result.get("courier_name", "")
        delivery_data["carrier_id"] = carrier_id
        delivery_data["tracking_url"] = tracking_url
        delivery_data["label_url"] = label_url
        delivery_data["status"] = "Confirmed"

        # Update order in Baserow
        await client.update_row(TABLE_IDS["orders"], row_id, {
            "shipment_id": shipment_id,
            "awb": awb,
            "courier": shipment_result.get("courier_name", ""),
            "tracking_url": tracking_url,
            "label_url": label_url,
            "delivery": json.dumps(delivery_data),
        })
        logger.info(f"[Orders] Order {order_id} auto-registered in Shipway. AWB: {awb}")

    # ── 3. Request pickup from Shipway ────────────────────────────────────────
    pickup_result = await request_pickup(shipment_id, awb, order_id, carrier_id=carrier_id)
    logger.info(f"[Orders] Shipway pickup result for {order_id}: {pickup_result}")

    # ── 4. Update Baserow ─────────────────────────────────────────────────────
    now_iso = datetime.now().isoformat()
    delivery_data["status"] = "PICKUP_REQUESTED"
    delivery_data["pickup_requested_at"] = now_iso
    await client.update_row(TABLE_IDS["orders"], row_id, {
        "order_status": "PICKUP_REQUESTED",
        "pickup_requested_at": now_iso,
        "delivery": json.dumps(delivery_data),
    })
    logger.info(f"[Orders] Order {order_id} → PICKUP_REQUESTED")

    # ── 5. Notification (WhatsApp bypassed per request for pickup_requested) ─────
    logger.info(f"[Orders] Order {order_id} pickup requested in Shipway & Baserow (WhatsApp notification bypassed).")

    return {
        "success": True,
        "order_id": order_id,
        "status": "PICKUP_REQUESTED",
        "pickup_requested_at": now_iso,
        "shipway_response": pickup_result,
    }
