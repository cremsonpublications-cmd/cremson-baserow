import httpx
import os
import sys
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

if not ACCESS_TOKEN or not PHONE_NUMBER_ID:
    print("Error: Access token or Phone Number ID not configured.")
    sys.exit(1)

pin = input("Enter your 6-digit WhatsApp 2-Step Verification PIN: ")
if not pin or len(pin) != 6 or not pin.isdigit():
    print("Invalid PIN. Must be a 6-digit number.")
    sys.exit(1)

url = f"https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/register"
headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}
payload = {
    "messaging_product": "whatsapp",
    "pin": pin
}

async def register():
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, json=payload)
        print("Status:", resp.status_code)
        try:
            print("Response:", resp.json())
        except Exception:
            print("Response text:", resp.text)

import asyncio
asyncio.run(register())
