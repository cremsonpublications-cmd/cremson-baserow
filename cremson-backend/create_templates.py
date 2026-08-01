import httpx
import os
import sys
import asyncio
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
WABA_ID = "2467890800356408"

if not ACCESS_TOKEN:
    print("Error: WHATSAPP_ACCESS_TOKEN not set in .env")
    sys.exit(1)

templates = [
    {
        "name": "order_confirmation_v6",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "Great news! Your payment for Order *{{2}}* was successful and your order has been placed.\n"
                    "Transaction ID: {{3}}\n\n"
                    "📦 *Items Purchased:*\n{{4}}\n\n"
                    "💰 *Total Amount:* *{{5}}*\n\n"
                    "We are now processing your order. Thank you for shopping with Cremson Publications!"
                ),
                "example": {
                    "body_text": [
                        [
                            "Arjunan Cahippa",
                            "BOOK2311",
                            "pay_TJa291havfGQzB",
                            "• Physical Education Text Book XIIth (1 x ₹384.00) = ₹384.00",
                            "₹434.00"
                        ]
                    ]
                }
            }
        ]
    },
    {
        "name": "payment_failed_v6",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "We noticed that your payment of {{2}} for Order {{3}} failed or was cancelled. \n\n"
                    "Thank you!"
                ),
                "example": {
                    "body_text": [
                        ["Arjunan Cahippa", "₹950.00", "BOOK2304"]
                    ]
                }
            }
        ]
    },
    {
        "name": "shipment_created_v1",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "Your order {{2}} has been shipped! 🚀\n\n"
                    "📦 Courier: {{4}}\n"
                    "🔢 AWB Number: {{3}}\n"
                    "🔗 Track your shipment: {{5}}\n\n"
                    "Thank you for shopping with Cremson Publications!"
                ),
                "example": {
                    "body_text": [
                        ["Arjunan Cahippa", "BOOK2304", "AWB12345678", "BlueDart", "https://cremsonpublications.shipway.com/track"]
                    ]
                }
            }
        ]
    },
    {
        "name": "picked_up_v1",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "Your order {{2}} has been picked up by our courier partner and is on its way! 🚚\n\n"
                    "🔗 Track status: {{3}}\n\n"
                    "Thank you!"
                ),
                "example": {
                    "body_text": [
                        ["Arjunan Cahippa", "BOOK2304", "https://cremsonpublications.shipway.com/track"]
                    ]
                }
            }
        ]
    },
    {
        "name": "in_transit_v1",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "Your order {{2}} is currently in transit. 🚚\n\n"
                    "🔗 Track status: {{3}}\n\n"
                    "Thank you for your patience!"
                ),
                "example": {
                    "body_text": [
                        ["Arjunan Cahippa", "BOOK2304", "https://cremsonpublications.shipway.com/track"]
                    ]
                }
            }
        ]
    },
    {
        "name": "out_for_delivery_v2",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "Your order {{2}} is out for delivery and will reach you today! 🛵\n\n"
                    "🔗 Track status: {{3}}\n\n"
                    "Please make sure someone is available to receive it. Thank you!"
                ),
                "example": {
                    "body_text": [
                        ["Arjunan Cahippa", "BOOK2304", "https://cremsonpublications.shipway.com/track"]
                    ]
                }
            }
        ]
    },
    {
        "name": "delivered_v2",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "Your order {{2}} has been successfully delivered! 🎉\n\n"
                    "We hope you love your books. Thank you for choosing Cremson Publications!"
                ),
                "example": {
                    "body_text": [
                        ["Arjunan Cahippa", "BOOK2304"]
                    ]
                }
            }
        ]
    },
    {
        "name": "rto_v2",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "We noticed that your order {{2}} was undelivered and is being returned to origin (RTO). ⚠️\n\n"
                    "Please contact our support team to arrange re-delivery. Thank you!"
                ),
                "example": {
                    "body_text": [
                        ["Arjunan Cahippa", "BOOK2304"]
                    ]
                }
            }
        ]
    }
]

async def create_templates():
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    url = f"https://graph.facebook.com/v25.0/{WABA_ID}/message_templates"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for t in templates:
            print(f"Sending request to create template: {t['name']} ...")
            resp = await client.post(url, headers=headers, json=t)
            if resp.status_code in [200, 201]:
                print(f"✓ Created: {t['name']} (ID: {resp.json().get('id')})")
            else:
                try:
                    error_obj = resp.json().get("error", {})
                    err_msg = error_obj.get("message", "")
                    subcode = error_obj.get("error_subcode")
                    user_msg = error_obj.get("error_user_msg", "")
                    user_title = error_obj.get("error_user_title", "")
                except Exception:
                    error_obj = {}
                    err_msg = resp.text
                    subcode = None
                    user_msg = ""
                    user_title = ""
                
                if subcode == 2388024 or "already exists" in user_msg.lower() or "already exists" in user_title.lower() or "already exists" in err_msg.lower():
                    print(f"⚠ Skip (Already exists): {t['name']}")
                elif subcode == 2388023:
                    print(f"✗ Locked (Being deleted, wait 4 weeks or rename): {t['name']} - {user_msg}")
                else:
                    print(f"✗ Failed to create: {t['name']}. Status: {resp.status_code}, Error: {err_msg} (Subcode: {subcode}, Msg: {user_msg})")

if __name__ == "__main__":
    asyncio.run(create_templates())
