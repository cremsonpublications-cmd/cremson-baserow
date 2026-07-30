from dotenv import load_dotenv
import os

load_dotenv()

BASEROW_URL = os.getenv("BASEROW_URL", "http://200.141.5.200")
BASEROW_TOKEN = os.getenv("BASEROW_TOKEN", "HkWj6pCpBqAxEeFqyGDDQOqr92m3iauI")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "264411460083166")
WHATSAPP_TEMPLATE_NAME = os.getenv("WHATSAPP_TEMPLATE_NAME", "hello_world")
WHATSAPP_TEMPLATE_LANGUAGE = os.getenv("WHATSAPP_TEMPLATE_LANGUAGE", "en")
WHATSAPP_MAIN_PHONE = os.getenv("WHATSAPP_MAIN_PHONE", "919205153617")

# Shipway
SHIPWAY_USERNAME = os.getenv("SHIPWAY_USERNAME", "")
SHIPWAY_LICENSE_KEY = os.getenv("SHIPWAY_LICENSE_KEY", "")
SHIPWAY_BASE_URL = os.getenv("SHIPWAY_BASE_URL", "https://app.shipway.com")
SHIPWAY_WAREHOUSE_ID = os.getenv("SHIPWAY_WAREHOUSE_ID", "")
SHIPWAY_CARRIER_ID = int(os.getenv("SHIPWAY_CARRIER_ID", "0"))  # 0 = let Shipway auto-assign


TABLE_IDS = {
    "users": 761,
    "orders": 762,
    "products": 763,
    "categories": 764,
    "reviews": 765,
    "coupons": 766,
    "specimen_requests": 767,
    "shipping_settings": 768,
    "auth_users": 769,
    "email_otps": 770,
    "user_addresses": 771,
    "cart_items": 772,
    "wishlist_items": 773,
    # Create this table manually in Baserow, then update the ID here (or via .env)
    "shipment_history": int(os.getenv("TABLE_SHIPMENT_HISTORY", "774")),
}
