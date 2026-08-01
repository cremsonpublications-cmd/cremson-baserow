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
    "school": int(os.getenv("TABLE_SCHOOL", "876")),
    "teacher": int(os.getenv("TABLE_TEACHER", "877")),
    "specimen_requests": int(os.getenv("TABLE_SPECIMEN_REQUESTS", "878")),
    "books": int(os.getenv("TABLE_BOOKS", "879")),
    "subject": int(os.getenv("TABLE_SUBJECT", "880")),
    "users": int(os.getenv("TABLE_USERS", "761")),
    "orders": int(os.getenv("TABLE_ORDERS", "762")),
    "products": int(os.getenv("TABLE_PRODUCTS", "763")),
    "categories": int(os.getenv("TABLE_CATEGORIES", "764")),
    "reviews": int(os.getenv("TABLE_REVIEWS", "765")),
    "coupons": int(os.getenv("TABLE_COUPONS", "766")),
    "shipping_settings": int(os.getenv("TABLE_SHIPPING_SETTINGS", "768")),
    "auth_users": int(os.getenv("TABLE_AUTH_USERS", "769")),
    "email_otps": int(os.getenv("TABLE_EMAIL_OTPS", "770")),
    "user_addresses": int(os.getenv("TABLE_USER_ADDRESSES", "771")),
    "cart_items": int(os.getenv("TABLE_CART_ITEMS", "772")),
    "wishlist_items": int(os.getenv("TABLE_WISHLIST_ITEMS", "773")),
    "shipment_history": int(os.getenv("TABLE_SHIPMENT_HISTORY", "774")),
    "blogs": int(os.getenv("TABLE_BLOGS", "0")),
}
