"""
Tests for WhatsApp Admin Order creation feature.

Run with:  pytest cremson-backend/tests/test_admin_order.py -v
"""

import os
import sys
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

# Ensure backend package is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ── Fixtures / helpers ─────────────────────────────────────────────────────────

ADMIN_PHONE = "919876543210"   # international format (from Meta webhook)
ADMIN_PHONE_10 = "9876543210"  # normalized 10-digit
CUSTOMER_PHONE = "9000000001"
UNAUTHORIZED_PHONE = "919111111111"

VALID_ORDER_TEXT = """ADMIN ORDER

Customer Name: Santhosh
Phone: 9000000001

Product: 10th Science Book
Qty: 2

Address:
12 Anna Street
Chennai
Tamil Nadu
600001

Payment: COD"""


# ── Test 1 — is_admin_number ───────────────────────────────────────────────────

def test_authorized_admin_number():
    with patch.dict(os.environ, {"WHATSAPP_ADMIN_NUMBERS": ADMIN_PHONE}):
        # Reload config after env change
        import importlib
        import config as cfg
        importlib.reload(cfg)

        from services.admin_order import is_admin_number, get_admin_numbers
        import services.admin_order as ao
        importlib.reload(ao)

        assert ao.is_admin_number(ADMIN_PHONE) is True
        assert ao.is_admin_number(f"+{ADMIN_PHONE}") is True
        assert ao.is_admin_number(ADMIN_PHONE_10) is True  # 10-digit also works


def test_unauthorized_number_rejected():
    with patch.dict(os.environ, {"WHATSAPP_ADMIN_NUMBERS": ADMIN_PHONE}):
        import importlib, config as cfg
        importlib.reload(cfg)
        import services.admin_order as ao
        importlib.reload(ao)

        assert ao.is_admin_number(UNAUTHORIZED_PHONE) is False
        assert ao.is_admin_number("919999999999") is False


def test_empty_admin_numbers_rejects_all():
    with patch.dict(os.environ, {"WHATSAPP_ADMIN_NUMBERS": ""}):
        import importlib, config as cfg
        importlib.reload(cfg)
        import services.admin_order as ao
        importlib.reload(ao)

        assert ao.is_admin_number(ADMIN_PHONE) is False


# ── Test 2 — parse_admin_order ─────────────────────────────────────────────────

def test_parse_valid_order():
    from services.admin_order import parse_admin_order
    result, error = parse_admin_order(VALID_ORDER_TEXT)
    assert error is None
    assert result is not None
    assert result["customer_name"] == "Santhosh"
    assert result["customer_phone"] == CUSTOMER_PHONE
    assert result["product_name"] == "10th Science Book"
    assert result["quantity"] == 2
    assert result["payment_method"] == "COD"
    assert result["address"]["city"] == "Chennai"
    assert result["address"]["state"] == "Tamil Nadu"
    assert result["address"]["pincode"] == "600001"


def test_parse_missing_phone():
    text = VALID_ORDER_TEXT.replace("Phone: 9000000001", "")
    from services.admin_order import parse_admin_order
    result, error = parse_admin_order(text)
    assert result is None
    assert error is not None
    assert "Customer Phone" in error


def test_parse_missing_product():
    text = VALID_ORDER_TEXT.replace("Product: 10th Science Book", "")
    from services.admin_order import parse_admin_order
    result, error = parse_admin_order(text)
    assert result is None
    assert "Product" in error


def test_parse_invalid_quantity():
    text = VALID_ORDER_TEXT.replace("Qty: 2", "Qty: abc")
    from services.admin_order import parse_admin_order
    result, error = parse_admin_order(text)
    assert result is None
    assert error is not None


def test_parse_invalid_phone():
    text = VALID_ORDER_TEXT.replace("Phone: 9000000001", "Phone: 123")
    from services.admin_order import parse_admin_order
    result, error = parse_admin_order(text)
    assert result is None
    assert "phone" in error.lower()


def test_parse_invalid_payment():
    text = VALID_ORDER_TEXT.replace("Payment: COD", "Payment: bitcoin")
    from services.admin_order import parse_admin_order
    result, error = parse_admin_order(text)
    assert result is None
    assert "payment" in error.lower()


def test_parse_case_insensitive():
    text = VALID_ORDER_TEXT.lower()  # all lowercase labels
    from services.admin_order import parse_admin_order
    result, error = parse_admin_order(text)
    assert result is not None, f"Expected success but got: {error}"


# ── Test 3 — New guest customer created ───────────────────────────────────────

@pytest.mark.asyncio
async def test_find_or_create_guest_new_customer():
    from services.admin_order import find_or_create_guest_customer

    with patch("services.admin_order.get_user_by_phone", return_value=None), \
         patch("services.admin_order._client") as mock_client:

        mock_client.create_row = AsyncMock(return_value={
            "id": 125,
            "email": "guest_9000000001@whatsapp.cremson",
            "name": "Santhosh",
            "phone": "9000000001",
            "password_hash": "",
            "is_verified": 0,
            "is_active": 1,
            "Notes": "role: customer; is_approved: 1; created_via: WHATSAPP_ADMIN",
        })

        customer = await find_or_create_guest_customer("Santhosh", CUSTOMER_PHONE)
        assert customer["id"] == 125
        assert customer["phone"] == CUSTOMER_PHONE

        # Verify create_row was called (guest was created)
        mock_client.create_row.assert_called_once()
        call_payload = mock_client.create_row.call_args[0][1]
        assert "WHATSAPP_ADMIN" in call_payload["Notes"]
        assert call_payload["is_verified"] == 0
        assert call_payload["password_hash"] == ""


# ── Test 4 — Existing customer found, no duplicate ────────────────────────────

@pytest.mark.asyncio
async def test_find_or_create_guest_existing_customer():
    existing_user = {
        "id": 50,
        "name": "Santhosh",
        "phone": CUSTOMER_PHONE,
        "email": "santhosh@example.com",
        "is_verified": 1,
        "Notes": "role: customer; is_approved: 1",
    }
    from services.admin_order import find_or_create_guest_customer

    with patch("services.admin_order.get_user_by_phone", return_value=existing_user), \
         patch("services.admin_order._client") as mock_client:

        mock_client.create_row = AsyncMock()
        customer = await find_or_create_guest_customer("Santhosh", CUSTOMER_PHONE)

        assert customer["id"] == 50
        mock_client.create_row.assert_not_called()  # No new user created


# ── Test 5 — CONFIRM creates exactly one order ────────────────────────────────

@pytest.mark.asyncio
async def test_confirm_creates_order():
    from services.admin_order import (
        parse_admin_order,
        format_order_preview,
        create_whatsapp_admin_order,
        mark_confirm_processed,
        is_confirm_already_processed,
    )

    parsed, _ = parse_admin_order(VALID_ORDER_TEXT)
    product = {"id": 10, "name": "10th Science Book", "mrp": 270.0, "price": 270.0}
    customer = {"id": 125, "name": "Santhosh", "phone": CUSTOMER_PHONE, "email": ""}

    with patch("services.admin_order._client") as mock_client:
        mock_client.create_row = AsyncMock(return_value={"id": 1050, "order_status": "Confirmed"})
        mock_client.update_row = AsyncMock(return_value={"id": 1050, "order_id": "WABOOK1050"})

        order = await create_whatsapp_admin_order(parsed, product, customer, ADMIN_PHONE)
        assert order["order_id"] == "WABOOK1050"
        mock_client.create_row.assert_called_once()
        mock_client.update_row.assert_called_once()


# ── Test 6 — CANCEL creates no order ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_cancel_creates_no_order():
    """When admin sends CANCEL, _handle_admin_order_confirmation should not call create_whatsapp_admin_order."""
    from services import whatsapp_chat

    with patch("services.whatsapp_chat.send_text_message", new_callable=AsyncMock) as mock_send, \
         patch("services.whatsapp_chat.create_whatsapp_admin_order", new_callable=AsyncMock) as mock_create, \
         patch("services.whatsapp_chat.set_conversation_state") as mock_state:

        context = {
            "parsed_order": {"customer_name": "Santhosh", "customer_phone": CUSTOMER_PHONE,
                             "product_name": "10th Science Book", "quantity": 2,
                             "payment_method": "COD", "address": {"street": "12 Anna St",
                             "city": "Chennai", "state": "Tamil Nadu", "pincode": "600001"}},
            "product": {"id": 10, "name": "10th Science Book", "price": 270.0},
            "customer": {"id": 125, "name": "Santhosh", "phone": CUSTOMER_PHONE, "email": ""},
            "admin_phone": ADMIN_PHONE,
        }

        await whatsapp_chat._handle_admin_order_confirmation(
            ADMIN_PHONE, "cancel", context, "wamid_test_123"
        )

        mock_create.assert_not_called()
        # Confirm cancelled message was sent
        sent_text = mock_send.call_args[0][1]
        assert "cancel" in sent_text.lower() or "cancelled" in sent_text.lower()


# ── Test 7 — Guest to active on signup ────────────────────────────────────────

@pytest.mark.asyncio
async def test_activate_guest_to_active():
    from db.auth import is_guest_user, activate_guest_to_active

    guest_user = {
        "id": 125,
        "name": "Santhosh",
        "phone": CUSTOMER_PHONE,
        "email": "guest_9000000001@whatsapp.cremson",
        "is_verified": 0,
        "is_active": 1,
        "Notes": "role: customer; is_approved: 1; created_via: WHATSAPP_ADMIN",
        "role": "customer",
        "is_approved": 1,
    }

    assert is_guest_user(guest_user) is True

    # Verified user is not a guest
    verified_user = {**guest_user, "is_verified": 1, "Notes": "role: customer; is_approved: 1"}
    assert is_guest_user(verified_user) is False

    with patch("db.auth._client") as mock_client:
        mock_client.update_row = AsyncMock(return_value={
            "id": 125,
            "email": "santhosh@example.com",
            "name": "Santhosh",
            "phone": CUSTOMER_PHONE,
            "password_hash": "hashed_password",
            "is_verified": 0,
            "is_active": 1,
            "Notes": "role: customer; is_approved: 1",
        })

        updated = await activate_guest_to_active(125, "santhosh@example.com", "hashed_password", "Santhosh")
        assert updated["id"] == 125
        assert "WHATSAPP_ADMIN" not in (updated.get("Notes") or "")
        assert updated["is_verified"] == 0  # Still needs OTP — NOT auto-logged-in


# ── Test 8 — Duplicate webhook prevention ─────────────────────────────────────

def test_duplicate_confirm_prevention():
    from services.admin_order import (
        is_confirm_already_processed,
        mark_confirm_processed,
        _PROCESSED_CONFIRM_IDS,
    )

    wamid = "wamid.test_unique_id_abc123"

    # Clear any prior state
    _PROCESSED_CONFIRM_IDS.pop(wamid, None)

    assert is_confirm_already_processed(wamid) is False
    mark_confirm_processed(wamid)
    assert is_confirm_already_processed(wamid) is True

    # Different ID is unaffected
    assert is_confirm_already_processed("wamid.different_id") is False


# ── Test — Unauthorized ADMIN ORDER is ignored (customer flow continues) ───────

@pytest.mark.asyncio
async def test_unauthorized_admin_order_falls_through():
    """
    Unauthorized user sending ADMIN ORDER should NOT trigger admin order flow.
    They should receive normal customer chatbot response.
    """
    from services import whatsapp_chat

    with patch.dict(os.environ, {"WHATSAPP_ADMIN_NUMBERS": ADMIN_PHONE}), \
         patch("services.whatsapp_chat.is_admin_number", return_value=False), \
         patch("services.whatsapp_chat._handle_admin_order_message", new_callable=AsyncMock) as mock_admin, \
         patch("services.whatsapp_chat.send_text_message", new_callable=AsyncMock), \
         patch("services.whatsapp_chat.get_conversation_state", return_value={"state": "MAIN_MENU", "context": {}}), \
         patch("services.whatsapp_chat.set_conversation_state"):

        await whatsapp_chat.handle_incoming_message(UNAUTHORIZED_PHONE, "ADMIN ORDER\nCustomer Name: Test")

        # Admin order handler must NOT be called
        mock_admin.assert_not_called()
