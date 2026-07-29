import asyncio
from services.whatsapp import send_payment_success, send_payment_failed

async def main():
    test_phone = "919205153617" # Main/admin/registered number or target test number
    print("Testing send_payment_success...")
    await send_payment_success(
        phone=test_phone,
        customer_name="Test Customer",
        order_id="BOOKTEST123",
        amount=499.00,
        transaction_id="pay_test_txn_999"
    )
    
    print("\nTesting send_payment_failed...")
    await send_payment_failed(
        phone=test_phone,
        customer_name="Test Customer",
        order_id="BOOKTEST123",
        amount=499.00
    )

if __name__ == "__main__":
    asyncio.run(main())
