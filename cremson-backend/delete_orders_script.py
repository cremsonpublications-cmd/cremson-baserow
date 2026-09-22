import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.baserow import BaserowClient
from config import TABLE_IDS

TARGET_ORDER_IDS = [
    "WABOOK2407",
    "WABOOK2408",
    "WABOOK2409",
    "WABOOK2410",
    "WABOOK2411",
    "WABOOK2412",
    "WABOOK2413",
    "WABOOK2414",
]

async def delete_specified_orders():
    client = BaserowClient()
    table_id = TABLE_IDS["orders"]
    
    deleted_count = 0
    for target in TARGET_ORDER_IDS:
        print(f"Searching for {target}...")
        res = await client.get_rows(table_id, search=target, size=10)
        results = res.get("results", [])
        for row in results:
            row_id = row.get("id")
            order_id = str(row.get("order_id") or "")
            print(f"  Found row_id={row_id}, order_id={order_id}. Deleting...")
            try:
                await client.delete_row(table_id, row_id)
                print(f"  ✓ Deleted row {row_id} ({target})")
                deleted_count += 1
            except Exception as e:
                print(f"  ❌ Error deleting row {row_id}: {e}")
                
    print(f"\nDone! Deleted {deleted_count} orders.")

if __name__ == "__main__":
    asyncio.run(delete_specified_orders())
