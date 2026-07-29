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
}
