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

    print("\nPurge completed successfully.")

if __name__ == "__main__":
    target_email = "arjunansri21@gmail.com"
    if len(sys.argv) > 1:
        target_email = sys.argv[1]
    asyncio.run(purge_user(target_email))
