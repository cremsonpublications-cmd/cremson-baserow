"""
All user/auth data stored in Baserow — no SQLite.
"""
from datetime import datetime
from typing import Optional
from services.baserow import BaserowClient
from config import TABLE_IDS

_client = BaserowClient()

T_USERS    = TABLE_IDS["auth_users"]
T_OTPS     = TABLE_IDS["email_otps"]
T_ADDRS    = TABLE_IDS["user_addresses"]
T_CART     = TABLE_IDS["cart_items"]
T_WISH     = TABLE_IDS["wishlist_items"]


# ── helpers ───────────────────────────────────────────────────────────────────

def _row(r: dict) -> dict:
    """Return a plain dict from a Baserow row, keeping only useful keys."""
    return {k: v for k, v in r.items() if not k.startswith("_")}


def _cart_row(r: dict) -> dict:
    """Normalize a cart row — Baserow returns number fields as strings."""
    row = _row(r)
    return {
        **row,
        "product_id": int(row.get("product_id") or 0),
        "user_id": int(row.get("user_id") or 0),
        "quantity": int(row.get("quantity") or 0),
        "price": float(row.get("price") or 0),
        "original_price": float(row.get("original_price") or 0),
    }


# ── init (no-op — tables already exist in Baserow) ────────────────────────────

def init_db():
    pass


# ── User helpers ──────────────────────────────────────────────────────────────

async def create_user(email: str, name: str, password_hash: str, phone: str = "") -> dict:
    row = await _client.create_row(T_USERS, {
        "email": email.lower().strip(),
        "name": name.strip(),
        "phone": phone.strip(),
        "password_hash": password_hash,
        "is_verified": 0,
        "is_active": 1,
        "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    })
    return _row(row)


async def get_user_by_email(email: str) -> Optional[dict]:
    result = await _client.get_rows(T_USERS, filters={"email": email.lower().strip()})
    rows = result.get("results", [])
    return _row(rows[0]) if rows else None


async def get_user_by_id(user_id: int) -> Optional[dict]:
    try:
        row = await _client.get_row(T_USERS, user_id)
        return _row(row)
    except Exception:
        return None


async def mark_user_verified(email: str):
    user = await get_user_by_email(email)
    if user:
        await _client.update_row(T_USERS, user["id"], {"is_verified": 1})


# ── OTP helpers ───────────────────────────────────────────────────────────────

async def save_otp(email: str, otp: str, expires_at: str):
    # Invalidate existing OTPs for this email
    existing = await _client.get_rows(T_OTPS, filters={"email": email.lower().strip()})
    for row in existing.get("results", []):
        if not int(row.get("used") or 0):
            await _client.update_row(T_OTPS, row["id"], {"used": 1})

    await _client.create_row(T_OTPS, {
        "email": email.lower().strip(),
        "otp": otp,
        "expires_at": expires_at,
        "used": 0,
    })


async def get_valid_otp(email: str, otp: str) -> Optional[dict]:
    result = await _client.get_rows(T_OTPS, filters={"email": email.lower().strip(), "otp": otp})
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    for row in result.get("results", []):
        if not int(row.get("used") or 0) and row.get("expires_at", "") > now:
            return _row(row)
    return None


async def consume_otp(otp_id: int):
    await _client.update_row(T_OTPS, otp_id, {"used": 1})


# ── Address helpers ────────────────────────────────────────────────────────────

async def get_addresses(user_id: int) -> list:
    result = await _client.get_rows(T_ADDRS, filters={"user_id": user_id}, order_by="-is_default")
    return [_row(r) for r in result.get("results", [])]


async def get_address(address_id: int, user_id: int) -> Optional[dict]:
    try:
        row = await _client.get_row(T_ADDRS, address_id)
        if row.get("user_id") == user_id:
            return _row(row)
    except Exception:
        pass
    return None


async def create_address(user_id: int, data: dict) -> dict:
    existing = await get_addresses(user_id)
    is_default = 1 if not existing or data.get("is_default") else 0
    if is_default:
        for addr in existing:
            if int(addr.get("is_default") or 0):
                await _client.update_row(T_ADDRS, addr["id"], {"is_default": 0})

    row = await _client.create_row(T_ADDRS, {
        "user_id": user_id,
        "label": data.get("label", "Home"),
        "first_name": data["first_name"],
        "last_name": data["last_name"],
        "company": data.get("company", ""),
        "street_address": data["street_address"],
        "apartment": data.get("apartment", ""),
        "city": data["city"],
        "state": data["state"],
        "pin_code": data["pin_code"],
        "phone": data.get("phone", ""),
        "country": data.get("country", "India"),
        "is_default": is_default,
    })
    return _row(row)


async def update_address(address_id: int, user_id: int, data: dict) -> Optional[dict]:
    existing = await get_address(address_id, user_id)
    if not existing:
        return None

    is_default = data.get("is_default", int(existing.get("is_default") or 0))
    if is_default:
        all_addrs = await get_addresses(user_id)
        for addr in all_addrs:
            if addr["id"] != address_id and int(addr.get("is_default") or 0):
                await _client.update_row(T_ADDRS, addr["id"], {"is_default": 0})

    row = await _client.update_row(T_ADDRS, address_id, {
        "label": data.get("label", existing.get("label", "Home")),
        "first_name": data.get("first_name", existing["first_name"]),
        "last_name": data.get("last_name", existing["last_name"]),
        "company": data.get("company", existing.get("company", "")),
        "street_address": data.get("street_address", existing["street_address"]),
        "apartment": data.get("apartment", existing.get("apartment", "")),
        "city": data.get("city", existing["city"]),
        "state": data.get("state", existing["state"]),
        "pin_code": data.get("pin_code", existing["pin_code"]),
        "phone": data.get("phone", existing.get("phone", "")),
        "country": data.get("country", existing.get("country", "India")),
        "is_default": is_default,
    })
    return _row(row)


async def delete_address(address_id: int, user_id: int) -> bool:
    addr = await get_address(address_id, user_id)
    if not addr:
        return False
    was_default = int(addr.get("is_default") or 0)
    await _client.delete_row(T_ADDRS, address_id)
    if was_default:
        remaining = await get_addresses(user_id)
        if remaining:
            await _client.update_row(T_ADDRS, remaining[0]["id"], {"is_default": 1})
    return True


async def set_default_address(address_id: int, user_id: int) -> Optional[dict]:
    addr = await get_address(address_id, user_id)
    if not addr:
        return None
    all_addrs = await get_addresses(user_id)
    for a in all_addrs:
        if int(a.get("is_default") or 0) and a["id"] != address_id:
            await _client.update_row(T_ADDRS, a["id"], {"is_default": 0})
    row = await _client.update_row(T_ADDRS, address_id, {"is_default": 1})
    return _row(row)


# ── Cart helpers ───────────────────────────────────────────────────────────────

async def get_cart(user_id: int) -> list:
    result = await _client.get_rows(T_CART, filters={"user_id": user_id})
    return [_cart_row(r) for r in result.get("results", [])]


async def upsert_cart_item(user_id: int, product_id: int, quantity: int, snapshot: dict) -> dict:
    result = await _client.get_rows(T_CART, filters={"user_id": user_id, "product_id": product_id})
    rows = result.get("results", [])
    data = {
        "user_id": user_id,
        "product_id": product_id,
        "quantity": quantity,
        "title": snapshot.get("title") or "",
        "price": snapshot.get("price") or 0,
        "original_price": snapshot.get("original_price") or 0,
        "image": snapshot.get("image") or "",
        "author": snapshot.get("author") or "",
        "category": snapshot.get("category") or "",
    }
    if rows:
        row = await _client.update_row(T_CART, rows[0]["id"], data)
    else:
        row = await _client.create_row(T_CART, data)
    return _cart_row(row)


async def remove_cart_item(user_id: int, product_id: int) -> bool:
    result = await _client.get_rows(T_CART, filters={"user_id": user_id, "product_id": product_id})
    rows = result.get("results", [])
    if not rows:
        return False
    await _client.delete_row(T_CART, rows[0]["id"])
    return True


async def clear_cart(user_id: int):
    result = await _client.get_rows(T_CART, filters={"user_id": user_id}, size=200)
    for row in result.get("results", []):
        await _client.delete_row(T_CART, row["id"])


async def sync_cart(user_id: int, items: list) -> list:
    for item in items:
        product_id = item["product_id"]
        local_qty = item.get("quantity", 1)
        result = await _client.get_rows(T_CART, filters={"user_id": user_id, "product_id": product_id})
        rows = result.get("results", [])
        if rows:
            new_qty = int(rows[0].get("quantity") or 0) + local_qty
            await _client.update_row(T_CART, rows[0]["id"], {"quantity": new_qty})
        else:
            await _client.create_row(T_CART, {
                "user_id": user_id,
                "product_id": product_id,
                "quantity": local_qty,
                "title": item.get("title") or "",
                "price": item.get("price") or 0,
                "original_price": item.get("original_price") or 0,
                "image": item.get("image") or "",
                "author": item.get("author") or "",
                "category": item.get("category") or "",
            })
    return await get_cart(user_id)


# ── Wishlist helpers ───────────────────────────────────────────────────────────

async def get_wishlist(user_id: int) -> list:
    result = await _client.get_rows(T_WISH, filters={"user_id": user_id}, size=200)
    return [int(r["product_id"]) for r in result.get("results", [])]


async def add_wishlist_item(user_id: int, product_id: int):
    result = await _client.get_rows(T_WISH, filters={"user_id": user_id, "product_id": product_id})
    if not result.get("results"):
        await _client.create_row(T_WISH, {"user_id": user_id, "product_id": product_id})


async def remove_wishlist_item(user_id: int, product_id: int) -> bool:
    result = await _client.get_rows(T_WISH, filters={"user_id": user_id, "product_id": product_id})
    rows = result.get("results", [])
    if not rows:
        return False
    await _client.delete_row(T_WISH, rows[0]["id"])
    return True


async def clear_wishlist(user_id: int):
    result = await _client.get_rows(T_WISH, filters={"user_id": user_id}, size=200)
    for row in result.get("results", []):
        await _client.delete_row(T_WISH, row["id"])


async def sync_wishlist(user_id: int, product_ids: list) -> list:
    await clear_wishlist(user_id)
    for pid in product_ids:
        await _client.create_row(T_WISH, {"user_id": user_id, "product_id": pid})
    return await get_wishlist(user_id)
