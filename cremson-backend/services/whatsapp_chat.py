"""
WhatsApp Chatbot Service
Handles incoming messages, multi-step state transitions, interactive list/button responses,
and full flow logic extracted from AiSensy HAR configuration.
"""

import json
import logging
import re
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
    """Send direct text reply to user using Meta Graph API."""
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

    logger.info(f"[WhatsApp Chat] Sending outgoing text message to {formatted}")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(_GRAPH_URL, headers=_HEADERS, json=payload)
            if resp.status_code == 200:
                logger.info(f"[WhatsApp Chat] ✓ Text message sent to {formatted}")
                return True
            else:
                logger.error(f"[WhatsApp Chat] ✗ Failed HTTP {resp.status_code}: {resp.text}")
                return False
    except Exception as exc:
        logger.error(f"[WhatsApp Chat] Error sending text message: {exc}")
        return False


async def send_interactive_list(phone: str, body_text: str, button_text: str, sections: List[Dict[str, Any]]) -> bool:
    """Send interactive list message using Meta Graph API."""
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        return False

    formatted = _format_phone(phone)
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": formatted,
        "type": "interactive",
        "interactive": {
            "type": "list",
            "body": {"text": body_text},
            "action": {
                "button": button_text,
                "sections": sections,
            },
        },
    }

    logger.info(f"[WhatsApp Chat] Sending interactive list to {formatted}")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(_GRAPH_URL, headers=_HEADERS, json=payload)
            return resp.status_code == 200
    except Exception as exc:
        logger.error(f"[WhatsApp Chat] Error sending list: {exc}")
        return False


async def send_interactive_buttons(phone: str, body_text: str, buttons: List[Dict[str, str]]) -> bool:
    """Send interactive reply buttons using Meta Graph API."""
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        return False

    formatted = _format_phone(phone)
    btn_payload = []
    for btn in buttons[:3]:  # Meta allows max 3 reply buttons
        btn_payload.append({
            "type": "reply",
            "reply": {
                "id": btn.get("id", btn.get("title")),
                "title": btn.get("title")[:20],
            }
        })

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": formatted,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body_text},
            "action": {"buttons": btn_payload},
        },
    }

    logger.info(f"[WhatsApp Chat] Sending interactive buttons to {formatted}")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(_GRAPH_URL, headers=_HEADERS, json=payload)
            return resp.status_code == 200
    except Exception as exc:
        logger.error(f"[WhatsApp Chat] Error sending buttons: {exc}")
        return False


# --- MESSAGES & MENUS ---

def get_welcome_menu() -> str:
    return (
        "👋 Welcome to Cremson Publications! 📚\n\n"
        "How can we assist you today?\n\n"
        "1️⃣ Teachers Section\n"
        "2️⃣ Buy Books\n"
        "3️⃣ Track Your Order\n"
        "4️⃣ Request Specimen Copy\n"
        "5️⃣ Bulk Order Inquiry\n"
        "6️⃣ Contact Support\n\n"
        "Reply with the number or option name."
    )


def get_fallback_menu() -> str:
    return (
        "Hi! 👋 Thank you for writing to Cremson Publications. 📚\n\n"
        "Here's how we can help you:\n\n"
        "📑 SPECIMEN — request a free specimen copy\n"
        "📦 RECEIVED — confirm delivery of your specimen books\n"
        "✅ ORDER — place a bulk order for Session\n"
        "💬 FEEDBACK — share your thoughts on the book\n"
        "⏰ LATER — if you need more time\n\n"
        "For urgent queries or a callback, please contact us directly:\n"
        "⏰ Mon–Sat, 10am–6pm\n"
        "Phone: +91 85859 37875\n\n"
        "Team Cremson Publications 🙏"
    )


def get_bulk_order_message() -> str:
    return (
        "That's wonderful news! 🎉\n"
        "Thank you for choosing Cremson Publications for this Session! 🙏\n\n"
        "Here's how you can place your bulk order:\n"
        "__________________________________\n\n"
        "🌐 OPTION 1 — Order on our Website\n"
        "https://cremsonpublications.com/shop\n"
        "__________________________________\n\n"
        "📋 OPTION 2 — Fill the Order Form\n"
        "https://cremsonpublications.com/bulk-order\n"
        "__________________________________\n\n"
        "💬 OPTION 3 — Order via WhatsApp\n"
        "Simply reply with:\n"
        "- 📖 Book name\n"
        "- 📊 Quantity required\n"
        "- 🏫 School name\n"
        "- 📍 Delivery address\n\n"
        "Our team will confirm your order within 24 working hours!\n"
        "__________________________________\n\n"
        "Looking forward to a long association! 😊\n\n"
        "Team Cremson Publications"
    )


# --- MAIN WORKFLOW HANDLER ---

async def handle_incoming_message(from_phone: str, message_text: str) -> None:
    """Main entry point for processing incoming WhatsApp messages against AiSensy flow rules."""
    clean_text = (message_text or "").strip()
    logger.info(f"[WhatsApp Chat] Received message from {from_phone}: '{clean_text}'")

    current_session = get_conversation_state(from_phone)
    current_state = current_session.get("state", "MAIN_MENU")
    context = current_session.get("context", {})

    logger.info(f"[WhatsApp Chat] Current session state for {from_phone}: {current_state}")

    # Global reset triggers
    if clean_text.lower() in ["hi", "hello", "start", "menu", "main", "main menu"]:
        set_conversation_state(from_phone, "MAIN_MENU")
        await send_text_message(from_phone, get_welcome_menu())
        return

    # Flow 3: Bulk Order Flow Regex / Keyword match
    bulk_pattern = r"(?i)(yes|order|bulk\s+order|interested|place\s+order|want\s+order|recommend|adopt|adoption|finalized|finalised)"
    if re.search(bulk_pattern, clean_text) and current_state not in ["TEACHER_REG_NAME", "TEACHER_REG_SCHOOL", "TEACHER_REG_SUBJECT"]:
        set_conversation_state(from_phone, "MAIN_MENU")
        await send_text_message(from_phone, get_bulk_order_message())
        return

    # Flow 2: Feedback Flow Match
    feedback_pattern = r"(?i)(feedback|review|thoughts|opinion|suggestion|experience|views|comment)"
    if re.search(feedback_pattern, clean_text) and current_state not in ["TEACHER_REG_NAME", "TEACHER_REG_SCHOOL", "TEACHER_REG_SUBJECT"]:
        set_conversation_state(from_phone, "MAIN_MENU")
        fb_msg = (
            "Thank you so much for taking the time! 💛\n\n"
            "We truly value your perspective as an educator.\n\n"
            "Please share your honest thoughts on the specimen book — what you liked, what could be better, "
            "and how suitable you found it for your students.\n\n"
            "Your feedback goes directly to our editorial team and helps us improve every edition. 📝\n\n"
            "Team Cremson Publications 🙏"
        )
        await send_text_message(from_phone, fb_msg)
        return

    # Flow 4: Received Confirmation Match
    received_pattern = r"(?i)(received|got\s+it|delivered|books\s+received|parcel\s+received|books\s+arrived|got\s+books|mila|mil\s+gaya|aa\s+gaya)"
    if re.search(received_pattern, clean_text) and current_state not in ["TEACHER_REG_NAME", "TEACHER_REG_SCHOOL", "TEACHER_REG_SUBJECT"]:
        set_conversation_state(from_phone, "MAIN_MENU")
        rec_msg = (
            "Thank you for confirming! 🎉\n\n"
            "We're thrilled your specimen copies have reached you safely. 📚\n\n"
            "Our team will soon share exclusive FREE study material for your students — stay tuned! 😊\n\n"
            "In the meantime, take your time going through the books. We'd love to hear your thoughts whenever you're ready.\n\n"
            "Just reply:\n"
            "💬 FEEDBACK — to share your experience\n"
            "✅ YES — when you're ready to place a bulk order\n"
            "⏰ LATER — if you need more time"
        )
        await send_text_message(from_phone, rec_msg)
        return

    # --- STATE MACHINE HANDLERS ---

    if current_state == "WAITING_FOR_ORDER_ID":
        await _process_track_order_id_input(from_phone, clean_text)
        return
    elif current_state == "WAITING_FOR_ORDER_SELECTION":
        await _process_order_selection_input(from_phone, clean_text, context)
        return

    # Multi-step Teacher Registration Flow
    elif current_state == "TEACHER_REG_NAME":
        context["name"] = clean_text
        set_conversation_state(from_phone, "TEACHER_REG_SCHOOL", context=context)
        await send_text_message(
            from_phone,
            "Got it! 👍\nNext, please type your School Name along with the City/Location (e.g., DPS, Rohini):"
        )
        return

    elif current_state == "TEACHER_REG_SCHOOL":
        context["school"] = clean_text
        set_conversation_state(from_phone, "TEACHER_REG_SUBJECT", context=context)
        await send_text_message(
            from_phone,
            "Perfect. Which Subject(s) and Classes (6-12) do you teach?\n(e.g., Business Studies & Economics, Class 11-12):"
        )
        return

    elif current_state == "TEACHER_REG_SUBJECT":
        context["subjects"] = clean_text
        set_conversation_state(from_phone, "TEACHER_REG_DOC", context=context)
        await send_text_message(
            from_phone,
            "To safeguard our teaching resources and answer keys, we only share access with verified educators. 🛡️\n\n"
            "Please send a photo or document of your School ID Card, Visiting Card, or School Letterhead:"
        )
        return

    elif current_state == "TEACHER_REG_DOC":
        set_conversation_state(from_phone, "MAIN_MENU")
        await send_text_message(
            from_phone,
            "Thank you! All your details and documents have been successfully submitted. 🎉\n\n"
            "Our team will review your profile and activate your verified teacher access within 24 hours.\n\n"
            "🏠 Type 'Main' at any time to return to the main menu."
        )
        return

    # --- MENU OPTION SELECTIONS ---

    if clean_text in ["1", "teachers section", "teacher"]:
        set_conversation_state(from_phone, "MAIN_MENU")
        msg = (
            "Great to have you here, Educator! 🎓\n"
            "We provide answer keys, lesson plans, and free specimen copies to verified teachers.\n\n"
            "Are you currently registered with Cremson Publications?\n\n"
            "Reply:\n"
            "A) Registered\n"
            "B) Unregistered / New Teacher"
        )
        await send_text_message(from_phone, msg)

    elif clean_text.lower() in ["a", "registered", "yes, registered!"]:
        await _handle_option_teacher_registered(from_phone)

    elif clean_text.lower() in ["b", "unregistered", "unregistered / new teacher", "no, not yet."]:
        set_conversation_state(from_phone, "TEACHER_REG_NAME", context={})
        await send_text_message(
            from_phone,
            "Awesome! Let's get your teacher verification started right here in the chat.\n\n"
            "First, please type and send your Full Name:"
        )

    elif clean_text in ["2", "buy books", "shop"]:
        set_conversation_state(from_phone, "MAIN_MENU")
        msg = (
            "📚 Cremson Books Store\n\n"
            "🌐 Browse & Order Online:\n"
            "https://cremsonpublications.com/shop\n\n"
            "📦 For Bulk Orders (10+ copies), reply 'Bulk' or visit:\n"
            "https://cremsonpublications.com/bulk-order"
        )
        await send_text_message(from_phone, msg)

    elif clean_text in ["3", "track your order", "track order", "track"]:
        await _handle_option_my_orders(from_phone)

    elif clean_text in ["4", "request specimen", "specimen"]:
        set_conversation_state(from_phone, "MAIN_MENU")
        msg = (
            "We provide free specimen copies to school teachers for evaluation purposes. 📚\n\n"
            "Are you currently registered with Cremson Publications?\n\n"
            "Reply:\n"
            "A) Registered\n"
            "B) Unregistered"
        )
        await send_text_message(from_phone, msg)

    elif clean_text in ["5", "bulk order", "bulk"]:
        set_conversation_state(from_phone, "MAIN_MENU")
        await send_text_message(from_phone, get_bulk_order_message())

    elif clean_text in ["6", "contact support", "support"]:
        set_conversation_state(from_phone, "MAIN_MENU")
        msg = (
            "📞 Cremson Support Team\n\n"
            "Email: info@cremsonpublications.com\n"
            "Phone: +91 85859 37875\n"
            "Hours: Mon–Sat, 10am–6pm"
        )
        await send_text_message(from_phone, msg)

    else:
        # Check direct Order ID / Specimen ID match
        clean_upper = clean_text.upper()
        if clean_upper.startswith("BOOK") or clean_upper.startswith("CR") or clean_upper.startswith("SPEC") or clean_upper.isdigit():
            await _process_track_order_id_input(from_phone, clean_text)
        else:
            await send_text_message(from_phone, get_fallback_menu())


# --- BASEROW LOOKUP HELPERS ---

async def _handle_option_teacher_registered(from_phone: str) -> None:
    """Check if sender's phone number exists in Table 877 (Teachers) and verify account status."""
    phone_digits = "".join(filter(str.isdigit, from_phone))
    last_10_digits = phone_digits[-10:] if len(phone_digits) >= 10 else phone_digits

    try:
        t_res = await baserow_client.get_rows(TABLE_IDS["teacher"], search=last_10_digits)
        teachers = t_res.get("results", [])

        matched_teacher = None
        for t in teachers:
            wp_phone = str(t.get("Whatsapp Phone") or t.get("Alternate Number") or "")
            wp_digits = "".join(filter(str.isdigit, wp_phone))
            if last_10_digits and last_10_digits in wp_digits:
                matched_teacher = t
                break

        if not matched_teacher and teachers:
            matched_teacher = teachers[0]

        set_conversation_state(from_phone, "MAIN_MENU")

        if not matched_teacher:
            # Case 1: Account Not Found
            msg = (
                f"We couldn't find a registered teacher account linked to your WhatsApp phone number (+91 {last_10_digits}). ⚠️\n\n"
                "Would you like to register now as a new teacher?\n\n"
                "Reply:\n"
                "B) Register as New Teacher\n\n"
                "Or request specimen copies directly on our website:\n"
                "https://cremsonpublications.com/specimen-request"
            )
            await send_text_message(from_phone, msg)
            return

        teacher_name = matched_teacher.get("Teacher Name") or "Educator"
        status_val = matched_teacher.get("Status")
        status_str = status_val.get("value") if isinstance(status_val, dict) else str(status_val or "").lower()

        if status_str and any(p in status_str for p in ["pending", "review", "unverified", "new"]):
            # Case 2: Registration Pending Verification
            msg = (
                f"Welcome back, {teacher_name}! 🎓\n\n"
                "Your teacher registration status is currently: ⏳ Pending Verification.\n\n"
                "Our team is reviewing your profile and credentials. You will receive full portal access once verified.\n\n"
                "📚 Request Free Specimen Copies:\n"
                "https://cremsonpublications.com/specimen-request\n\n"
                "Type 'Menu' anytime to go back."
            )
            await send_text_message(from_phone, msg)
        else:
            # Case 3: Verified / Active Teacher
            msg = (
                f"Welcome back, {teacher_name}! Your verified teacher portal is active. 🎉\n\n"
                "📥 Download Answer Keys, Lesson Plans & Question Banks:\n"
                "https://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link\n\n"
                "📚 Request Free Specimen Copies:\n"
                "https://cremsonpublications.com/specimen-request\n\n"
                "Type 'Menu' anytime to go back."
            )
            await send_text_message(from_phone, msg)

    except Exception as exc:
        logger.error(f"[WhatsApp Chat] Error checking teacher registration for {from_phone}: {exc}")
        set_conversation_state(from_phone, "MAIN_MENU")
        portal_msg = (
            "Welcome back! Your teacher portal is active. 🎉\n\n"
            "📥 Download Answer Keys, Lesson Plans & Question Banks:\n"
            "https://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link\n\n"
            "📚 Request Free Specimen Copies:\n"
            "https://cremsonpublications.com/specimen-request\n\n"
            "Type 'Menu' anytime to go back."
        )
        await send_text_message(from_phone, portal_msg)


async def _handle_option_my_orders(from_phone: str) -> None:
    """Fetch user's latest orders and specimen requests from Baserow by matching phone number."""
    phone_digits = "".join(filter(str.isdigit, from_phone))
    last_10_digits = phone_digits[-10:] if len(phone_digits) >= 10 else phone_digits

    matched_items: List[Dict[str, Any]] = []

    # 1. Search Orders (Table 762)
    try:
        rows_data = await baserow_client.get_rows(
            TABLE_IDS["orders"],
            size=100,
        )
        for order in rows_data.get("results", []):
            u_info_raw = order.get("user_info") or "{}"
            deliv_raw = order.get("delivery") or "{}"

            u_info = json.loads(u_info_raw) if isinstance(u_info_raw, str) and u_info_raw.startswith("{") else (u_info_raw if isinstance(u_info_raw, dict) else {})
            deliv = json.loads(deliv_raw) if isinstance(deliv_raw, str) and deliv_raw.startswith("{") else (deliv_raw if isinstance(deliv_raw, dict) else {})

            order_phone = str(u_info.get("phone") or u_info.get("whatsapp_phone") or deliv.get("phone") or "")
            order_phone_digits = "".join(filter(str.isdigit, order_phone))

            if last_10_digits and last_10_digits in order_phone_digits:
                items_raw = order.get("items") or "[]"
                items = json.loads(items_raw) if isinstance(items_raw, str) and items_raw.startswith("[") else (items_raw if isinstance(items_raw, list) else [])
                book_title = items[0].get("name") or items[0].get("title") if items else "Book Order"

                awb = order.get("awb") or deliv.get("awb") or ""
                tracking_url = order.get("tracking_url") or deliv.get("tracking_url") or ""
                if awb and not tracking_url:
                    tracking_url = f"https://app-v1.shipway.com/tracking/forward/{awb}"

                matched_items.append({
                    "type": "ORDER",
                    "id": order.get("order_id") or f"BOOK{order.get('id')}",
                    "title": book_title,
                    "status": order.get("order_status") or "Processing",
                    "awb": awb,
                    "tracking_url": tracking_url,
                    "courier": order.get("courier") or deliv.get("courier") or "DTDC",
                    "raw": order,
                })
    except Exception as exc:
        logger.error(f"[WhatsApp Chat] Error searching orders for {from_phone}: {exc}")

    # 2. Search Teachers (Table 877) -> Specimen Requests (Table 878)
    try:
        t_res = await baserow_client.get_rows(TABLE_IDS["teacher"], search=last_10_digits)
        matching_tids = [t["id"] for t in t_res.get("results", [])]

        s_res = await baserow_client.get_rows(TABLE_IDS["specimen_requests"], size=100)
        for spec in s_res.get("results", []):
            t_link = spec.get("TeacherID", [])
            linked_ids = [t["id"] for t in t_link if isinstance(t, dict)]
            
            p_val = spec.get("Phone", [])
            p_str = " ".join(str(p.get("value", "")) for p in p_val if isinstance(p, dict))
            p_digits = "".join(filter(str.isdigit, p_str))

            if any(tid in matching_tids for tid in linked_ids) or (last_10_digits and last_10_digits in p_digits):
                status_raw = spec.get("DeliveryStatus")
                status_str = status_raw.get("value") if isinstance(status_raw, dict) else str(status_raw or "Not dispatched")

                awb = spec.get("AWB_Number") or ""
                tracking_url = spec.get("TrackingLink") or ""
                if awb and not tracking_url:
                    tracking_url = f"https://app-v1.shipway.com/tracking/forward/{awb}"

                matched_items.append({
                    "type": "SPECIMEN",
                    "id": f"SPEC{spec.get('id')}",
                    "title": spec.get("BooksRequested") or "Specimen Copy",
                    "status": status_str,
                    "awb": awb,
                    "tracking_url": tracking_url,
                    "courier": "Shipway Express",
                    "raw": spec,
                })
    except Exception as exc:
        logger.error(f"[WhatsApp Chat] Error searching specimen requests for {from_phone}: {exc}")

    # 3. Handle matched results
    if not matched_items:
        set_conversation_state(from_phone, "WAITING_FOR_ORDER_ID")
        msg = (
            "Let's find your package! 📦\n\n"
            "We couldn't find any recent orders or specimen requests linked to your phone number.\n\n"
            "Please enter your Order ID or Specimen ID (e.g. CR10025 or SPEC386).\n\n"
            "Or track directly on our website:\n"
            "https://cremsonpublications.com/track-order"
        )
        await send_text_message(from_phone, msg)
        return

    # If EXACTLY 1 item found, send full tracking details directly!
    if len(matched_items) == 1:
        item = matched_items[0]
        set_conversation_state(from_phone, "MAIN_MENU")
        lines = [
            "📦 Package Tracking Details\n",
            f"Type: {'Specimen Copy (Free)' if item['type'] == 'SPECIMEN' else 'Book Order'}",
            f"ID: #{item['id']}",
            f"Book: {item['title']}",
            f"Status: {item['status']}",
        ]
        if item["awb"]:
            lines.append(f"AWB / Tracking No: {item['awb']}")
        if item["tracking_url"]:
            lines.append(f"\n🔗 Live Tracking Link:\n{item['tracking_url']}")

        lines.append("\nType 'Menu' anytime to go back.")
        await send_text_message(from_phone, "\n".join(lines))
        return

    # If MULTIPLE items found, send selection list!
    recent_items = matched_items[:5]
    items_map = {}
    lines = ["📚 We found the following packages for your number:\n"]

    for idx, item in enumerate(recent_items, 1):
        lines.append(f"{idx}️⃣ #{item['id']} ({'Specimen' if item['type'] == 'SPECIMEN' else 'Order'})\nBook: {item['title']}\nStatus: {item['status']}\n")
        items_map[str(idx)] = item
        items_map[item['id'].upper()] = item

    lines.append("Reply with the number (e.g. 1 or 2) to view tracking details.")
    set_conversation_state(
        from_phone,
        "WAITING_FOR_ORDER_SELECTION",
        context={"items_map": items_map}
    )
    await send_text_message(from_phone, "\n".join(lines))


async def _process_order_selection_input(from_phone: str, user_input: str, context: Dict[str, Any]) -> None:
    items_map = context.get("items_map", {})
    selected_item = items_map.get(user_input) or items_map.get(user_input.upper())

    if selected_item:
        set_conversation_state(from_phone, "MAIN_MENU")
        lines = [
            "📦 Package Tracking Details\n",
            f"Type: {'Specimen Copy (Free)' if selected_item['type'] == 'SPECIMEN' else 'Book Order'}",
            f"ID: #{selected_item['id']}",
            f"Book: {selected_item['title']}",
            f"Status: {selected_item['status']}",
        ]
        if selected_item["awb"]:
            lines.append(f"AWB / Tracking No: {selected_item['awb']}")
        if selected_item["tracking_url"]:
            lines.append(f"\n🔗 Live Tracking Link:\n{selected_item['tracking_url']}")

        lines.append("\nType 'Menu' to return to main menu.")
        await send_text_message(from_phone, "\n".join(lines))
        return

    # Fallback to direct Order ID lookup
    await _process_track_order_id_input(from_phone, user_input)


async def _process_track_order_id_input(from_phone: str, order_id_input: str) -> None:
    clean_id = order_id_input.strip().upper()
    await _send_order_details_response(from_phone, clean_id)


async def _send_order_details_response(from_phone: str, order_id: str) -> None:
    try:
        # Check Specimen Requests Table (Table 878) if order_id has SPEC or numeric
        clean_numeric = "".join(filter(str.isdigit, order_id))
        if clean_numeric:
            s_res = await baserow_client.get_rows(TABLE_IDS["specimen_requests"], size=100)
            for spec in s_res.get("results", []):
                if str(spec.get("id")) == clean_numeric or f"SPEC{spec.get('id')}" == order_id:
                    status_raw = spec.get("DeliveryStatus")
                    status_str = status_raw.get("value") if isinstance(status_raw, dict) else str(status_raw or "Not dispatched")
                    awb = spec.get("AWB_Number") or ""
                    tracking_url = spec.get("TrackingLink") or (f"https://app-v1.shipway.com/tracking/forward/{awb}" if awb else "")

                    lines = [
                        "📦 Specimen Tracking Details\n",
                        f"Specimen Request ID: #{spec.get('id')}",
                        f"Book: {spec.get('BooksRequested') or 'Specimen Copy'}",
                        f"Status: {status_str}",
                    ]
                    if awb:
                        lines.append(f"AWB Number: {awb}")
                    if tracking_url:
                        lines.append(f"\n🔗 Live Tracking Link:\n{tracking_url}")

                    lines.append("\nType 'Menu' to return to main menu.")
                    set_conversation_state(from_phone, "MAIN_MENU")
                    await send_text_message(from_phone, "\n".join(lines))
                    return

        # Check Orders Table (Table 762)
        rows = await baserow_client.get_rows(TABLE_IDS["orders"], filters={"order_id": order_id})
        results = rows.get("results", [])

        if not results:
            rows = await baserow_client.get_rows(TABLE_IDS["orders"], search=order_id)
            results = rows.get("results", [])

        if not results:
            set_conversation_state(from_phone, "MAIN_MENU")
            await send_text_message(from_phone, "Order or Specimen request not found.\nPlease check your ID and try again.")
            return

        order = results[0]
        eff_order_id = order.get("order_id") or order_id
        status = order.get("order_status") or "Processing"

        items_raw = order.get("items") or "[]"
        items = json.loads(items_raw) if isinstance(items_raw, str) and items_raw.startswith("[") else (items_raw if isinstance(items_raw, list) else [])
        book_title = items[0].get("name") or items[0].get("title") if items else "Book"

        order_summary_raw = order.get("order_summary") or "{}"
        summary = json.loads(order_summary_raw) if isinstance(order_summary_raw, str) and order_summary_raw.startswith("{") else (order_summary_raw if isinstance(order_summary_raw, dict) else {})
        grand_total = summary.get("grandTotal") or order.get("total_amount") or 0.0

        payment_raw = order.get("payment") or "{}"
        payment = json.loads(payment_raw) if isinstance(payment_raw, str) and payment_raw.startswith("{") else (payment_raw if isinstance(payment_raw, dict) else {})
        payment_status = payment.get("status") or "Paid"

        deliv_raw = order.get("delivery") or "{}"
        deliv = json.loads(deliv_raw) if isinstance(deliv_raw, str) and deliv_raw.startswith("{") else (deliv_raw if isinstance(deliv_raw, dict) else {})
        awb = order.get("awb") or deliv.get("awb") or ""
        courier = order.get("courier") or deliv.get("courier") or "DTDC"
        tracking_url = order.get("tracking_url") or deliv.get("tracking_url") or ""

        if awb and not tracking_url:
            tracking_url = f"https://app-v1.shipway.com/tracking/forward/{awb}"

        lines = [
            "📦 Order Details\n",
            f"Order ID: {eff_order_id}",
            f"Book: {book_title}",
            f"Amount: ₹{int(grand_total) if float(grand_total).is_integer() else grand_total}",
            f"Payment: {payment_status}",
            f"Courier: {courier or 'Pending'}",
            f"AWB: {awb or 'Pending'}",
            f"Status: {status}\n",
        ]
        if tracking_url:
            lines.append(f"Track Shipment:\n{tracking_url}")

        set_conversation_state(from_phone, "MAIN_MENU")
        await send_text_message(from_phone, "\n".join(lines))

    except Exception as exc:
        logger.error(f"[WhatsApp Chat] Error rendering order details: {exc}")
        set_conversation_state(from_phone, "MAIN_MENU")
        await send_text_message(from_phone, "Error retrieving order details. Please try again.")
