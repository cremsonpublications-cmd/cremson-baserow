import httpx
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
WABA_ID = "2467890800356408"

async def check():
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
    }
    url = f"https://graph.facebook.com/v25.0/{WABA_ID}/message_templates?limit=100"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            print("--- Template Statuses ---")
            for t in data:
                name = t.get("name")
                if "bulk_order" in name:
                    print(f"Name: {name} | Status: {t.get('status')} | Category: {t.get('category')}")
        else:
            print(f"Failed: {resp.text}")

if __name__ == "__main__":
    asyncio.run(check())
