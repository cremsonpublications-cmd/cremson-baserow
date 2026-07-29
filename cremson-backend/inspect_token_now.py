import httpx
import os
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

async def inspect():
    async with httpx.AsyncClient() as client:
        # Check /me
        print("Checking /me ...")
        resp = await client.get("https://graph.facebook.com/v25.0/me", headers=headers)
        print("Status /me:", resp.status_code)
        print("Response:", resp.text)
        
        if resp.status_code == 200:
            user_id = resp.json().get("id")
            url = f"https://graph.facebook.com/v25.0/{user_id}/assigned_whatsapp_business_accounts"
            print("Checking assigned WABAs for user:", user_id)
            resp_waba = await client.get(url, headers=headers)
            print("Status WABAs:", resp_waba.status_code)
            print("Response WABAs:", resp_waba.text)

import asyncio
asyncio.run(inspect())
