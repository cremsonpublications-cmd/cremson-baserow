import httpx
import os
import sys
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "264411460083166")

if not ACCESS_TOKEN:
    print("Error: WHATSAPP_ACCESS_TOKEN not set in .env")
    sys.exit(1)

async def run():
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    waba_id = "4347652488784055"
    print(f"Using WABA ID: {waba_id}")
    
    url_templates = f"https://graph.facebook.com/v25.0/{waba_id}/message_templates"
    async with httpx.AsyncClient(timeout=45.0) as client:
        

        template_payment_success = {
            "name": "payment_received_v2",
            "category": "UTILITY",
            "language": "en",
            "components": [
                {
                    "type": "BODY",
                    "text": (
                        "Hello {{1}},\n\n"
                        "Your payment of {{2}} for Order {{3}} was successful. \n"
                        "Transaction ID: {{4}}\n\n"
                        "We are now processing your order. Thank you!"
                    ),
                    "example": {
                        "body_text": [
                            ["Chetan Gupta", "₹299.00", "BOOK2303", "pay_test_123"]
                        ]
                    }
                }
            ]
        }

        template_payment_failed = {
            "name": "payment_failed_v3",
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
                            ["Chetan Gupta", "₹299.00", "BOOK2303"]
                        ]
                    }
                }
            ]
        }

        template_order_placed_detailed = {
            "name": "order_confirmation_v2",
            "category": "UTILITY",
            "language": "en",
            "components": [
                {
                    "type": "BODY",
                    "text": (
                        "Hello {{1}},\n\n"
                        "Great news! Your order *{{2}}* has been successfully placed.\n\n"
                        "📦 *Items Purchased:*\n{{3}}\n\n"
                        "💰 *Total Amount:* *{{4}}*\n\n"
                        "Thank you for shopping with Cremson Publications!"
                    ),
                    "example": {
                        "body_text": [
                            [
                                "Chetan Gupta",
                                "BOOK2303",
                                "- Indian History Vol 1 (1 x ₹400.00) = ₹400.00\n- General Knowledge (2 x ₹500.50) = ₹1001.00",
                                "₹1401.00"
                            ]
                        ]
                    }
                }
            ]
        }
        
        for template in [template_payment_success, template_payment_failed, template_order_placed_detailed]:
            print(f"Creating template '{template['name']}'...")
            t_resp = await client.post(url_templates, headers=headers, json=template)
            if t_resp.status_code in [200, 201]:
                print(f"Successfully created template: {template['name']}")
                print(t_resp.json())
            else:
                print(f"Failed to create template {template['name']}: {t_resp.status_code} - {t_resp.text}")

import asyncio
if __name__ == "__main__":
    asyncio.run(run())
