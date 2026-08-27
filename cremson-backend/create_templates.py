"""
Cremson Publications — Meta WhatsApp Business Cloud API Additional Template Creation Script
WABA ID: 2467890800356408

Submits the 7 additional feature templates (Refunds, Invoices, Support Requests, Specimen Duplicate Checks, Reviews, Reorder Reminders)
directly to Meta Graph API v25.0.
"""

import asyncio
import os
import sys
import httpx
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
WABA_ID = os.getenv("WHATSAPP_WABA_ID", "2467890800356408").strip()

if not ACCESS_TOKEN:
    print("Error: WHATSAPP_ACCESS_TOKEN is not set in .env")
    sys.exit(1)

templates = [
    # 1. refund_initiated_v2
    {
        "name": "refund_initiated_v2",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "Your refund of {{2}} for Order {{3}} has been initiated successfully.\n\n"
                    "Refund Reference ID: {{4}}\n\n"
                    "It usually takes 3-5 business days for the amount to reflect in your original payment source.\n\n"
                    "Thank you for your patience!\n"
                    "Cremson Publications Team"
                ),
                "example": {
                    "body_text": [
                        ["Rahul Sharma", "₹450.00", "ORD-84019", "rfnd_Pz92kL10s"]
                    ]
                }
            }
        ]
    },
    # 2. refund_completed_v2
    {
        "name": "refund_completed_v2",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "Great news! Your refund of {{2}} for Order {{3}} has been successfully processed and credited to your original payment source.\n\n"
                    "Refund Reference ID: {{4}}\n\n"
                    "Thank you for choosing Cremson Publications!\n"
                    "Cremson Publications Team"
                ),
                "example": {
                    "body_text": [
                        ["Rahul Sharma", "₹450.00", "ORD-84019", "rfnd_Pz92kL10s"]
                    ]
                }
            }
        ]
    },
    # 3. invoice_available_v2
    {
        "name": "invoice_available_v2",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "Great news! Your tax invoice for Order {{2}} is now available for download.\n\n"
                    "View and download your official invoice PDF here: {{3}}\n\n"
                    "Thank you for choosing Cremson Publications!\n"
                    "Cremson Publications Team"
                ),
                "example": {
                    "body_text": [
                        ["Rahul Sharma", "ORD-84019", "https://cremsonpublications.com/uploads/invoices/ORD-84019_invoice.pdf"]
                    ]
                }
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Download Invoice",
                        "url": "https://cremsonpublications.com/uploads/invoices/{{1}}",
                        "example": ["ORD-84019_invoice.pdf"]
                    }
                ]
            }
        ]
    },
    # 4. support_request_v2
    {
        "name": "support_request_v2",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "We have received your support request regarding \"{{2}}\". Our team is reviewing your message (Ticket ID: {{3}}) and will get back to you shortly.\n\n"
                    "Thank you for contacting Cremson Publications!\n"
                    "Cremson Publications Team"
                ),
                "example": {
                    "body_text": [
                        ["Rahul Sharma", "General Inquiry", "TKT-840192"]
                    ]
                }
            }
        ]
    },
    # 5. specimen_already_submitted_v2
    {
        "name": "specimen_already_submitted_v2",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "We noticed you requested a specimen copy of \"{{2}}\". Our records show that a specimen copy for this book was already requested/processed on {{3}}.\n\n"
                    "Each book can only be requested once per teacher. If you need additional copies for your institution, please place a regular or bulk order.\n\n"
                    "Thank you for your understanding!\n"
                    "Cremson Publications Team"
                ),
                "example": {
                    "body_text": [
                        ["Rahul Sharma", "Mathematics Class 10", "2026-08-15"]
                    ]
                }
            }
        ]
    },
    # 6. review_request_v2
    {
        "name": "review_request_v2",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "We hope you are enjoying your recent order of \"{{2}}\" from Cremson Publications!\n\n"
                    "Could you please take a quick moment to share your feedback and rate your experience? Your review helps us continue delivering high-quality educational materials.\n\n"
                    "Leave your review here: {{3}}\n\n"
                    "Thank you for your support!\n"
                    "Cremson Publications Team"
                ),
                "example": {
                    "body_text": [
                        ["Rahul Sharma", "Mathematics Class 10", "https://cremsonpublications.com/shop/product/12?review=true"]
                    ]
                }
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Leave Review",
                        "url": "https://cremsonpublications.com/shop/product/{{1}}",
                        "example": ["12?review=true"]
                    }
                ]
            }
        ]
    },
    # 7. reorder_reminder_v2
    {
        "name": "reorder_reminder_v2",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "Thank you for choosing Cremson Publications! We hope your recent books (\"{{2}}\") have been very helpful for your studies/teaching.\n\n"
                    "Need extra copies or new academic books for your upcoming session, students, or institution? Explore our latest curriculum and place a reorder easily today.\n\n"
                    "Browse Catalog & Reorder: {{3}}\n\n"
                    "Thank you for your continued support!\n"
                    "Cremson Publications Team"
                ),
                "example": {
                    "body_text": [
                        ["Rahul Sharma", "Mathematics Class 10", "https://cremsonpublications.com/shop"]
                    ]
                }
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Reorder Now",
                        "url": "https://cremsonpublications.com/{{1}}",
                        "example": ["shop"]
                    }
                ]
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
    
    print(f"Submitting {len(templates)} additional feature templates to Meta Graph API (WABA ID: {WABA_ID})...\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for t in templates:
            print(f"Submitting template: {t['name']} ...")
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
                    print(f"⚠ Skip (Already exists in Meta): {t['name']}")
                elif subcode == 2388023:
                    print(f"✗ Locked by Meta: {t['name']} - {user_msg}")
                else:
                    print(f"✗ Failed to create: {t['name']}. Status: {resp.status_code}, Error: {err_msg} (Subcode: {subcode}, Msg: {user_msg})")

if __name__ == "__main__":
    asyncio.run(create_templates())
