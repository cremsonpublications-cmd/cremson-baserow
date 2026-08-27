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
    order_ids_found = [r.get("order_id") for r in rows.get("results", [])]
    print(f"Total orders found in Baserow: {len(order_ids_found)}")
    print(f"Order IDs: {order_ids_found}")
    
    for r in rows.get("results", []):
        if r.get("order_id") == order_id:
            order_row = r
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
