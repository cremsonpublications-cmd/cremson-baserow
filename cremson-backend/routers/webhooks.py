"""
Shipway Webhook Handler
Receives real-time delivery status events from Shipway and:
  - Updates the order status in Baserow
  - Appends a row to the ShipmentHistory table
  - Sends a WhatsApp notification to the customer
  - Is fully idempotent (duplicate events are silently ignored)
"""

import json
import logging
from datetime import datetime
from typing import Any, Callable, Coroutine, Dict

from fastapi import APIRouter, BackgroundTasks, Request

from config import TABLE_IDS
from services.baserow import BaserowClient
from services.shipway import parse_webhook_status
from services.whatsapp import (
    send_delivered,
    send_out_for_delivery,
    send_rto,
)

logger = logging.getLogger(__name__)
router = APIRouter()
baserow = BaserowClient()

# Maps our internal status → WhatsApp sender function (PICKED_UP & IN_TRANSIT templates removed per spec)
_WA_SENDERS: Dict[str, Callable[..., Coroutine]] = {
    "OUT_FOR_DELIVERY": send_out_for_delivery,
    "DELIVERED": send_delivered,
    "RTO": send_rto,
}

# Statuses that do NOT trigger a WhatsApp message
_SILENT_STATUSES = {"UNDELIVERED", "CANCELLED", "DELIVERY_EXCEPTION"}


# ── Background processing ─────────────────────────────────────────────────────


async def _process_webhook(payload: Dict[str, Any]) -> None:
    """Background task: fan-out all side-effects for one Shipway event."""
    try:
        api_input = payload.get("api_input") or {}
        order_id: str = (
            payload.get("order_id") or
            payload.get("OrderId") or
            payload.get("order_number") or
            api_input.get("order_id") or
            ""
        )
        awb: str = (
            payload.get("awb") or payload.get("AWB") or
            payload.get("awb_number") or
            payload.get("awbno") or
            api_input.get("awbno") or
            ""
        )
        status = parse_webhook_status(payload)
        location: str = payload.get("location") or payload.get("city") or api_input.get("from") or ""
        description: str = (
            payload.get("remarks") or
            payload.get("description") or
            payload.get("scans_current_status") or
            api_input.get("current_status_desc") or
            status
        )
        event_ts: str = (
            payload.get("updated_on") or
            payload.get("status_time") or
            api_input.get("status_time") or
            datetime.now().isoformat()
        )

        logger.info(
            f"[Webhook] Processing: order={order_id or '?'} "
            f"awb={awb or '?'} status={status}"
        )

        if not order_id and not awb:
            logger.warning("[Webhook] No order_id or awb in payload — skipping")
            return

        # ── 1. Find the Baserow order row ─────────────────────────────────────
        order_row = None

        if order_id:
            rows = await baserow.get_rows(
                TABLE_IDS["orders"],
                filters={"order_id": order_id},
            )
            results = rows.get("results", [])
            if results:
                order_row = results[0]

        if not order_row and awb:
            rows = await baserow.get_rows(
                TABLE_IDS["orders"],
                contains_filters={"delivery": awb},
            )
            results = rows.get("results", [])
            if results:
                order_row = results[0]

        if not order_row:
            logger.warning(
                f"[Webhook] Order not found in Baserow "
                f"(order_id={order_id}, awb={awb}) — skipping"
            )
            return

        row_id: int = order_row["id"]
        effective_order_id = order_row.get("order_id", order_id)

        # ── 2. Idempotency check ──────────────────────────────────────────────
        current_status = order_row.get("order_status", "")
        if current_status == status:
            logger.info(
                f"[Webhook] order={effective_order_id} already "
                f"has status={status} — duplicate event ignored"
            )
            return

        # ── 3. Update order in Baserow ────────────────────────────────────────
        update_fields: Dict[str, Any] = {"order_status": status}
        if status == "PICKED_UP":
            update_fields["picked_up_at"] = event_ts
        elif status == "DELIVERED":
            update_fields["delivered_at"] = event_ts

        await baserow.update_row(TABLE_IDS["orders"], row_id, update_fields)
        logger.info(
            f"[Webhook] Updated order={effective_order_id} → status={status}"
        )

        # ── 4. Append to ShipmentHistory ──────────────────────────────────────
        try:
            history_row = {
                "order_id": str(effective_order_id),
                "awb": awb,
                "status": status,
                "description": description,
                "location": location,
                "timestamp": str(event_ts),
                "raw_payload": json.dumps(payload),
            }
            await baserow.create_row(TABLE_IDS["shipment_history"], history_row)
            logger.info(f"[Webhook] ShipmentHistory row saved for order={effective_order_id}")
        except Exception as hist_err:
            logger.error(f"[Webhook] ShipmentHistory save failed (non-fatal): {hist_err}")

        # ── 5. WhatsApp notification ──────────────────────────────────────────
        if status in _SILENT_STATUSES:
            logger.info(f"[Webhook] Status={status} — no WhatsApp sent")
            return

        try:
            user_info_raw = order_row.get("user_info", "{}")
            user_info: Dict[str, Any] = (
                json.loads(user_info_raw)
                if isinstance(user_info_raw, str)
                else (user_info_raw or {})
            )
            phone: str = (
                user_info.get("phone") or
                user_info.get("whatsapp_phone") or ""
            )
            name: str = user_info.get("name", "Customer")
            delivery_raw = order_row.get("delivery") or "{}"
            try:
                delivery_data = (
                    json.loads(delivery_raw)
                    if isinstance(delivery_raw, str)
                    else (delivery_raw or {})
                )
            except Exception:
                delivery_data = {}
            tracking_url: str = (
                f"https://cremsonpublications.shipway.com/tracking/forward/{awb}/" if awb else (delivery_data.get("tracking_url") or "https://cremsonpublications.shipway.com/")
            )

            # Email status notification
            email: str = user_info.get("email") or ""
            if email and status in ("PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "RTO"):
                try:
                    from services.email import send_shipment_status_email
                    await send_shipment_status_email(
                        to_email=email,
                        customer_name=name,
                        order_id=str(effective_order_id),
                        status_key=status,
                        tracking_url=tracking_url,
                    )
                    logger.info(f"[Webhook] Email sent for status={status} to order={effective_order_id}")
                except Exception as mail_err:
                    logger.error(f"[Webhook] Email status notification failed: {mail_err}")

            if not phone:
                logger.warning(
                    f"[Webhook] No phone for order={effective_order_id} — skipping WhatsApp"
                )
                return

            sender = _WA_SENDERS.get(status)
            if sender:
                await sender(
                    phone=phone,
                    customer_name=name,
                    order_id=str(effective_order_id),
                    tracking_url=tracking_url,
                )
                logger.info(
                    f"[Webhook] WhatsApp sent for status={status} "
                    f"to order={effective_order_id}"
                )
            else:
                logger.info(
                    f"[Webhook] No WhatsApp template mapped for status={status}"
                )

        except Exception as wa_err:
            logger.error(f"[Webhook] WhatsApp error (non-fatal): {wa_err}")

    except Exception as exc:
        logger.error(f"[Webhook] Unhandled error in _process_webhook: {exc}", exc_info=True)


# ── Route ─────────────────────────────────────────────────────────────────────


@router.post("/shipway")
async def shipway_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Endpoint registered in Shipway dashboard as the webhook URL.
    Always returns HTTP 200 to prevent Shipway from retrying.
    Actual processing happens in a background task.
    """
    raw_body = b""
    try:
        raw_body = await request.body()
        logger.info(f"[Webhook] Shipway event received: {raw_body[:600].decode(errors='replace')}")

        # Attempt JSON parse; fall back to form-encoded
        try:
            payload = await request.json()
        except Exception:
            form = await request.form()
            payload = dict(form)

        background_tasks.add_task(_process_webhook, payload)
        return {"success": True}

    except Exception as exc:
        logger.error(
            f"[Webhook] Failed to parse Shipway payload: {exc} "
            f"| raw={raw_body[:200].decode(errors='replace')}"
        )
        # Return 200 anyway — prevents Shipway from flooding retries
        return {"success": False, "message": str(exc)}
