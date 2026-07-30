"""
WhatsApp Chatbot Service
Handles incoming messages, state transitions, Baserow / Shipway queries, and sends text replies via Meta API.
"""

import json
import logging
from typing import Dict, Any, List, Optional
import httpx

from config import (
    WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID,
    TABLE_IDS,
)
from services.baserow import BaserowClient
from utils.conversation_state import (
    get_conversation_state,
    set_conversation_state,
    clear_conversation_state,
)

logger = logging.getLogger(__name__)

_GRAPH_URL = f"https://graph.facebook.com/v25.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
_HEADERS = {
    "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
    "Content-Type": "application/json",
}

baserow_client = BaserowClient()


def _format_phone(phone: str) -> str:
    """Return phone in international format without +: 91XXXXXXXXXX"""
    phone = "".join(filter(str.isdigit, str(phone)))
    if len(phone) == 10:
        phone = "91" + phone
    return phone


async def send_text_message(phone: str, text: str) -> bool:
    """
    Send a direct text reply to user using Meta Graph API.
    """
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        logger.warning("[WhatsApp Chat] Missing credentials - skipping send_text_message")
        return False

    formatted = _format_phone(phone)
    if not formatted:
        logger.warning(f"[WhatsApp Chat] Invalid phone number '{phone}' - skipping")
        return False

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": formatted,
        "type": "text",
        "text": {"preview_url": False, "body": text},
    }

    logger.info(f"[WhatsApp Chat] Sending outgoing message to {formatted}")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(_GRAPH_URL, headers=_HEADERS, json=payload)
            if resp.status_code == 200:
                logger.info(f"[WhatsApp Chat] ✓ Reply sent successfully to {formatted}")
                return True
            else:
                logger.error(
                    f"[WhatsApp Chat] ✗ Failed HTTP {resp.status_code}: {resp.text}"
                )
                return False
    except Exception as exc:
        logger.error(f"[WhatsApp Chat] Error sending text message: {exc}")
        return False


def get_welcome_menu() -> str:
    return (
        "👋 Welcome to Cremson Publications.\n\n"
        "Please choose an option.\n\n"
        "1️⃣ Browse Books\n"
        "2️⃣ My Orders\n"
        "3️⃣ Track Order\n"
        "4️⃣ Contact Support\n\n"
        "Reply with the number."
    )


async def handle_incoming_message(from_phone: str, message_text: str) -> None:
    """
    Main entry point for processing incoming WhatsApp messages.
    """
    clean_text = (message_text or "").strip()
    logger.info(f"[WhatsApp Chat] Received message from {from_phone}: '{clean_text}'")

    current_session = get_conversation_state(from_phone)
    current_state = current_session.get("state", "MAIN_MENU")
    context = current_session.get("context", {})

    logger.info(f"[WhatsApp Chat] Current session state for {from_phone}: {current_state}")

    # Handle greetings or explicit restart commands anytime
    if clean_text.lower() in ["hi", "hello", "start", "menu", "help"]:
        set_conversation_state(from_phone, "MAIN_MENU")
        await send_text_message(from_phone, get_welcome_menu())
        return

    # Handle state-based processing
    if current_state == "WAITING_FOR_ORDER_ID":
        await _process_track_order_id_input(from_phone, clean_text)
        return
    elif current_state == "WAITING_FOR_ORDER_SELECTION":
        await _process_order_selection_input(from_phone, clean_text, context)
        return

    # Default MAIN_MENU processing (or matching numbers directly)
    if clean_text == "1":
        set_conversation_state(from_phone, "MAIN_MENU")
        reply = (
            "📚 Browse our latest books here.\n\n"
            "https://your-domain.com/books\n\n"
            "You can securely purchase books on our website.\n\n"
            "Need help?\n"
            "Reply anytime."
        )
        await send_text_message(from_phone, reply)

    elif clean_text == "2":
        await _handle_option_my_orders(from_phone)

    elif clean_text == "3":
        set_conversation_state(from_phone, "WAITING_FOR_ORDER_ID")
        reply = "Please enter your Order ID.\n\nExample\nCR10025"
        await send_text_message(from_phone, reply)

    elif clean_text == "4":
        set_conversation_state(from_phone, "MAIN_MENU")
        reply = (
            "Our support team will assist you shortly.\n\n"
            "Email:\ninfo@cremsonpublications.com\n\n"
            "Phone:\n+91 85859 37875"
        )
        await send_text_message(from_phone, reply)

    else:
        # Check if the user typed an order ID directly like BOOK5 or CR10025
        if clean_text.upper().startswith("BOOK") or clean_text.upper().startswith("CR"):
            await _process_track_order_id_input(from_phone, clean_text)
        else:
            await send_text_message(
                from_phone,
                f"Sorry, I didn't understand '{clean_text}'.\n\n" + get_welcome_menu()
            )


async def _handle_option_my_orders(from_phone: str) -> None:
    """Fetch user's latest orders from Baserow by matching phone number."""
    phone_digits = "".join(filter(str.isdigit, from_phone))
    last_10_digits = phone_digits[-10:] if len(phone_digits) >= 10 else phone_digits

    logger.info(f"[WhatsApp Chat] Fetching orders for phone last 10 digits: {last_10_digits}")

    try:
        # Search orders in Baserow table
        rows_data = await baserow_client.get_rows(
            TABLE_IDS["orders"],
            size=100,
            order_by="-order_date",
        )
        all_orders = rows_data.get("results", [])

        # Filter orders matching user phone in user_info or delivery
        matched_orders: List[Dict[str, Any]] = []
        for order in all_orders:
            u_info_raw = order.get("user_info") or "{}"
            deliv_raw = order.get("delivery") or "{}"

            u_info = json.loads(u_info_raw) if isinstance(u_info_raw, str) and u_info_raw.startswith("{") else (u_info_raw if isinstance(u_info_raw, dict) else {})
            deliv = json.loads(deliv_raw) if isinstance(deliv_raw, str) and deliv_raw.startswith("{") else (deliv_raw if isinstance(deliv_raw, dict) else {})

            order_phone = str(u_info.get("phone") or u_info.get("whatsapp_phone") or deliv.get("phone") or "")
            order_phone_digits = "".join(filter(str.isdigit, order_phone))

            if last_10_digits and last_10_digits in order_phone_digits:
                matched_orders.append(order)

        if not matched_orders:
            set_conversation_state(from_phone, "MAIN_MENU")
            await send_text_message(
                from_phone,
                "No orders found associated with your WhatsApp phone number.\n\n"
                "If you placed an order with a different phone number, please option 3 to Track Order using your Order ID."
            )
            return

        # Take top 5 recent orders
        recent_orders = matched_orders[:5]

        # Prepare context mapping index -> order details
        orders_map = {}
        lines = ["📚 Your Recent Orders\n"]

        for idx, ord_item in enumerate(recent_orders, 1):
            ord_id = ord_item.get("order_id") or f"BOOK{ord_item.get('id')}"
            status = ord_item.get("order_status") or "Processing"

            # Parse book name from items
            items_raw = ord_item.get("items") or "[]"
            items = json.loads(items_raw) if isinstance(items_raw, str) and items_raw.startswith("[") else (items_raw if isinstance(items_raw, list) else [])
            book_title = items[0].get("name") or items[0].get("title") if items else "Book"

            lines.append(f"{idx}️⃣ Order #{ord_id}\n\n{book_title}\n\nStatus:\n{status}\n")
            orders_map[str(idx)] = ord_id
            orders_map[ord_id.upper()] = ord_id

        lines.append("Reply with the number to view details.")

        set_conversation_state(
            from_phone,
            "WAITING_FOR_ORDER_SELECTION",
            context={"orders": orders_map, "order_list": [o.get("order_id") for o in recent_orders]}
        )
        await send_text_message(from_phone, "\n".join(lines))

    except Exception as exc:
        logger.error(f"[WhatsApp Chat] Error fetching orders from Baserow: {exc}", exc_info=True)
        set_conversation_state(from_phone, "MAIN_MENU")
        await send_text_message(
            from_phone,
            "Sorry, we encountered a temporary issue retrieving your orders. Please try again later."
        )


async def _process_order_selection_input(from_phone: str, user_input: str, context: Dict[str, Any]) -> None:
    """Process selection when customer picks an order from 'My Orders'."""
    orders_map = context.get("orders", {})
    selected_order_id = orders_map.get(user_input) or orders_map.get(user_input.upper())

    if not selected_order_id:
        # Check if they sent an order ID string directly
        if user_input.upper().startswith("BOOK") or user_input.upper().startswith("CR"):
            await _process_track_order_id_input(from_phone, user_input)
            return

        set_conversation_state(from_phone, "MAIN_MENU")
        await send_text_message(
            from_phone,
            f"Invalid selection. Returning to main menu.\n\n" + get_welcome_menu()
        )
        return

    await _send_order_details_response(from_phone, selected_order_id)


async def _process_track_order_id_input(from_phone: str, order_id_input: str) -> None:
    """Find and send details/tracking for a specific Order ID."""
    clean_id = order_id_input.strip().upper()
    await _send_order_details_response(from_phone, clean_id)


async def _send_order_details_response(from_phone: str, order_id: str) -> None:
    """Fetch single order by order_id from Baserow and render exact response structure."""
    try:
        rows = await baserow_client.get_rows(
            TABLE_IDS["orders"],
            filters={"order_id": order_id}
        )
        results = rows.get("results", [])

        if not results:
            # Try searching by uppercase/case-insensitive match or contains
            rows = await baserow_client.get_rows(
                TABLE_IDS["orders"],
                search=order_id
            )
            results = rows.get("results", [])

        if not results:
            set_conversation_state(from_phone, "MAIN_MENU")
            await send_text_message(
                from_phone,
                "Order not found.\nPlease check your Order ID."
            )
            return

        order = results[0]
        eff_order_id = order.get("order_id") or order_id
        status = order.get("order_status") or "Processing"

        # Parse items
        items_raw = order.get("items") or "[]"
        items = json.loads(items_raw) if isinstance(items_raw, str) and items_raw.startswith("[") else (items_raw if isinstance(items_raw, list) else [])
        book_title = items[0].get("name") or items[0].get("title") if items else "Book"
        if len(items) > 1:
            book_title += f" (+{len(items)-1} more)"

        # Parse order summary / amount
        order_summary_raw = order.get("order_summary") or "{}"
        summary = json.loads(order_summary_raw) if isinstance(order_summary_raw, str) and order_summary_raw.startswith("{") else (order_summary_raw if isinstance(order_summary_raw, dict) else {})
        grand_total = summary.get("grandTotal") or order.get("total_amount") or 0.0

        # Parse payment info
        payment_raw = order.get("payment") or "{}"
        payment = json.loads(payment_raw) if isinstance(payment_raw, str) and payment_raw.startswith("{") else (payment_raw if isinstance(payment_raw, dict) else {})
        payment_status = payment.get("status") or "Paid"

        # Parse delivery / AWB / courier / tracking
        deliv_raw = order.get("delivery") or "{}"
        deliv = json.loads(deliv_raw) if isinstance(deliv_raw, str) and deliv_raw.startswith("{") else (deliv_raw if isinstance(deliv_raw, dict) else {})

        awb = order.get("awb") or deliv.get("awb") or ""
        courier = order.get("courier") or deliv.get("courier") or "DTDC"
        tracking_url = order.get("tracking_url") or deliv.get("tracking_url") or ""

        if awb and not tracking_url:
            tracking_url = f"https://app-v1.shipway.com/tracking/forward/{awb}"

        lines = [
            "📦 Order Details\n",
            f"Order ID:\n{eff_order_id}\n",
            f"Book:\n{book_title}\n",
            f"Amount:\n₹{int(grand_total) if float(grand_total).is_integer() else grand_total}\n",
            f"Payment:\n{payment_status}\n",
            f"Courier:\n{courier or 'Pending'}\n",
            f"AWB:\n{awb or 'Pending'}\n",
            f"Status:\n{status}\n",
        ]

        if tracking_url:
            lines.append(f"Track Shipment\n{tracking_url}")

        set_conversation_state(from_phone, "MAIN_MENU")
        await send_text_message(from_phone, "\n".join(lines))

    except Exception as exc:
        logger.error(f"[WhatsApp Chat] Error rendering order details for {order_id}: {exc}", exc_info=True)
        set_conversation_state(from_phone, "MAIN_MENU")
        await send_text_message(
            from_phone,
            "Sorry, we encountered an error looking up that order. Please try again."
        )
