"""
WhatsApp Business Cloud API (Meta Graph API v25.0)
Sends order, payment and shipping status notifications to customers.
"""

import logging
from typing import List, Optional

import httpx

from config import (
    WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_TEMPLATE_LANGUAGE,
    WHATSAPP_TEMPLATE_NAME,
)

logger = logging.getLogger(__name__)

_GRAPH_URL = (
    f"https://graph.facebook.com/v25.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
)
_HEADERS = {
    "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
    "Content-Type": "application/json",
}


# ── Helpers ───────────────────────────────────────────────────────────────────


def _format_phone(phone: str) -> str:
    """Return phone in international format without +: 91XXXXXXXXXX"""
    phone = "".join(filter(str.isdigit, phone))
    if len(phone) == 10:
        phone = "91" + phone
    return phone


async def _send_template(
    phone: str,
    template_name: str,
    parameters: List[dict],
    log_tag: str = "",
) -> None:
    """
    Core sender: posts one template message to the Meta Graph API.
    All public send_* functions delegate here.
    """
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        logger.warning("[WhatsApp] Credentials not set — skipping")
        return

    formatted = _format_phone(phone)
    if not formatted:
        logger.warning(f"[WhatsApp] Invalid phone — skipping {log_tag}")
        return

    payload = {
        "messaging_product": "whatsapp",
        "to": formatted,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": WHATSAPP_TEMPLATE_LANGUAGE},
            "components": [{"type": "body", "parameters": parameters}],
        },
    }

    logger.info(f"[WhatsApp] → {log_tag} template={template_name} to={formatted}")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(_GRAPH_URL, headers=_HEADERS, json=payload)
            if resp.status_code == 200:
                logger.info(f"[WhatsApp] ✓ {log_tag} sent to {formatted}")
            else:
                logger.error(
                    f"[WhatsApp] ✗ {log_tag} HTTP {resp.status_code}: {resp.text}"
                )
    except Exception as exc:
        logger.error(f"[WhatsApp] Error sending {log_tag}: {exc}")


def _txt(value: str) -> dict:
    val = str(value).strip() if value is not None else ""
    if not val:
        val = "-"
    return {"type": "text", "text": val}


async def _send_text_message(phone: str, text: str, log_tag: str = "") -> None:
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        logger.warning(f"[WhatsApp] Credentials not set — skipping {log_tag}")
        return

    formatted = _format_phone(phone)
    if not formatted:
        logger.warning(f"[WhatsApp] Invalid phone — skipping {log_tag}")
        return

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": formatted,
        "type": "text",
        "text": {"preview_url": True, "body": text},
    }

    logger.info(f"[WhatsApp] → {log_tag} text to={formatted}")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(_GRAPH_URL, headers=_HEADERS, json=payload)
            if resp.status_code == 200:
                logger.info(f"[WhatsApp] ✓ {log_tag} sent to {formatted}")
            else:
                logger.error(f"[WhatsApp] ✗ {log_tag} HTTP {resp.status_code}: {resp.text}")
    except Exception as exc:
        logger.error(f"[WhatsApp] Error sending {log_tag}: {exc}")


async def send_teacher_signup_confirmation(phone: str, teacher_name: str):
    """Notification sent to teacher upon successful registration."""
    text_msg = (
        f"Hello {teacher_name},\n\n"
        "Thank you for registering as a teacher on Cremson Publications!\n\n"
        "We have successfully received your profile and ID card. Our team will verify your account within 24 hours.\n\n"
        "Best regards,\nCremson Publications Team"
    )
    await _send_text_message(phone, text_msg, log_tag=f"teacher_signup_confirm name={teacher_name}")


async def send_teacher_approved_notification(phone: str, teacher_name: str, signin_url: str = "http://localhost:3000/auth/signin"):
    """Notification sent to teacher upon admin approval."""
    text_msg = (
        f"Congratulations {teacher_name}! 🎉\n\n"
        "Your Teacher Account on Cremson Publications has been APPROVED by our administration.\n\n"
        "You can now sign in to request free specimen books and access teacher resources:\n"
        f"{signin_url}\n\n"
        "Thank you for choosing Cremson Publications!"
    )
    await _send_text_message(phone, text_msg, log_tag=f"teacher_approved name={teacher_name}")


async def send_teacher_rejected_notification(phone: str, teacher_name: str):
    """Notification sent to teacher upon admin rejection."""
    text_msg = (
        f"Hello {teacher_name},\n\n"
        "Thank you for your interest in Cremson Publications.\n\n"
        "Your teacher account registration request has been reviewed and was not approved at this time. "
        "If you believe this was an error or have questions, please contact support.\n\n"
        "Best regards,\nCremson Publications Team"
    )
    await _send_text_message(phone, text_msg, log_tag=f"teacher_rejected name={teacher_name}")


# ── Existing notifications (unchanged behaviour) ───────────────────────────────


async def send_order_confirmation(
    phone: str,
    customer_name: str,
    order_id: str,
    total_amount: float,
    transaction_id: str = "-",
    item_count: int = 1,
    items: Optional[List[dict]] = None,
):
    """Order placed & payment confirmed — single itemised template: order_confirmation_v6"""
    formatted_items = ""
    if items:
        lines = []
        for item in items:
            name = item.get("name") or item.get("title") or "Book"
            qty = item.get("quantity") or item.get("qty") or 1
            price = item.get("currentPrice") or item.get("price") or 0.0
            total_price = item.get("totalPrice") or (price * qty)
            lines.append(f"• {name} ({qty} x ₹{price:.2f}) = ₹{total_price:.2f}")
        formatted_items = "\n".join(lines)
    else:
        formatted_items = f"• {item_count} item(s)"

    template = (
        WHATSAPP_TEMPLATE_NAME
        if WHATSAPP_TEMPLATE_NAME != "hello_world"
        else "order_confirmation_v6"
    )

    await _send_template(
        phone,
        template,
        [
            _txt(customer_name),
            _txt(order_id),
            _txt(transaction_id),
            _txt(formatted_items),
            _txt(f"₹{total_amount:.2f}"),
        ],
        log_tag=f"order_confirmation order={order_id}",
    )


async def send_order_status_update(
    phone: str,
    customer_name: str,
    order_id: str,
    new_status: str,
):
    """Generic status update. Template: uses WHATSAPP_TEMPLATE_NAME"""
    await _send_template(
        phone,
        WHATSAPP_TEMPLATE_NAME,
        [_txt(customer_name), _txt(order_id), _txt(new_status)],
        log_tag=f"status_update order={order_id} status={new_status}",
    )


async def send_payment_success(
    phone: str,
    customer_name: str,
    order_id: str,
    amount: float,
    transaction_id: str,
):
    """Deprecated: Payment success is now sent via send_order_confirmation (order_confirmation_v6)"""
    await send_order_confirmation(
        phone=phone,
        customer_name=customer_name,
        order_id=order_id,
        total_amount=amount,
        transaction_id=transaction_id,
    )


async def send_payment_failed(
    phone: str,
    customer_name: str,
    order_id: str,
    amount: float,
):
    """Payment failed alert. Template: payment_failed_v6"""
    await _send_template(
        phone,
        "payment_failed_v6",
        [_txt(customer_name), _txt(f"₹{amount:.2f}"), _txt(order_id)],
        log_tag=f"payment_failed order={order_id}",
    )


# ── Shipway shipping notifications ────────────────────────────────────────────
# Each function maps to one WhatsApp template approved in Meta Business Manager.
# Template variable positions match the order shown in each docstring.


async def send_shipment_created(
    phone: str,
    customer_name: str,
    order_id: str,
    awb: str,
    courier_name: str,
    tracking_url: str,
):
    """
    Triggered right after Shipway creates the shipment (background task).
    Template: shipment_created_v1
    Body vars: {{1}}=name  {{2}}=order_id  {{3}}=awb  {{4}}=courier  {{5}}=tracking_url
    """
    await _send_template(
        phone,
        "shipment_created_v1",
        [
            _txt(customer_name),
            _txt(order_id),
            _txt(awb),
            _txt(courier_name),
            _txt(tracking_url),
        ],
        log_tag=f"shipment_created order={order_id} awb={awb}",
    )


async def send_pickup_requested(
    phone: str,
    customer_name: str,
    order_id: str,
    tracking_url: str,
):
    """
    DEPRECATED: Notification disabled per requirements.
    (pickup_requested_v2 template has been removed).
    """
    logger.info(f"[WhatsApp] send_pickup_requested skipped for order {order_id} (template removed).")
    return None


async def send_picked_up(
    phone: str,
    customer_name: str,
    order_id: str,
    tracking_url: str,
):
    """
    Triggered by PICKED_UP webhook event from Shipway.
    Template: picked_up_v1
    Body vars: {{1}}=name  {{2}}=order_id  {{3}}=tracking_url
    """
    await _send_template(
        phone,
        "picked_up_v1",
        [_txt(customer_name), _txt(order_id), _txt(tracking_url)],
        log_tag=f"picked_up order={order_id}",
    )


async def send_in_transit(
    phone: str,
    customer_name: str,
    order_id: str,
    tracking_url: str,
):
    """
    Triggered by IN_TRANSIT webhook event from Shipway.
    Template: in_transit_v1
    Body vars: {{1}}=name  {{2}}=order_id  {{3}}=tracking_url
    """
    await _send_template(
        phone,
        "in_transit_v1",
        [_txt(customer_name), _txt(order_id), _txt(tracking_url)],
        log_tag=f"in_transit order={order_id}",
    )


async def send_out_for_delivery(
    phone: str,
    customer_name: str,
    order_id: str,
    tracking_url: str,
):
    """
    Triggered by OUT_FOR_DELIVERY webhook event from Shipway.
    Template: out_for_delivery_v2
    Body vars: {{1}}=name  {{2}}=order_id  {{3}}=tracking_url
    """
    await _send_template(
        phone,
        "out_for_delivery_v2",
        [_txt(customer_name), _txt(order_id), _txt(tracking_url)],
        log_tag=f"out_for_delivery order={order_id}",
    )


async def send_delivered(
    phone: str,
    customer_name: str,
    order_id: str,
    tracking_url: str,
):
    """
    Triggered by DELIVERED webhook event from Shipway.
    Template: delivered_v2
    Body vars: {{1}}=name  {{2}}=order_id
    """
    await _send_template(
        phone,
        "delivered_v2",
        [_txt(customer_name), _txt(order_id)],
        log_tag=f"delivered order={order_id}",
    )


async def send_rto(
    phone: str,
    customer_name: str,
    order_id: str,
    tracking_url: str,
):
    """
    Triggered by RTO webhook event from Shipway.
    Template: rto_v2
    Body vars: {{1}}=name  {{2}}=order_id
    """
    await _send_template(
        phone,
        "rto_v2",
        [_txt(customer_name), _txt(order_id)],
        log_tag=f"rto order={order_id}",
    )
