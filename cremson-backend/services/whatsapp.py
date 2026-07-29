import httpx
import os
from typing import Optional, List
from dotenv import load_dotenv
from config import WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_NAME, WHATSAPP_TEMPLATE_LANGUAGE

load_dotenv(override=True)

def _format_phone(phone: str) -> str:
    """Ensure phone is in international format without +: 91XXXXXXXXXX"""
    phone = "".join(filter(str.isdigit, phone))
    if len(phone) == 10:
        phone = "91" + phone
    return phone

async def send_order_confirmation(
    phone: str,
    customer_name: str,
    order_id: str,
    total_amount: float,
    item_count: int,
    items: Optional[List[dict]] = None,
):
    """
    Send an order confirmation WhatsApp message via Meta WhatsApp Business Cloud API.
    Uses the configured template (default: hello_world).
    """
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        print("[WhatsApp] WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — skipping notification")
        return

    formatted_phone = _format_phone(phone)
    if not formatted_phone:
        print("[WhatsApp] Invalid phone number — skipping notification")
        return

    url = f"https://graph.facebook.com/v25.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": formatted_phone,
        "type": "template",
        "template": {
            "name": WHATSAPP_TEMPLATE_NAME,
            "language": {
                "code": WHATSAPP_TEMPLATE_LANGUAGE
            }
        }
    }

    if WHATSAPP_TEMPLATE_NAME != "hello_world":
        if WHATSAPP_TEMPLATE_NAME in ["order_placed_detailed", "order_placed_details", "order_confirmation_details", "order_confirmation_v2", "order_confirmation_v3"]:
            formatted_items = ""
            if items:
                lines = []
                for item in items:
                    name = item.get("name") or item.get("title") or "Book"
                    qty = item.get("quantity") or item.get("qty") or 1
                    price = item.get("currentPrice") or item.get("price") or 0.0
                    total_price = item.get("totalPrice") or (price * qty)
                    lines.append(f"- {name} ({qty} x ₹{price:.2f}) = ₹{total_price:.2f}")
                formatted_items = "\n".join(lines)
            else:
                formatted_items = f"- {item_count} item(s)"

            payload["template"]["components"] = [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": customer_name},
                        {"type": "text", "text": order_id},
                        {"type": "text", "text": formatted_items},
                        {"type": "text", "text": f"₹{total_amount:.2f}"}
                    ]
                }
            ]
        else:
            payload["template"]["components"] = [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": customer_name},
                        {"type": "text", "text": order_id},
                        {"type": "text", "text": str(item_count)},
                        {"type": "text", "text": f"₹{total_amount:.2f}"}
                    ]
                }
            ]

    try:
        print(f"[WhatsApp] Sending payload to {url}: {payload}")
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                print(f"[WhatsApp] Notification sent successfully to {formatted_phone}")
            else:
                print(f"[WhatsApp] Failed: {response.status_code} — {response.text}")
    except Exception as e:
        print(f"[WhatsApp] Error sending notification: {e}")

async def send_order_status_update(
    phone: str,
    customer_name: str,
    order_id: str,
    new_status: str,
):
    """
    Send an order status update WhatsApp message via Meta WhatsApp Business Cloud API.
    """
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        print("[WhatsApp] WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — skipping notification")
        return

    formatted_phone = _format_phone(phone)
    if not formatted_phone:
        print("[WhatsApp] Invalid phone number — skipping notification")
        return

    url = f"https://graph.facebook.com/v25.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": formatted_phone,
        "type": "template",
        "template": {
            "name": WHATSAPP_TEMPLATE_NAME,
            "language": {
                "code": WHATSAPP_TEMPLATE_LANGUAGE
            }
        }
    }

    if WHATSAPP_TEMPLATE_NAME != "hello_world":
        payload["template"]["components"] = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": customer_name},
                    {"type": "text", "text": order_id},
                    {"type": "text", "text": new_status}
                ]
            }
        ]

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                print(f"[WhatsApp] Status update sent successfully to {formatted_phone}")
            else:
                print(f"[WhatsApp] Failed: {response.status_code} — {response.text}")
    except Exception as e:
        print(f"[WhatsApp] Error sending status update: {e}")

async def send_payment_success(
    phone: str,
    customer_name: str,
    order_id: str,
    amount: float,
    transaction_id: str,
):
    """
    Send a payment success WhatsApp message via Meta WhatsApp Business Cloud API.
    Template: payment_received_success
    """
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        print("[WhatsApp] WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — skipping notification")
        return

    formatted_phone = _format_phone(phone)
    if not formatted_phone:
        print("[WhatsApp] Invalid phone number — skipping notification")
        return

    url = f"https://graph.facebook.com/v25.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": formatted_phone,
        "type": "template",
        "template": {
            "name": "payment_received_v2",
            "language": {
                "code": WHATSAPP_TEMPLATE_LANGUAGE
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": customer_name},
                        {"type": "text", "text": f"₹{amount:.2f}"},
                        {"type": "text", "text": order_id},
                        {"type": "text", "text": transaction_id}
                    ]
                }
            ]
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                print(f"[WhatsApp] Payment success message sent to {formatted_phone}")
            else:
                print(f"[WhatsApp] Failed: {response.status_code} — {response.text}")
    except Exception as e:
        print(f"[WhatsApp] Error sending payment success message: {e}")

async def send_payment_failed(
    phone: str,
    customer_name: str,
    order_id: str,
    amount: float,
):
    """
    Send a payment failed WhatsApp message via Meta WhatsApp Business Cloud API.
    Template: payment_failed
    """
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        print("[WhatsApp] WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — skipping notification")
        return

    formatted_phone = _format_phone(phone)
    if not formatted_phone:
        print("[WhatsApp] Invalid phone number — skipping notification")
        return

    url = f"https://graph.facebook.com/v25.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": formatted_phone,
        "type": "template",
        "template": {
            "name": "payment_failed_v3",
            "language": {
                "code": WHATSAPP_TEMPLATE_LANGUAGE
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": customer_name},
                        {"type": "text", "text": f"₹{amount:.2f}"},
                        {"type": "text", "text": order_id}
                    ]
                }
            ]
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                print(f"[WhatsApp] Payment failed message sent to {formatted_phone}")
            else:
                print(f"[WhatsApp] Failed: {response.status_code} — {response.text}")
    except Exception as e:
        print(f"[WhatsApp] Error sending payment failed message: {e}")
