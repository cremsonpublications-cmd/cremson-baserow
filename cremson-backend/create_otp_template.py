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

template_data = {
    "name": "cremson_otp",
    "category": "AUTHENTICATION",
    "language": "en",
    "components": [
        {
            "type": "BODY",
            "add_security_recommendation": True
        },
        {
            "type": "FOOTER",
            "code_expiration_minutes": 10
        },
        {
            "type": "BUTTONS",
            "buttons": [
                {
                    "type": "OTP",
                    "otp_type": "COPY_CODE",
                    "text": "Copy Code"
                }
            ]
        }
    ]
}

async def main():
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    url = f"https://graph.facebook.com/v25.0/{WABA_ID}/message_templates"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        print(f"Creating template: {template_data['name']} ...")
        resp = await client.post(url, headers=headers, json=template_data)
        print("Response status:", resp.status_code)
        print("Response JSON:", resp.json())

if __name__ == "__main__":
    asyncio.run(main())
