"""
Admin Order Service — WhatsApp-initiated order creation.

Authorized admin/staff members can create orders by sending a structured
WhatsApp message to the existing business number. This module handles:
  - Admin number authorization
  - Order message parsing & validation
  - Product lookup
  - Guest customer find-or-create
  - Order creation in Baserow (reuses Orders table 762)
  - Duplicate webhook prevention
"""

import json
import logging
import re
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from config import TABLE_IDS, WHATSAPP_ADMIN_NUMBERS
from db.auth import _row, normalize_phone, get_user_by_phone
from services.baserow import BaserowClient

logger = logging.getLogger(__name__)

_client = BaserowClient()

# ── Duplicate confirmation prevention ─────────────────────────────────────────
# Stores processed CONFIRM message wamid → timestamp.
# Prevents duplicate orders if Meta retries the same webhook event.
_PROCESSED_CONFIRM_IDS: Dict[str, float] = {}
_CONFIRM_ID_TTL = 86400  # 24 hours


def _clean_processed_confirm_ids() -> None:
    now = time.time()
    expired = [k for k, ts in list(_PROCESSED_CONFIRM_IDS.items()) if now - ts > _CONFIRM_ID_TTL]
    for k in expired:
        _PROCESSED_CONFIRM_IDS.pop(k, None)


def is_confirm_already_processed(wamid: str) -> bool:
    """Return True if this confirmation wamid was already handled (duplicate webhook)."""
    if not wamid:
        return False
    _clean_processed_confirm_ids()
    return wamid in _PROCESSED_CONFIRM_IDS


def mark_confirm_processed(wamid: str) -> None:
    """Mark a confirmation wamid as handled so retries are ignored."""
    if wamid:
        _PROCESSED_CONFIRM_IDS[wamid] = time.time()
        logger.info(f"[AdminOrder] Marked wamid={wamid} as processed")


# ── Admin authorization ────────────────────────────────────────────────────────

def get_admin_numbers() -> List[str]:
    """Return list of authorized admin phone numbers, normalized to 10 digits."""
    raw = WHATSAPP_ADMIN_NUMBERS or ""
    numbers: List[str] = []
    for n in raw.split(","):
        n = n.strip()
        if n:
            normalized = normalize_phone(n)
            if len(normalized) >= 10:
                numbers.append(normalized[-10:])
    return numbers


def is_admin_number(from_phone: str) -> bool:
    """
    Return True if the sender's phone is in the WHATSAPP_ADMIN_NUMBERS allowlist.
    Check is done server-side only — never rely on message content for auth.
    """
    admin_numbers = get_admin_numbers()
    if not admin_numbers:
        logger.warning("[AdminOrder] WHATSAPP_ADMIN_NUMBERS is empty — no admin number authorized")
        return False
    phone_digits = "".join(filter(str.isdigit, str(from_phone)))
    sender_last10 = phone_digits[-10:] if len(phone_digits) >= 10 else phone_digits
    result = sender_last10 in admin_numbers
    logger.info(f"[AdminOrder] Auth check for {sender_last10}: {'AUTHORIZED' if result else 'UNAUTHORIZED'}")
    return result


# ── Order message parser ───────────────────────────────────────────────────────

_VALID_PAYMENT_METHODS = {"cod", "cash", "cash on delivery", "online", "prepaid", "razorpay", "upi"}

_REQUIRED_FIELDS = {
    "customer_name": "Customer Name",
    "customer_phone": "Customer Phone",
    "product_name": "Product",
    "quantity": "Qty",
    "address": "Address",
    "payment_method": "Payment",
}


def _extract_field(lines: List[str], key_pattern: str) -> Optional[str]:
    for line in lines:
        m = re.match(rf"(?i){key_pattern}\s*:\s*(.+)", line.strip())
        if m:
            return m.group(1).strip()
    return None


def parse_admin_order(text: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Parse structured admin order message into a validated dict.
    Returns (order_data, None) on success, or (None, error_message) on failure.

    Expected format:
        ADMIN ORDER

        Customer Name: Santhosh
        Phone: 9876543210

        Product: 10th Science Book
        Qty: 2

        Address:
        12 Anna Street
        Chennai
        Tamil Nadu
        600001

        Payment: COD
    """
    lines = text.strip().splitlines()
    data: Dict[str, Any] = {}
    missing: List[str] = []

    # Customer Name
    customer_name = _extract_field(lines, r"customer\s*name")
    if customer_name:
        data["customer_name"] = customer_name

    # Phone
    raw_phone = _extract_field(lines, r"phone")
    if raw_phone:
        normalized = normalize_phone(raw_phone)
        if len(normalized) != 10:
            return None, (
                "❌ Invalid phone number.\n\n"
                f"'{raw_phone}' is not a valid 10-digit Indian mobile number.\n\n"
                "Please send the order again with a valid phone number."
            )
        data["customer_phone"] = normalized

    # Product
    product_name = _extract_field(lines, r"product")
    if product_name:
        data["product_name"] = product_name

    # Quantity
    qty_str = _extract_field(lines, r"qty|quantity")
    if qty_str:
        if not qty_str.isdigit() or int(qty_str) <= 0:
            return None, f"❌ Invalid quantity '{qty_str}'. Qty must be a positive whole number."
        data["quantity"] = int(qty_str)

    # Payment
    payment_str = _extract_field(lines, r"payment")
    if payment_str:
        method_lower = payment_str.lower().strip()
        if method_lower not in _VALID_PAYMENT_METHODS:
            return None, (
                f"❌ Invalid payment method '{payment_str}'.\n\n"
                "Supported: COD, Online\n\n"
                "Please send the order again."
            )
        if "cod" in method_lower or "cash" in method_lower:
            data["payment_method"] = "COD"
        else:
            data["payment_method"] = "Online"

    # Address — multi-line block after "Address:"
    addr_lines: List[str] = []
    in_addr = False
    for line in lines:
        stripped = line.strip()
        if re.match(r"(?i)address\s*:", stripped):
            in_addr = True
            # Anything on the same line after "Address:"
            after = re.sub(r"(?i)address\s*:", "", stripped).strip()
            if after:
                addr_lines.append(after)
            continue
        if in_addr:
            # Stop at next known field
            if re.match(r"(?i)(payment|product|qty|quantity|phone|customer)\s*:", stripped):
                break
            if stripped:
                addr_lines.append(stripped)

    if addr_lines:
        # Convention: last line = pincode (6 digits), second-last = state, third-last = city
        parts = list(addr_lines)
        pincode = state = city = ""
        if parts and re.match(r"^\d{6}$", parts[-1]):
            pincode = parts.pop()
        if parts:
            state = parts.pop()
        if parts:
            city = parts.pop()
        street = ", ".join(parts)
        data["address"] = {
            "street": street,
            "city": city,
            "state": state,
            "pincode": pincode,
        }

    # Validate required fields
    for key, label in _REQUIRED_FIELDS.items():
        if key not in data:
            missing.append(f"• {label}")

    # Validate address sub-fields
    if "address" in data:
        addr = data["address"]
        if not addr.get("city"):
            missing.append("• Address — City")
        if not addr.get("state"):
            missing.append("• Address — State")
        if not addr.get("pincode"):
            missing.append("• Address — Pincode (6 digits)")
    elif "address" not in data:
        pass  # Already captured as missing above

    if missing:
        return None, (
            "❌ Order cannot be created.\n\n"
            "Missing:\n" + "\n".join(missing) +
            "\n\nPlease send the order again in the required format."
        )

    return data, None


# ── Product lookup ─────────────────────────────────────────────────────────────

async def find_product(product_name: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Search for a product by name in the Products table.
    Returns (product_row, None) for exactly one match,
    or (None, error_message) for zero/multiple matches.
    Reuses the existing name field and filter conventions from products router.
    """
    try:
        res = await _client.get_rows(
            TABLE_IDS["products"],
            size=200,
            filters={
                "name": ("contains", product_name),
                "is_active": "true",
            },
        )
    except Exception as exc:
        logger.error(f"[AdminOrder] Product lookup error: {exc}")
        return None, "❌ Error looking up product. Please try again."

    results = res.get("results", [])

    # Filter by active status defensively
    active = [
        r for r in results
        if r.get("is_active") in (True, 1, "true", "True", "1")
    ]

    if not active:
        return None, (
            f"❌ Product not found: \"{product_name}\"\n\n"
            "Please check the product name and send the order again."
        )

    if len(active) == 1:
        return _map_product_for_order(active[0]), None

    # Multiple matches — ask admin to be more specific
    names = [r.get("name", f"Product #{r.get('id')}") for r in active[:6]]
    name_list = "\n".join(f"• {n}" for n in names)
    return None, (
        f"⚠️ Multiple products match \"{product_name}\":\n\n"
        f"{name_list}\n\n"
        "Please send the order again with a more specific product name."
    )


def _map_product_for_order(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract just what we need from a product row for order creation.
    Mirrors pricing logic from routers/products.py map_product_out.
    """
    mrp = float(row.get("mrp") or 0)
    discount_pct = float(row.get("own_discount_percentage") or 0)
    has_discount = bool(row.get("has_own_discount")) and discount_pct > 0
    price = round(mrp * (1.0 - discount_pct / 100.0)) if has_discount else mrp
    return {
        "id": row.get("id"),
        "name": row.get("name") or row.get("Name") or "",
        "mrp": mrp,
        "price": price,
        "stock_status": row.get("stock_status") or row.get("status") or "in_stock",
        "sku": row.get("sku") or "",
    }


# ── Guest customer find-or-create ─────────────────────────────────────────────

async def find_or_create_guest_customer(
    name: str,
    phone: str,
) -> Dict[str, Any]:
    """
    Find an existing user by phone, or create a GUEST customer record.

    A GUEST customer has:
      - Synthetic email  guest_<phone>@whatsapp.cremson
      - Empty password_hash  (cannot login until they complete signup)
      - is_verified = 0
      - Notes contains  created_via: WHATSAPP_ADMIN

    Returns the user dict (existing or newly created).
    """
    normalized = normalize_phone(phone)
    existing = await get_user_by_phone(normalized)

    if existing and existing.get("id"):
        logger.info(
            f"[AdminOrder] Found existing user id={existing['id']} "
            f"phone={normalized} verified={existing.get('is_verified')}"
        )
        return existing

    # Create GUEST record
    guest_email = f"guest_{normalized}@whatsapp.cremson"
    notes = "role: customer; is_approved: 1; created_via: WHATSAPP_ADMIN"

    payload = {
        "email": guest_email,
        "name": name.strip(),
        "phone": normalized,
        "password_hash": "",
        "is_verified": 0,
        "is_active": 1,
        "Notes": notes,
        "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    }

    try:
        row = await _client.create_row(TABLE_IDS["auth_users"], payload)
        result = _row(row)
        logger.info(
            f"[AdminOrder] Created GUEST user id={result.get('id')} "
            f"name={name} phone={normalized}"
        )
        return result
    except Exception as exc:
        logger.error(f"[AdminOrder] Failed to create guest user: {exc}")
        # Return a minimal dict so the order can still be created without a user record
        return {"id": None, "name": name, "phone": normalized, "email": ""}


# ── Order creation ─────────────────────────────────────────────────────────────

async def create_whatsapp_admin_order(
    parsed_order: Dict[str, Any],
    product: Dict[str, Any],
    customer: Dict[str, Any],
    admin_phone: str,
) -> Dict[str, Any]:
    """
    Create an order in Baserow Orders table (762).
    Reuses the same JSON field structure as website orders so it appears
    seamlessly in the existing admin orders page.
    Returns the created order dict with order_id assigned.
    """
    name = parsed_order["customer_name"]
    phone = parsed_order["customer_phone"]
    qty = int(parsed_order["quantity"])
    payment_method = parsed_order["payment_method"]
    addr = parsed_order["address"]

    unit_price = float(product.get("price") or product.get("mrp") or 0)
    total = round(unit_price * qty, 2)
    product_name = product.get("name") or ""
    admin_phone_clean = normalize_phone(admin_phone)

    user_info = {
        "name": name,
        "email": customer.get("email", ""),
        "phone": phone,
        "user_id": customer.get("id"),
        "address": {
            "street": addr.get("street", ""),
            "apartment": "",
            "city": addr.get("city", ""),
            "state": addr.get("state", ""),
            "pincode": addr.get("pincode", ""),
            "country": "India",
        },
    }

    items = [
        {
            "name": product_name,
            "quantity": qty,
            "price": unit_price,
            "currentPrice": unit_price,
            "totalPrice": total,
        }
    ]

    order_summary = {
        "subtotal": total,
        "discount": 0,
        "grandTotal": total,
        "deliveryCharge": 0,
    }

    payment_data = {
        "amount": total,
        "method": payment_method,
        "status": "Pending" if payment_method == "COD" else "Pending",
        "transactionId": "-",
        "razorpay_order_id": "",
        "razorpay_payment_id": "",
    }

    delivery = {
        "status": "Confirmed",
        "address": addr.get("street", ""),
        "city": addr.get("city", ""),
        "state": addr.get("state", ""),
        "pincode": addr.get("pincode", ""),
        # Source metadata — visible in admin orders page
        "source": "WHATSAPP_ADMIN",
        "created_by_phone": admin_phone_clean,
        "awb": "",
        "courier": "",
        "tracking_url": "",
        "label_url": "",
        "invoice_url": "",
        "return_status": "",
        "refund_status": "",
    }

    row_data = {
        "order_status": "Confirmed",
        "order_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "user_info": json.dumps(user_info),
        "items": json.dumps(items),
        "order_summary": json.dumps(order_summary),
        "payment": json.dumps(payment_data),
        "delivery": json.dumps(delivery),
        "total_amount": total,
        "payment_status": "COD Pending" if payment_method == "COD" else "Pending",
    }

    created_row = await _client.create_row(TABLE_IDS["orders"], row_data)

    # Assign order_id = "WABOOK{id}" so it's visually distinct from website orders
    row_id = created_row.get("id")
    order_id = f"WABOOK{row_id}"
    await _client.update_row(TABLE_IDS["orders"], row_id, {"order_id": order_id})
    created_row["order_id"] = order_id

    logger.info(
        f"[AdminOrder] ✓ Created order {order_id} "
        f"customer={name} ({phone}) "
        f"product={product_name} x{qty} "
        f"total=₹{total} "
        f"by_admin={admin_phone_clean}"
    )
    return created_row


# ── Order preview formatter ────────────────────────────────────────────────────

def format_order_preview(
    parsed_order: Dict[str, Any],
    product: Dict[str, Any],
    customer: Dict[str, Any],
) -> str:
    """Format a human-readable order preview message for admin confirmation."""
    name = parsed_order["customer_name"]
    phone = parsed_order["customer_phone"]
    qty = int(parsed_order["quantity"])
    payment_method = parsed_order["payment_method"]
    addr = parsed_order["address"]
    product_name = product.get("name") or "Book"
    unit_price = float(product.get("price") or product.get("mrp") or 0)
    total = round(unit_price * qty, 2)

    addr_parts = [
        addr.get("street", ""),
        addr.get("city", ""),
        addr.get("state", ""),
        addr.get("pincode", ""),
    ]
    addr_str = "\n".join(p for p in addr_parts if p)

    notes = str(customer.get("Notes") or "")
    customer_status = " (New Guest)" if "WHATSAPP_ADMIN" in notes else " (Existing Customer)"

    stock = product.get("stock_status") or ""
    stock_note = ""
    if "out_of_stock" in stock.lower():
        stock_note = "\n⚠️ Note: This product is currently Out of Stock."

    return (
        "📦 ORDER PREVIEW\n\n"
        f"Customer: {name}{customer_status}\n"
        f"Phone: {phone}\n\n"
        f"Product:\n{product_name} × {qty}\n"
        f"Unit Price: ₹{unit_price:.0f}\n"
        f"{stock_note}\n"
        "Address:\n"
        f"{addr_str}\n\n"
        f"Payment: {payment_method}\n"
        f"Total: ₹{total:.0f}\n\n"
        "Reply:\n"
        "✅ CONFIRM — to place the order\n"
        "❌ CANCEL — to discard"
    )
