import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.whatsapp import send_whatsapp_otp

load_dotenv()

async def test_send():
    phone_number = "7200362436"
    test_otp = "852369"
    print(f"Sending test WhatsApp OTP code ({test_otp}) to phone: {phone_number}...")
    try:
        await send_whatsapp_otp(phone_number, test_otp)
        print("Done!")
    except Exception as e:
        print("Error sending OTP:", e)

if __name__ == "__main__":
    asyncio.run(test_send())
