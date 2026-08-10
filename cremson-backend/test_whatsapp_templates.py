import os
import requests
from dotenv import load_dotenv

# Load env variables
load_dotenv()

ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

def check_templates():
    if not ACCESS_TOKEN or not PHONE_NUMBER_ID:
        print("Missing credentials in .env")
        return
        
    print("Querying /me endpoints...")
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    
    # Let's try to query /me/accounts and /me?fields=instagram_accounts,whatsapp_business_accounts
    try:
        # Try /me/accounts
        r = requests.get("https://graph.facebook.com/v25.0/me/accounts", headers=headers)
        print("me/accounts response:", r.json())
        
        # Try WABA direct search or listing businesses
        r_biz = requests.get("https://graph.facebook.com/v25.0/me/businesses", headers=headers)
        print("me/businesses response:", r_biz.json())
        
        # Try to query whatsapp_business_account field
        r_phone = requests.get(f"https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}?fields=whatsapp_business_account", headers=headers)
        print("Phone Node fields response:", r_phone.json())
        
    except Exception as e:
        print("Error during API request:")
        print(e)

if __name__ == "__main__":
    check_templates()
