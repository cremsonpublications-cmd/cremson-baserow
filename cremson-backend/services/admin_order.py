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
    "products": "Product (at least one)",
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

        Product: 45 x 2
        Product: 67 x 1

        Address:
        12 Anna Street
        Chennai
        Tamil Nadu
        600001

        Payment: COD

    Each Product line: "<ID or Name> x <Qty>"
    - Use numeric ID for exact match (recommended): Product: 45 x 2
    - Use name for search (may be ambiguous):       Product: Science Book x 1
    Multiple Product lines are supported for multi-book orders.
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

    # Products — collect ALL "Product: ..." lines, each with inline qty
    # Format: "Product: <ID or Name> x <Qty>"
    product_entries: List[Dict[str, Any]] = []
    _INVIS = "\u2060\u200b\u200c\u200d\u200e\u200f\ufeff\u00ad"
    for line in lines:
        m = re.match(r"(?i)product\s*:\s*(.+)", line.strip())
        if not m:
            continue
        raw = m.group(1).strip().strip(_INVIS).strip()
        # Normalize multiple spaces and invisible Unicode chars within the raw value
        raw = re.sub(r"[ \t]+", " ", raw).strip(_INVIS).strip()
        # Split on " x " or " X " (space-x-space) at the end: "Name x 2"
        # Also handle "Name x2" or "Namex2" less gracefully
        qty_match = re.search(r"\s+[xX]\s+(\d+)\s*$", raw)
        if qty_match:
            qty_val = int(qty_match.group(1))
            identifier = raw[:qty_match.start()].strip()
        else:
            # No inline qty — default to 1
            qty_val = 1
            identifier = raw.strip()

        if qty_val <= 0:
            return None, f"❌ Invalid quantity '{qty_val}' for product '{identifier}'. Qty must be ≥ 1."

        product_entries.append({"identifier": identifier, "qty": qty_val})

    if product_entries:
        data["products"] = product_entries

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
            after = re.sub(r"(?i)address\s*:", "", stripped).strip()
            if after:
                addr_lines.append(after)
            continue
        if in_addr:
            if re.match(r"(?i)(payment|product|qty|quantity|phone|customer)\s*:", stripped):
                break
            if stripped:
                addr_lines.append(stripped)

    if addr_lines:
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

    if missing:
        return None, (
            "❌ Order cannot be created.\n\n"
            "Missing:\n" + "\n".join(missing) +
            "\n\nPlease send the order again in the required format."
        )

    return data, None


# ── Product lookup ─────────────────────────────────────────────────────────────

async def find_product(identifier: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Look up a single product by ID (numeric) or by name (text search).

    ID lookup  — exact, fast, always recommended:
        identifier = "45"  → fetches row 45 directly
    Name lookup — fuzzy contains search, may be ambiguous:
        identifier = "Science Book"  → searches name field

    When name search returns multiple matches, the error message includes
    each product's ID so the admin can retry with the ID for precision.

    Returns (product_dict, None) on success or (None, error_message) on failure.
    """
    # Strip ASCII whitespace + invisible Unicode characters WhatsApp injects
    # (U+2060 WORD JOINER, U+200B ZERO WIDTH SPACE, U+FEFF BOM, etc.)
    _INVISIBLE = "\u2060\u200b\u200c\u200d\u200e\u200f\ufeff\u00ad"
    identifier = identifier.strip().strip(_INVISIBLE).strip()
    # Normalize multiple consecutive spaces/tabs to a single space
    import re as _re
    identifier = _re.sub(r"[ \t]+", " ", identifier).strip()

    # ── ID lookup ──────────────────────────────────────────────────────────────
    if identifier.isdigit():
        product_id = int(identifier)
        try:
            row = await _client.get_row(TABLE_IDS["products"], product_id)
        except Exception as exc:
            logger.error(f"[AdminOrder] Product ID lookup error id={product_id}: {exc}")
            return None, f"❌ Product ID {product_id} not found. Check the ID and try again."

        if not row or not row.get("id"):
            return None, f"❌ Product ID {product_id} not found. Check the ID and try again."

        is_active = row.get("is_active") in (True, 1, "true", "True", "1")
        if not is_active:
            return None, f"❌ Product ID {product_id} ({row.get('name', '')}) is inactive."

        return _map_product_for_order(row), None

    # ── Name search ────────────────────────────────────────────────────────────
    try:
        res = await _client.get_rows(
            TABLE_IDS["products"],
            size=200,
            filters={
                "name": ("contains", identifier),
                "is_active": "true",
            },
        )
    except Exception as exc:
        logger.error(f"[AdminOrder] Product name search error: {exc}")
        return None, "❌ Error looking up product. Please try again."

    results = res.get("results", [])
    active = [
        r for r in results
        if r.get("is_active") in (True, 1, "true", "True", "1")
    ]

    if not active:
        return None, (
            f"❌ Product not found: \"{identifier}\"\n\n"
            "Tip: Use the product ID for exact match.\n"
            "Example: Product: 45 x 2"
        )

    if len(active) == 1:
        return _map_product_for_order(active[0]), None

    # Multiple matches — show IDs so admin can retry precisely
    lines = [f"• ID {r.get('id')} — {r.get('name', '')}" for r in active[:8]]
    return None, (
        f"⚠️ Multiple products match \"{identifier}\":\n\n"
        + "\n".join(lines) +
        "\n\nUse the ID for exact match. Example:\n"
        f"Product: {active[0].get('id')} x 1"
    )


async def find_all_products(
    product_entries: List[Dict[str, Any]],
) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str]]:
    """
    Resolve all product entries from a parsed order.
    Each entry: {"identifier": "45" or "Book Name", "qty": 2}
    Returns (resolved_list, None) where each item = {"product": {...}, "qty": int}
    or (None, error_message) if any product fails to resolve.
    """
    resolved: List[Dict[str, Any]] = []
    for entry in product_entries:
        identifier = entry["identifier"]
        qty = entry["qty"]
        product, error = await find_product(identifier)
        if error:
            return None, error
        resolved.append({"product": product, "qty": qty})
    return resolved, None


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
    resolved_products: List[Dict[str, Any]],
    customer: Dict[str, Any],
    admin_phone: str,
) -> Dict[str, Any]:
    """
    Create an order in Baserow Orders table (762).
    resolved_products: list of {"product": {...}, "qty": int}
    Reuses the same JSON field structure as website orders.
    Returns the created order dict with order_id assigned.
    """
    name = parsed_order["customer_name"]
    phone = parsed_order["customer_phone"]
    payment_method = parsed_order["payment_method"]
    addr = parsed_order["address"]
    admin_phone_clean = normalize_phone(admin_phone)

    items = []
    subtotal = 0.0
    for entry in resolved_products:
        p = entry["product"]
        qty = int(entry["qty"])
        unit_price = float(p.get("price") or p.get("mrp") or 0)
        item_total = round(unit_price * qty, 2)
        subtotal += item_total
        items.append({
            "product_id": p.get("id"),
            "name": p.get("name") or "",
            "quantity": qty,
            "price": unit_price,
            "currentPrice": unit_price,
            "totalPrice": item_total,
        })
    total = round(subtotal, 2)

    user_info = {
        "name": name,
        "email": customer.get("email", ""),
        "phone": phone,
        "userId": customer.get("id"),
        "address": {
            "street": addr.get("street", ""),
            "apartment": "",
            "city": addr.get("city", ""),
            "state": addr.get("state", ""),
            "pincode": addr.get("pincode", ""),
            "country": "India",
        },
    }

    order_summary = {
        "subtotal": total,
        "discount": 0,
        "grandTotal": total,
        "deliveryCharge": 0,
    }

    payment_data = {
        "amount": total,
        "method": payment_method,
        "status": "Pending",
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

    row_id = created_row.get("id")
    order_id = f"WABOOK{row_id}"
    await _client.update_row(TABLE_IDS["orders"], row_id, {"order_id": order_id})
    created_row["order_id"] = order_id

    item_summary = ", ".join(
        f"{e['product'].get('name')} x{e['qty']}" for e in resolved_products
    )
    logger.info(
        f"[AdminOrder] ✓ Created order {order_id} "
        f"customer={name} ({phone}) "
        f"items=[{item_summary}] "
        f"total=₹{total} "
        f"by_admin={admin_phone_clean}"
    )
    return created_row


# ── Order preview formatter ────────────────────────────────────────────────────

def format_order_preview(
    parsed_order: Dict[str, Any],
    resolved_products: List[Dict[str, Any]],
    customer: Dict[str, Any],
) -> str:
    """
    Format a human-readable order preview for admin confirmation.
    resolved_products: list of {"product": {...}, "qty": int}
    """
    name = parsed_order["customer_name"]
    phone = parsed_order["customer_phone"]
    payment_method = parsed_order["payment_method"]
    addr = parsed_order["address"]

    addr_parts = [
        addr.get("street", ""),
        addr.get("city", ""),
        addr.get("state", ""),
        addr.get("pincode", ""),
    ]
    addr_str = "\n".join(p for p in addr_parts if p)

    notes = str(customer.get("Notes") or "")
    customer_status = " (New Guest)" if "WHATSAPP_ADMIN" in notes else " (Existing)"

    # Build product lines
    product_lines = []
    total = 0.0
    out_of_stock_warnings = []
    for entry in resolved_products:
        p = entry["product"]
        qty = int(entry["qty"])
        unit_price = float(p.get("price") or p.get("mrp") or 0)
        item_total = round(unit_price * qty, 2)
        total += item_total
        product_lines.append(
            f"• {p.get('name')} (ID:{p.get('id')}) × {qty} = ₹{item_total:.0f}"
        )
        stock = str(p.get("stock_status") or "")
        if "out_of_stock" in stock.lower():
            out_of_stock_warnings.append(f"⚠️ {p.get('name')} is Out of Stock")

    total = round(total, 2)
    products_str = "\n".join(product_lines)
    stock_warn = ("\n" + "\n".join(out_of_stock_warnings)) if out_of_stock_warnings else ""

    return (
        "📦 ORDER PREVIEW\n\n"
        f"Customer: {name}{customer_status}\n"
        f"Phone: {phone}\n\n"
        f"Products:\n{products_str}{stock_warn}\n\n"
        "Address:\n"
        f"{addr_str}\n\n"
        f"Payment: {payment_method}\n"
        f"Total: ₹{total:.0f}\n\n"
        "Reply:\n"
        "✅ CONFIRM — to place the order\n"
        "❌ CANCEL — to discard"
    )
