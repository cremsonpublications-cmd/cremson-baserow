import asyncio
import sys
import json
sys.path.insert(0, "/opt/cremson-baserow/cremson-backend")

from dotenv import load_dotenv
load_dotenv("/opt/cremson-baserow/cremson-backend/.env", override=True)

from services.baserow import BaserowClient
from config import TABLE_IDS
from services.shipway import create_shipment

async def run():
    client = BaserowClient()
    order_id = "CP26002"
    
    print(f"Fetching order {order_id} from Baserow...")
    rows = await client.get_rows(TABLE_IDS["orders"], size=100)
    order_row = None
    # Sort by ID descending to get the newest orders first
    sorted_orders = sorted(rows.get("results", []), key=lambda x: x.get("id", 0), reverse=True)
    print("Newest 5 orders in Baserow:")
    for o in sorted_orders[:5]:
        print(f"ID: {o.get('id')} | order_id: {o.get('order_id')} | status: {o.get('order_status')} | date: {o.get('order_date')} | total: {o.get('total_amount')} | user_info: {o.get('user_info')[:120] if o.get('user_info') else None}")

    order_row = None
    for r in sorted_orders:
        row_str = str(r)
        if "CP26002" in row_str or "CP26003" in row_str:
            order_row = r
            order_id = r.get("order_id") or f"BOOK{r.get('id')}"
            print(f"\nFound matching order! ID: {r.get('id')}, order_id column: {order_id}")
            break
            
    if not order_row:
        print(f"Error: Order {order_id} not found in Baserow!")
        return

    print("Order details from Baserow:")
    print(json.dumps(order_row, indent=2))
    
    user_info_raw = order_row.get("user_info") or "{}"
    user_info = json.loads(user_info_raw) if isinstance(user_info_raw, str) else (user_info_raw or {})
    address_obj = user_info.get("address") if isinstance(user_info.get("address"), dict) else {}
    items_raw = order_row.get("items") or "[]"
    items = json.loads(items_raw) if isinstance(items_raw, str) else (items_raw or [])

    ship_payload = {
        "order_id": order_id,
        "order_date": (order_row.get("order_date") or "").split(" ")[0] or "2026-08-27",
        "total_amount": order_row.get("total_amount") or 0,
        "items": items,
        "customer_name": user_info.get("name") or "Customer",
        "customer_email": user_info.get("email") or "",
        "customer_phone": user_info.get("phone") or "",
        "address": address_obj.get("street") or (user_info.get("address") if isinstance(user_info.get("address"), str) else "") or "",
        "address2": address_obj.get("apartment") or "",
        "city": address_obj.get("city") or "",
        "state": address_obj.get("state") or "",
        "pincode": address_obj.get("pincode") or "",
    }

    print("\nPayload sent to Shipway:")
    print(json.dumps(ship_payload, indent=2))

    print("\nCalling create_shipment...")
    res = await create_shipment(ship_payload)
    print("\nResult:")
    print(json.dumps(res, indent=2))

asyncio.run(run())
