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

url = f"https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages"
headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

payload = {
    "messaging_product": "whatsapp",
    "to": "917200362436",
    "type": "template",
    "template": {
        "name": "orderupdate",
        "language": {
            "code": "en"
        },
        "components": [
            {
                "type": "body",
                "parameters": [
                    {
                        "type": "text",
                        "text": "Chetan Gupta"
                    },
                    {
                        "type": "text",
                        "text": "BOOK9999"
                    },
                    {
                        "type": "text",
                        "text": "1"
                    },
                    {
                        "type": "text",
                        "text": "₹350.00"
                    }
                ]
            }
        ]
    }
}

async def send():
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, json=payload)
        print("Status Code:", resp.status_code)
        print("Response JSON:", resp.json())

import asyncio
if __name__ == "__main__":
    asyncio.run(send())
