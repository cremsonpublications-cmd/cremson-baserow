import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the current directory to sys.path so we can import services/config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import TABLE_IDS
from services.baserow import BaserowClient

async def purge_user(email: str):
    email = email.lower().strip()
    print(f"Purging user: {email}")
    client = BaserowClient()

    # 1. Search and delete from auth_users (Table 769)
    print("\n--- Checking auth_users ---")
    try:
        res = await client.get_rows(TABLE_IDS["auth_users"], filters={"email": email})
        users = res.get("results", [])
        if users:
            for u in users:
                uid = u["id"]
                print(f"Found user ID: {uid} in auth_users. Deleting...")
                await client.delete_row(TABLE_IDS["auth_users"], uid)
                print("Deleted user from auth_users.")
        else:
            print("No matching user found in auth_users.")
    except Exception as e:
        print(f"Error in auth_users: {e}")

    # 2. Search and delete from email_otps (Table 770)
    print("\n--- Checking email_otps ---")
    try:
        res = await client.get_rows(TABLE_IDS["email_otps"], filters={"email": email})
        otps = res.get("results", [])
        if otps:
            for o in otps:
                oid = o["id"]
                print(f"Found OTP ID: {oid} for {email}. Deleting...")
                await client.delete_row(TABLE_IDS["email_otps"], oid)
                print("Deleted OTP.")
        else:
            print("No matching OTPs found in email_otps.")
    except Exception as e:
        print(f"Error in email_otps: {e}")

    # 3. Search and delete from teacher (Table 877)
    print("\n--- Checking teacher CRM table ---")
    try:
        res = await client.get_rows(TABLE_IDS["teacher"], filters={"Email": email})
        teachers = res.get("results", [])
        if teachers:
            for t in teachers:
                tid = t["id"]
                print(f"Found teacher ID: {tid} with Email {email}. Deleting...")
                await client.delete_row(TABLE_IDS["teacher"], tid)
                print("Deleted teacher from CRM.")
        else:
            print("No matching teacher found in CRM.")
    except Exception as e:
        print(f"Error in teacher CRM: {e}")

    # 4. Search and delete from bulk_orders (Table 767)
    print("\n--- Checking bulk_orders ---")
    try:
        res = await client.get_rows(TABLE_IDS["bulk_orders"], size=200)
        for r in res.get("results", []):
            if str(r.get("email", "")).lower().strip() == email:
                print(f"Found bulk order ID: {r['id']} for {email}. Deleting...")
                await client.delete_row(TABLE_IDS["bulk_orders"], r["id"])
                print("Deleted bulk order.")
    except Exception as e:
        print(f"Error in bulk_orders: {e}")

    # 5. Search and delete from orders (Table 762)
    print("\n--- Checking orders ---")
    try:
        import json
        res = await client.get_rows(TABLE_IDS["orders"], size=200)
        for r in res.get("results", []):
            user_info_raw = r.get("user_info") or "{}"
            try:
                user_info = json.loads(user_info_raw) if isinstance(user_info_raw, str) else user_info_raw
            except Exception:
                user_info = {}
            if str(user_info.get("email", "")).lower().strip() == email:
                print(f"Found order ID: {r['id']} for {email}. Deleting...")
                await client.delete_row(TABLE_IDS["orders"], r["id"])
                print("Deleted order.")
    except Exception as e:
        print(f"Error in orders: {e}")

    # 6. Search and delete from specimen_requests (Table 878)
    print("\n--- Checking specimen_requests ---")
    try:
        res = await client.get_rows(TABLE_IDS["specimen_requests"], size=200)
        for r in res.get("results", []):
            if str(r.get("Email", "")).lower().strip() == email:
                print(f"Found specimen request ID: {r['id']} for {email}. Deleting...")
                await client.delete_row(TABLE_IDS["specimen_requests"], r["id"])
                print("Deleted specimen request.")
    except Exception as e:
        print(f"Error in specimen_requests: {e}")

    print("\nPurge completed successfully.")

if __name__ == "__main__":
    target_email = "arjunansri21@gmail.com"
    if len(sys.argv) > 1:
        target_email = sys.argv[1]
    asyncio.run(purge_user(target_email))
