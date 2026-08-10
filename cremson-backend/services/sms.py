import logging
import httpx
from config import TWOFACTOR_API_KEY, TWOFACTOR_SENDER_ID, TWOFACTOR_OTP_TEMPLATE, TWOFACTOR_OTP_TEMPLATE_NAME

logger = logging.getLogger("uvicorn.error")

def format_phone_10_digit(phone: str) -> str:
    """Ensure phone is a clean 10-digit Indian mobile number."""
    if not phone:
        return ""
    # Remove all non-digits
    phone = "".join(filter(str.isdigit, phone))
    # If 12 digits starting with 91, strip the country code
    if len(phone) == 12 and phone.startswith("91"):
        phone = phone[2:]
    # If 11 digits starting with 0, strip the leading zero
    elif len(phone) == 11 and phone.startswith("0"):
        phone = phone[1:]
    return phone

async def send_sms_otp(phone: str, otp: str) -> bool:
    """
    Sends OTP to the user's mobile number via 2Factor Transactional SMS API.
    """
    if not TWOFACTOR_API_KEY:
        logger.warning("[2Factor SMS] TWOFACTOR_API_KEY not configured. Skipping SMS dispatch.")
        return False

    clean_phone = format_phone_10_digit(phone)
    if not clean_phone or len(clean_phone) != 10:
        logger.error(f"[2Factor SMS] Invalid phone number '{phone}' for OTP dispatch.")
        return False

    if TWOFACTOR_OTP_TEMPLATE_NAME:
        url = f"https://2factor.in/API/V1/{TWOFACTOR_API_KEY}/SMS/{clean_phone}/{otp}/{TWOFACTOR_OTP_TEMPLATE_NAME}"
    else:
        url = f"https://2factor.in/API/V1/{TWOFACTOR_API_KEY}/SMS/{clean_phone}/{otp}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            res_data = response.json()
            if response.status_code == 200 and res_data.get("Status") == "Success":
                logger.info(f"[2Factor SMS] OTP successfully sent to {clean_phone}.")
                return True
            else:
                logger.error(f"[2Factor SMS] Failed to send OTP. Status Code: {response.status_code}. Response: {res_data}")
                return False
    except Exception as e:
        logger.error(f"[2Factor SMS] Exception occurred during OTP dispatch: {e}")
        return False
