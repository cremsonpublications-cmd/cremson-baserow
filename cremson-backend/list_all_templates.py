import httpx
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
# We use the active WABA ID starting with 24
WABA_ID = "2467890800356408"

async def list_templates():
    if not ACCESS_TOKEN:
        print("Error: WHATSAPP_ACCESS_TOKEN not set in .env")
        return
        
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
    }
    url = f"https://graph.facebook.com/v25.0/{WABA_ID}/message_templates"
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            print(f"Total templates in WABA {WABA_ID}: {len(data)}")
            for t in data:
                print(f"- Name: {t.get('name')}, Status: {t.get('status')}, Category: {t.get('category')}, Language: {t.get('language')}")
                if "cremson" in t.get("name", "").lower():
                    import json
                    print(json.dumps(t, indent=2))
        else:
            print(f"Failed to fetch templates. Status: {resp.status_code}")
            print(resp.text)

if __name__ == "__main__":
    asyncio.run(list_templates())
