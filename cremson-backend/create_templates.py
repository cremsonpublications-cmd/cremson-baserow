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
                    "We noticed that your payment of {{2}} for Order ID {{3}} was unsuccessful.\n\n"
                    "Don't worry! Your items are still saved in your cart. You can retry the payment by clicking the link below or visiting your cart.\n\n"
                    "If the amount was deducted from your account, please check with your bank or contact our support team with the payment reference.\n\n"
                    "Best regards,\nCremson Publications Team"
                ),
                "example": {
                    "body_text": [
                        ["Arjunan Cahippa", "₹950.00", "BOOK2304"]
                    ]
                }
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Retry Payment",
                        "url": "https://cremsonpublications.com/cart"
                    }
                ]
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
                    "Great news! Your order {{2}} has been packed and dispatched via {{4}}.\n\n"
                    "AWB Tracking Number: {{3}}\n"
                    "Track your parcel live: {{5}}\n\n"
                    "Thank you for shopping with Cremson Publications!"
                ),
                "example": {
                    "body_text": [
                        ["Arjunan Cahippa", "BOOK2304", "AWB12345678", "BlueDart", "https://cremsonpublications.shipway.com/tracking/forward/AWB12345678/"]
                    ]
                }
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Track your Order",
                        "url": "{{1}}"
                    }
                ]
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
                        ["Arjunan Cahippa", "BOOK2304", "https://cremsonpublications.shipway.com/tracking/forward/AWB12345678/"]
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
    },
    {
        "name": "track_package_list_v1",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "📚 We found the following packages for your number:\n\n"
                    "{{1}}\n\n"
                    "Reply with the number (e.g. 1 or 2) to view tracking details."
                ),
                "example": {
                    "body_text": [
                        [
                            "1️⃣ #SPEC380 (Specimen)\nBook: Lab Manual Physical Activity Trainer XII\nStatus: Dispatched\n\n2️⃣ #SPEC386 (Specimen)\nBook: Yoga Text Book 12th\nStatus: Dispatched"
                        ]
                    ]
                }
            }
        ]
    },
    {
        "name": "package_tracking_detail_v1",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "📦 Package Tracking Details\n\n"
                    "Type: {{1}}\n"
                    "ID: #{{2}}\n"
                    "Book: {{3}}\n"
                    "Status: {{4}}\n"
                    "AWB / Tracking No: {{5}}\n\n"
                    "🔗 Live Tracking Link:\n"
                    "{{6}}\n\n"
                    "Team Cremson Publications"
                ),
                "example": {
                    "body_text": [
                        [
                            "Specimen Copy (Free)",
                            "SPEC386",
                            "Yoga Text Book 12th",
                            "Dispatched",
                            "30234042583040",
                            "https://cremsonpublications.shipway.com/tracking/forward/30234042583040/"
                        ]
                    ]
                }
            }
        ]
    },
    {
        "name": "specimen_received_v1",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "Thank you for requesting specimen copies from Cremson Publications.\n\n"
                    "We have received your request for *{{2}}* book(s). Our team is reviewing it and will process it shortly.\n\n"
                    "Thank you!"
                ),
                "example": {
                    "body_text": [
                        ["Teacher Name", "2"]
                    ]
                }
            }
        ]
    },
    {
        "name": "specimen_rejected_v1",
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "BODY",
                "text": (
                    "Hello {{1}},\n\n"
                    "Thank you for contacting Cremson Publications.\n\n"
                    "Regarding your specimen copy request ({{2}}): Our team reviewed your request, but unfortunately, we are unable to approve or dispatch this specimen copy request at this time.\n\n"
                    "If you have any questions or need evaluation copies, please contact our support team.\n\n"
                    "Thank you,\n"
                    "Cremson Publications Team"
                ),
                "example": {
                    "body_text": [
                        ["Teacher Name", "Physical Education Class 12"]
                    ]
                }
            }
        ]
    },
    {
        "name": "refund_initiated_v1",
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
    {
        "name": "refund_completed_v1",
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
    {
        "name": "invoice_available_v1",
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
                        "url": "{{1}}"
                    }
                ]
            }
        ]
    },
    {
        "name": "support_request_v1",
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
    {
        "name": "specimen_already_submitted_v1",
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
    {
        "name": "review_request_v1",
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
                        "url": "{{1}}"
                    }
                ]
            }
        ]
    },
    {
        "name": "reorder_reminder_v1",
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
                        "url": "{{1}}"
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
