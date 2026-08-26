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

logger = logging.getLogger("uvicorn.error")

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
    if not phone:
        return ""
    # Remove all non-digits
    phone = "".join(filter(str.isdigit, phone))
    # Strip leading zero if it makes it 10 digits (e.g. 07200362436 -> 7200362436)
    if phone.startswith("0") and len(phone) == 11:
        phone = phone[1:]
    # If 10 digits, add Indian country code "91"
    if len(phone) == 10:
        phone = "91" + phone
    return phone


async def _send_template(
    phone: str,
    template_name: str,
    parameters: List[dict],
    log_tag: str = "",
    components: Optional[List[dict]] = None,
) -> bool:
    """
    Core sender: posts one template message to the Meta Graph API.
    All public send_* functions delegate here. Returns True if successfully sent.
    """
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        logger.warning("[WhatsApp] Credentials not set — skipping")
        return False

    formatted = _format_phone(phone)
    if not formatted:
        logger.warning(f"[WhatsApp] Invalid phone — skipping {log_tag}")
        return False

    if components is None:
        components = [{"type": "body", "parameters": parameters}]

    payload = {
        "messaging_product": "whatsapp",
        "to": formatted,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": WHATSAPP_TEMPLATE_LANGUAGE},
            "components": components,
        },
    }

    logger.info(f"[WhatsApp] → {log_tag} template={template_name} to={formatted}")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(_GRAPH_URL, headers=_HEADERS, json=payload)
            if resp.status_code == 200:
                logger.info(f"[WhatsApp] ✓ {log_tag} sent to {formatted}")
                return True
            else:
                logger.error(
                    f"[WhatsApp] ✗ {log_tag} HTTP {resp.status_code}: {resp.text}"
                )
                return False
    except Exception as exc:
        logger.error(f"[WhatsApp] Error sending {log_tag}: {exc}")
        return False


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
    """Notification sent to teacher upon successful registration. (Disabled)"""
    return None


async def send_teacher_approved_notification(phone: str, teacher_name: str, signin_url: str = "https://cremsonpublications.com/auth/signin"):
    """Notification sent to teacher upon admin approval. (Disabled)"""
    return None


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
    retry_url: Optional[str] = None,
):
    """
    Payment failed alert. Template: payment_failed_v6
    Body vars: {{1}}=customer_name, {{2}}=amount, {{3}}=order_id
    Button 0 (Retry Payment): retry_url (default: https://cremsonpublications.com/cart)
    """
    if not retry_url:
        retry_url = "https://cremsonpublications.com/cart"

    components = [
        {
            "type": "body",
            "parameters": [
                _txt(customer_name),
                _txt(f"₹{amount:.2f}"),
                _txt(order_id),
            ],
        },
        {
            "type": "button",
            "sub_type": "url",
            "index": "0",
            "parameters": [_txt(retry_url)],
        },
    ]

    await _send_template(
        phone=phone,
        template_name="payment_failed_v6",
        parameters=[],
        log_tag=f"payment_failed order={order_id}",
        components=components,
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
    Button 0 (Track your Order): tracking_url
    """
    components = [
        {
            "type": "body",
            "parameters": [
                _txt(customer_name),
                _txt(order_id),
                _txt(awb),
                _txt(courier_name),
                _txt(tracking_url),
            ],
        },
        {
            "type": "button",
            "sub_type": "url",
            "index": "0",
            "parameters": [_txt(tracking_url)],
        },
    ]

    await _send_template(
        phone=phone,
        template_name="shipment_created_v1",
        parameters=[],
        log_tag=f"shipment_created order={order_id} awb={awb}",
        components=components,
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


# ── Bulk Order Notifications ──────────────────────────────────────────────────


async def send_bulk_order_received(phone: str, name: str, school: str, order_link: str):
    """Sent to teacher upon bulk order submission. Template: bulk_order_requested_v1."""
    params = [
        _txt(name),
        _txt(school),
        _txt(order_link),
    ]
    await _send_template(
        phone=phone,
        template_name="bulk_order_requested_v1",
        parameters=params,
        log_tag=f"bulk_order_received name={name}",
    )


async def send_bulk_order_admin_notify(admin_phone: str, name: str, school: str, total: float, order_link: str):
    """Sent to admin upon new bulk order submission."""
    msg = (
        f"🔔 *NEW BULK ORDER RECEIVED*\n\n"
        f"• Teacher: {name}\n"
        f"• School: {school}\n"
        f"• Total Pre-Discount: ₹{total:,.2f}\n\n"
        f"Review & approve discount here:\n{order_link}"
    )
    await _send_text_message(admin_phone, msg, log_tag=f"bulk_order_admin_notify school={school}")


async def send_bulk_order_approved(
    phone: str,
    name: str,
    subtotal: float,
    discount_type: str,
    discount_value: float,
    final_amount: float,
    order_link: str,
    school: str = "School"
):
    """Sent to teacher upon admin approval & discount application. Template: bulk_order_approved_v10 with Make Payment CTA button."""
    components = [
        {
            "type": "body",
            "parameters": [
                _txt(name),
                _txt(school),
                _txt(f"₹{final_amount:,.2f}"),
                _txt(order_link),
            ],
        },
        {
            "type": "button",
            "sub_type": "url",
            "index": "0",
            "parameters": [_txt(order_link)],
        },
    ]
    await _send_template(
        phone=phone,
        template_name="bulk_order_approved_v10",
        parameters=[],
        log_tag=f"bulk_order_approved name={name}",
        components=components,
    )


async def send_bulk_order_payment_received(phone: str, name: str, school: str, amount: float, order_link: str):
    """Sent to teacher when bulk order payment is fully received."""
    msg = (
        f"Payment Confirmed! ✅\n\n"
        f"Hello {name},\n"
        f"We have received the full payment of *₹{amount:,.2f}* for your bulk order for *{school}*.\n\n"
        f"📦 *Status:* Ready for Shipment\n"
        f"Our warehouse team is preparing your books for dispatch. You will receive tracking details via WhatsApp as soon as your shipment is dispatched!\n\n"
        f"👉 View order status:\n{order_link}\n\n"
        f"Thank you,\nCremson Publications Team"
    )
    await _send_text_message(phone, msg, log_tag=f"bulk_order_payment_received name={name}")


async def send_bulk_order_shipped(phone: str, name: str, school: str, awb: str, tracking_link: str, order_link: str = ""):
    """Sent to teacher when bulk order shipment is dispatched via Shipway. Template: bulk_order_shipped_v1 with Track Shipment CTA button."""
    components = [
        {
            "type": "body",
            "parameters": [
                _txt(name),
                _txt(school),
                _txt(awb),
                _txt(tracking_link),
            ],
        },
        {
            "type": "button",
            "sub_type": "url",
            "index": "0",
            "parameters": [_txt(tracking_link)],
        },
    ]
    await _send_template(
        phone=phone,
        template_name="bulk_order_shipped_v1",
        parameters=[],
        log_tag=f"bulk_order_shipped name={name}",
        components=components,
    )


async def send_whatsapp_otp(phone: str, otp: str):
    """Sends a 6-digit verification code via WhatsApp AUTHENTICATION template (cremson_otp).
    Requires both body + button components because the template has a COPY_CODE URL button.
    """
    import os
    template_name = os.getenv("WHATSAPP_OTP_TEMPLATE_NAME", "cremson_otp")

    components = [
        {
            "type": "body",
            "parameters": [_txt(otp)],
        },
        {
            "type": "button",
            "sub_type": "url",
            "index": "0",
            "parameters": [_txt(otp)],
        },
    ]

    await _send_template(
        phone=phone,
        template_name=template_name,
        parameters=[],
        log_tag=f"whatsapp_otp code={otp}",
        components=components,
    )


async def send_specimen_received_whatsapp(phone: str, name: str, book_count: str):
    """Sends a WhatsApp template notification to teacher when a specimen request is created."""
    await _send_template(
        phone=phone,
        template_name="specimen_received_v1",
        parameters=[_txt(name), _txt(book_count)],
        log_tag=f"specimen_received name={name} count={book_count}",
    )


async def send_specimen_rejected_whatsapp(phone: str, name: str, books_requested: str = ""):
    """Sends a WhatsApp template notification (specimen_rejected_v1) to teacher when a specimen request is rejected."""
    b_desc = books_requested if books_requested else "Requested Specimen Copy"
    await _send_template(
        phone=phone,
        template_name="specimen_rejected_v1",
        parameters=[_txt(name), _txt(b_desc)],
        log_tag=f"specimen_rejected name={name}",
    )


# ── Refund Notifications ──────────────────────────────────────────────────────


async def send_refund_initiated(
    phone: str,
    customer_name: str,
    order_id: str,
    amount: float,
    refund_id: str = "-",
):
    """
    Triggered when a refund is submitted to payment gateway.
    Template: refund_initiated_v1
    Body vars: {{1}}=customer_name, {{2}}=amount, {{3}}=order_id, {{4}}=refund_id
    """
    await _send_template(
        phone=phone,
        template_name="refund_initiated_v1",
        parameters=[
            _txt(customer_name),
            _txt(f"₹{amount:.2f}"),
            _txt(order_id),
            _txt(refund_id),
        ],
        log_tag=f"refund_initiated order={order_id} refund_id={refund_id}",
    )


async def send_refund_completed(
    phone: str,
    customer_name: str,
    order_id: str,
    amount: float,
    refund_id: str = "-",
):
    """
    Triggered when a refund is successfully processed by payment gateway/bank.
    Template: refund_completed_v1
    Body vars: {{1}}=customer_name, {{2}}=amount, {{3}}=order_id, {{4}}=refund_id
    """
    await _send_template(
        phone=phone,
        template_name="refund_completed_v1",
        parameters=[
            _txt(customer_name),
            _txt(f"₹{amount:.2f}"),
            _txt(order_id),
            _txt(refund_id),
        ],
        log_tag=f"refund_completed order={order_id} refund_id={refund_id}",
    )


# ── Tax Invoice Notification ──────────────────────────────────────────────────


async def send_invoice_available(
    phone: str,
    customer_name: str,
    order_id: str,
    invoice_url: str,
):
    """
    Triggered when tax invoice PDF becomes downloadable.
    Template: invoice_available_v1
    Body vars: {{1}}=customer_name, {{2}}=order_id, {{3}}=invoice_url
    Button 0 (Download Invoice): invoice_url
    """
    components = [
        {
            "type": "body",
            "parameters": [
                _txt(customer_name),
                _txt(order_id),
                _txt(invoice_url),
            ],
        },
        {
            "type": "button",
            "sub_type": "url",
            "index": "0",
            "parameters": [_txt(invoice_url)],
        },
    ]

    await _send_template(
        phone=phone,
        template_name="invoice_available_v1",
        parameters=[],
        log_tag=f"invoice_available order={order_id}",
        components=components,
    )


# ── Support Request Notification ──────────────────────────────────────────────


async def send_support_request(
    phone: str,
    customer_name: str,
    subject_or_type: str,
    ticket_id: str,
):
    """
    Triggered when customer submits a complaint or enquiry through Contact Us.
    Template: support_request_v1
    Body vars: {{1}}=customer_name, {{2}}=subject_or_type, {{3}}=ticket_id
    """
    await _send_template(
        phone=phone,
        template_name="support_request_v1",
        parameters=[
            _txt(customer_name),
            _txt(subject_or_type),
            _txt(ticket_id),
        ],
        log_tag=f"support_request ticket={ticket_id}",
    )


# ── Specimen Already Submitted Notification ───────────────────────────────────


async def send_specimen_already_submitted(
    phone: str,
    teacher_name: str,
    book_title: str,
    prev_date: str = "Previous Request",
):
    """
    Triggered when a teacher requests a specimen copy for a book they have ALREADY requested.
    Template: specimen_already_submitted_v1
    Body vars: {{1}}=teacher_name, {{2}}=book_title, {{3}}=prev_date
    """
    await _send_template(
        phone=phone,
        template_name="specimen_already_submitted_v1",
        parameters=[
            _txt(teacher_name),
            _txt(book_title),
            _txt(prev_date),
        ],
        log_tag=f"specimen_already_submitted book={book_title}",
    )


# ── Review / Feedback Request Notification ────────────────────────────────────


async def send_review_request(
    phone: str,
    customer_name: str,
    book_or_items_name: str,
    review_url: str,
):
    """
    Triggered 24 hours after order delivery to request feedback / book review.
    Template: review_request_v1
    Body vars: {{1}}=customer_name, {{2}}=book_or_items_name, {{3}}=review_url
    Button 0 (Leave Review): review_url
    """
    components = [
        {
            "type": "body",
            "parameters": [
                _txt(customer_name),
                _txt(book_or_items_name),
                _txt(review_url),
            ],
        },
        {
            "type": "button",
            "sub_type": "url",
            "index": "0",
            "parameters": [_txt(review_url)],
        },
    ]

    await _send_template(
        phone=phone,
        template_name="review_request_v1",
        parameters=[],
        log_tag=f"review_request product={book_or_items_name}",
        components=components,
    )


# ── Reorder Reminder Notification ─────────────────────────────────────────────


async def send_reorder_reminder(
    phone: str,
    customer_name: str,
    book_or_items_name: str,
    reorder_url: str = "https://cremsonpublications.com/shop",
):
    """
    Triggered 60 days after an order to remind customer/teacher to reorder.
    Template: reorder_reminder_v1
    Body vars: {{1}}=customer_name, {{2}}=book_or_items_name, {{3}}=reorder_url
    Button 0 (Reorder Now): reorder_url
    """
    components = [
        {
            "type": "body",
            "parameters": [
                _txt(customer_name),
                _txt(book_or_items_name),
                _txt(reorder_url),
            ],
        },
        {
            "type": "button",
            "sub_type": "url",
            "index": "0",
            "parameters": [_txt(reorder_url)],
        },
    ]

    await _send_template(
        phone=phone,
        template_name="reorder_reminder_v1",
        parameters=[],
        log_tag=f"reorder_reminder product={book_or_items_name}",
        components=components,
    )

