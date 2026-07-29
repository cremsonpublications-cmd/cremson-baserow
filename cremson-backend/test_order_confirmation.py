import asyncio
from services.whatsapp import send_order_confirmation

async def test():
    test_items = [
        {"name": "General English Book", "quantity": 2, "currentPrice": 350.0, "totalPrice": 700.0},
        {"name": "Tamil Grammar Guide", "quantity": 1, "currentPrice": 250.0, "totalPrice": 250.0}
    ]
    
    print("Sending mock order confirmation with detailed list...")
    await send_order_confirmation(
        phone="919205153617",
        customer_name="Arjunan Cahippa",
        order_id="BOOK2304",
        total_amount=950.0,
        item_count=3,
        items=test_items
    )

if __name__ == "__main__":
    asyncio.run(test())
