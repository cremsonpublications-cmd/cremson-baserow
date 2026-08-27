"""
Shipway Shipping Integration Service
API v2 — correct endpoint, Basic Auth, warehouse_id, weight in grams.
Handles: create_shipment, request_pickup, get_tracking, webhook status parsing.
"""

import base64
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
import re
from services.baserow import BaserowClient
from config import TABLE_IDS

import httpx

logger = logging.getLogger("uvicorn.error")


def _cfg():
    """Lazy-load Shipway config to avoid circular imports."""
    from config import (
        SHIPWAY_USERNAME,
        SHIPWAY_LICENSE_KEY,
        SHIPWAY_BASE_URL,
        SHIPWAY_WAREHOUSE_ID,
        SHIPWAY_CARRIER_ID,
    )
    return SHIPWAY_USERNAME, SHIPWAY_LICENSE_KEY, SHIPWAY_BASE_URL, SHIPWAY_WAREHOUSE_ID, SHIPWAY_CARRIER_ID


def _auth_header(username: str, license_key: str) -> str:
    """Return Basic Auth header value: Basic base64(username:license_key)."""
    token = base64.b64encode(f"{username}:{license_key}".encode()).decode()
    return f"Basic {token}"


def clean_city_for_shipway(pincode: str, current_city: str) -> str:
    """
    Cleans and standardizes the city name for Indian pincodes to ensure
    compatibility with Shipway and courier APIs (like Delhivery).
    """
    if not pincode:
        return current_city
        
    p_clean = "".join(filter(str.isdigit, str(pincode))).strip()
    c_lower = str(current_city or "").lower().strip()
    
    # 1. Delhi NCR (pincodes starting with 11)
    if p_clean.startswith("11") or "delhi" in c_lower:
        return "Delhi"
        
    # 2. Mumbai (pincodes starting with 400)
    if p_clean.startswith("400") or "mumbai" in c_lower:
        return "Mumbai"
        
    # 3. Bengaluru (pincodes starting with 560)
    if p_clean.startswith("560") or "bangalore" in c_lower or "bengaluru" in c_lower:
        return "Bengaluru"
        
    # 4. Chennai (pincodes starting with 600)
    if p_clean.startswith("600") or "chennai" in c_lower or "madras" in c_lower:
        return "Chennai"
        
    # 5. Hyderabad (pincodes starting with 500)
    if p_clean.startswith("500") or "hyderabad" in c_lower or "secunderabad" in c_lower:
        return "Hyderabad"
        
    # 6. Kolkata (pincodes starting with 700)
    if p_clean.startswith("700") or "kolkata" in c_lower or "calcutta" in c_lower:
        return "Kolkata"
        
    # 7. Pune (pincodes starting with 411 or 412)
    if p_clean.startswith("411") or p_clean.startswith("412") or "pune" in c_lower:
        return "Pune"
        
    # 8. Ahmedabad (pincodes starting with 380)
    if p_clean.startswith("380") or "ahmedabad" in c_lower:
        return "Ahmedabad"

    return current_city


# ── Auth ──────────────────────────────────────────────────────────────────────


async def authenticate() -> bool:
    """Verify Shipway credentials are valid (lightweight API ping)."""
    username, license_key, base_url, _, _ = _cfg()
    if not username or not license_key:
        logger.error("[Shipway] SHIPWAY_USERNAME or SHIPWAY_LICENSE_KEY not set")
        return False

    url = f"{base_url}/api/getcarrier"
    headers = {"Authorization": _auth_header(username, license_key)}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            logger.info(f"[Shipway] Auth check → HTTP {resp.status_code}")
            return resp.status_code == 200
    except Exception as exc:
        logger.error(f"[Shipway] Auth check error: {exc}")
        return False


# ── Rate Calculator & Cheapest Courier Allocation ─────────────────────────────


async def get_all_available_carriers(
    delivery_pincode: str,
    weight_grams: int,
    pickup_pincode: Optional[str] = None,
    payment_type: str = "P",
) -> List[Dict[str, Any]]:
    """
    Fetch rate quotes from Shipway and return ALL available carriers sorted by price (cheapest first).
    Returns list of {"id": str, "name": str, "price": float}.
    Falls back to known Delhivery carriers if rate API fails.
    """
    username, license_key, base_url, warehouse_id, _ = _cfg()
    if not username or not license_key or not delivery_pincode:
        return []

    headers = {
        "Authorization": _auth_header(username, license_key),
        "Content-Type": "application/json",
    }

    endpoints = [
        f"{base_url}/api/v2/rates",
        f"{base_url}/api/rates",
        f"{base_url}/api/serviceability",
    ]

    payload = {
        "delivery_pincode": str(delivery_pincode).strip(),
        "weight": weight_grams,
        "payment_type": payment_type,
    }
    if pickup_pincode:
        payload["pickup_pincode"] = str(pickup_pincode).strip()
    elif warehouse_id:
        payload["warehouse_id"] = str(warehouse_id).strip()

    for url in endpoints:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code != 200:
                    resp = await client.get(url, headers=headers, params=payload)

                if resp.status_code == 200:
                    try:
                        res_json = resp.json()
                    except Exception:
                        continue

                    couriers = []
                    if isinstance(res_json, list):
                        couriers = res_json
                    elif isinstance(res_json, dict):
                        couriers = (
                            res_json.get("data")
                            or res_json.get("couriers")
                            or res_json.get("rates")
                            or res_json.get("services")
                            or []
                        )

                    if isinstance(couriers, list) and len(couriers) > 0:
                        valid_options = []
                        for c in couriers:
                            if not isinstance(c, dict):
                                continue
                            c_id = str(
                                c.get("carrier_id")
                                or c.get("id")
                                or c.get("courier_id")
                                or ""
                            )
                            price_val = (
                                c.get("freight_charge")
                                or c.get("freight_charges")
                                or c.get("rate")
                                or c.get("total_amount")
                                or c.get("price")
                                or c.get("charge")
                            )
                            if c_id and price_val is not None:
                                try:
                                    price = float(price_val)
                                    name = str(
                                        c.get("courier_name")
                                        or c.get("name")
                                        or c_id
                                    )
                                    valid_options.append(
                                        {"id": c_id, "name": name, "price": price}
                                    )
                                except (ValueError, TypeError):
                                    pass

                        if valid_options:
                            valid_options.sort(key=lambda x: x["price"])
                            logger.info(
                                f"[Shipway Rate Check] ✓ {len(valid_options)} carriers for pincode {delivery_pincode}: "
                                + ", ".join(f"{c['name']}(₹{c['price']:.0f})" for c in valid_options[:5])
                            )
                            return valid_options
        except Exception as exc:
            logger.debug(f"[Shipway Rate Check] Endpoint {url} check error: {exc}")

    # Fallback to known Delhivery carriers in weight order
    if weight_grams <= 500:
        fallback = [{"id": "80622", "name": "Delhivery 0.5kg", "price": 0},
                    {"id": "80734", "name": "Delhivery 1kg", "price": 1},
                    {"id": "80977", "name": "Delhivery 2kg", "price": 2}]
    elif weight_grams <= 1500:
        fallback = [{"id": "80734", "name": "Delhivery 1kg", "price": 0},
                    {"id": "80622", "name": "Delhivery 0.5kg", "price": 1},
                    {"id": "80977", "name": "Delhivery 2kg", "price": 2}]
    else:
        fallback = [{"id": "80977", "name": "Delhivery 2kg", "price": 0},
                    {"id": "80734", "name": "Delhivery 1kg", "price": 1},
                    {"id": "80622", "name": "Delhivery 0.5kg", "price": 2}]

    logger.info(f"[Shipway Rate Check] Using weight-matched fallback carriers for {weight_grams}g")
    return fallback


async def get_cheapest_carrier(
    delivery_pincode: str,
    weight_grams: int,
    pickup_pincode: Optional[str] = None,
    payment_type: str = "P",
) -> Optional[str]:
    """Backward-compatible wrapper — returns cheapest carrier_id string."""
    carriers = await get_all_available_carriers(
        delivery_pincode=delivery_pincode,
        weight_grams=weight_grams,
        pickup_pincode=pickup_pincode,
        payment_type=payment_type,
    )
    return carriers[0]["id"] if carriers else None


# ── Create Shipment ───────────────────────────────────────────────────────────


async def create_shipment(order: Dict[str, Any]) -> Dict[str, Any]:
    """
    Register a new shipment with Shipway (API v2) immediately after payment.

    Expected keys in `order`:
        order_id, order_date, total_amount, items (list of dicts with name/price/qty),
        customer_name, customer_email, customer_phone,
        address, address2, city, state, pincode,
        weight_grams (default 500), length/breadth/height (cm)

    Returns:
        {
            success: bool,
            shipment_id: str,
            awb: str,
            courier_name: str,
            tracking_url: str,
            label_url: str,
            error: str (on failure)
        }
    """
    username, license_key, base_url, warehouse_id, carrier_id = _cfg()
    url = f"{base_url}/api/v2orders"

    headers = {
        "Authorization": _auth_header(username, license_key),
        "Content-Type": "application/json",
    }

    def parse_weight_kg(weight_str: Any) -> float:
        if not weight_str:
            return 0.5
        s = str(weight_str).lower().strip()
        match = re.search(r"([0-9]+(?:\.[0-9]+)?)", s)
        if not match:
            return 0.5
        val = float(match.group(1))
        if val <= 0:
            return 0.5
        if "gm" in s or "g" in s and "kg" not in s:
            return val / 1000.0
        return val

    def parse_dimension_cm(dim_str: Any) -> tuple:
        default_dim = (20.0, 15.0, 2.0)
        if not dim_str:
            return default_dim
        s = str(dim_str).lower().strip()
        parts = re.split(r"[,x*]", s)
        if len(parts) < 3:
            parts = re.split(r"[,x*\s]+", s)
        if len(parts) < 3:
            return default_dim
        parsed = []
        for p in parts[:3]:
            match = re.search(r"([0-9]+(?:\.[0-9]+)?)", p)
            if match:
                parsed.append(float(match.group(1)))
            else:
                parsed.append(None)
        if len(parsed) == 3 and all(val is not None for val in parsed):
            return (parsed[0], parsed[1], parsed[2])
        return default_dim

    # Build products array and calculate aggregated weight/dimensions
    items: List[dict] = order.get("items") or []
    total_weight_kg = 0.0
    max_length = 0.0
    max_breadth = 0.0
    total_height = 0.0
    
    baserow = BaserowClient()

    if items:
        products = []
        for item in items:
            name = item.get("name") or item.get("title") or "Book"
            price = float(item.get("currentPrice") or item.get("price") or 0)
            prod_id = str(item.get("product_id") or item.get("productId") or item.get("id") or "BOOK")
            qty = int(item.get("quantity") or item.get("qty") or 1)
            
            # Fetch product details from Baserow or item dict (Default to 500g / 0.5kg per book if missing)
            item_weight_str = item.get("weight") or item.get("weight_kg")
            weight_kg = parse_weight_kg(item_weight_str)
            length = 20.0
            breadth = 15.0
            height = 2.0
            
            sku_val = prod_id
            
            if prod_id.isdigit():
                try:
                    prod_row = await baserow.get_row(TABLE_IDS["products"], int(prod_id))
                    if prod_row:
                        if prod_row.get("sku"):
                            sku_val = str(prod_row.get("sku")).strip() or prod_id
                        if prod_row.get("weight"):
                            weight_kg = parse_weight_kg(prod_row.get("weight"))
                        if prod_row.get("dimension"):
                            length, breadth, height = parse_dimension_cm(prod_row.get("dimension"))
                except Exception as e:
                    logger.error(f"[Shipway] Error fetching product {prod_id} details: {e}")
            
            total_weight_kg += weight_kg * qty
            max_length = max(max_length, length)
            max_breadth = max(max_breadth, breadth)
            total_height += height * qty
        
        # Consolidate all items into a single product entry for the shipping label
        items_desc_parts = []
        total_qty = 0
        for item in items:
            name = item.get("name") or item.get("title") or "Book"
            qty = int(item.get("quantity") or item.get("qty") or 1)
            items_desc_parts.append(f"{name} (x{qty})")
            total_qty += qty
            
        combined_desc = ", ".join(items_desc_parts)
        if len(combined_desc) > 200:
            combined_desc = combined_desc[:197] + "..."
            
        products = [{
            "product": combined_desc,
            "price": float(order.get("total_amount") or 0),
            "product_code": "MULTIPLE",
            "product_quantity": total_qty,
            "discount": 0,
            "tax_rate": 0,
            "tax_title": "GST",
        }]
    else:
        products = [
            {
                "product": order.get("items_description") or "Books",
                "price": float(order.get("total_amount") or 0),
                "product_code": "BOOK",
                "product_quantity": 1,
                "discount": 0,
                "tax_rate": 0,
                "tax_title": "GST",
            }
        ]
        total_weight_kg = 0.5
        max_length = 20.0
        max_breadth = 15.0
        total_height = 5.0

    if max_length <= 0:
        max_length = 20.0
    if max_breadth <= 0:
        max_breadth = 15.0
    if total_height <= 0:
        total_height = 5.0

    weight_grams_int = int(total_weight_kg * 1000)
    weight_grams = str(weight_grams_int)

    payload: Dict[str, Any] = {
        "order_id": order["order_id"],
        "order_date": (order.get("order_date") or "").split(" ")[0] or datetime.now().strftime("%Y-%m-%d"),
        "payment_type": "P",  # Prepaid
        "products": products,
        "shipping_firstname": order.get("customer_name", ""),
        "shipping_email": order.get("customer_email", ""),
        "shipping_phone": order.get("customer_phone", ""),
        "shipping_address": order.get("address", ""),
        "shipping_address_2": order.get("address2", ""),
        "shipping_city": clean_city_for_shipway(str(order.get("pincode", "")), order.get("city", "")),
        "shipping_state": order.get("state", ""),
        "shipping_zipcode": str(order.get("pincode", "")),
        "shipping_country": "India",
        "order_weight": weight_grams,
        "length": str(int(max_length)),
        "breadth": str(int(max_breadth)),
        "height": str(int(total_height)),
        "collectable_amount": "0",
        "comment": f"Cremson order {order['order_id']}",
    }

    # Warehouse IDs (numeric strings from Shipway Settings → Pickup Address)
    if warehouse_id:
        payload["warehouse_id"] = warehouse_id
        payload["return_warehouse_id"] = warehouse_id

    # Carrier selection with fallback list
    effective_carrier_id = carrier_id
    candidate_carriers: List[Dict[str, Any]] = []
    cust_pincode = str(order.get("pincode", "")).strip()

    if effective_carrier_id is None or str(effective_carrier_id).strip() in ("", "0"):
        # No fixed carrier configured — get all available carriers sorted by price
        if cust_pincode:
            candidate_carriers = await get_all_available_carriers(
                delivery_pincode=cust_pincode,
                weight_grams=weight_grams_int,
                payment_type="P",
            )
            if candidate_carriers:
                effective_carrier_id = candidate_carriers[0]["id"]
    else:
        # A carrier is configured — put it first, then add all others as fallbacks
        candidate_carriers = [{"id": str(effective_carrier_id), "name": "configured", "price": 0}]
        if cust_pincode:
            all_carriers = await get_all_available_carriers(
                delivery_pincode=cust_pincode,
                weight_grams=weight_grams_int,
                payment_type="P",
            )
            # Append carriers not already in list as fallbacks
            seen_ids = {str(effective_carrier_id)}
            for c in all_carriers:
                if c["id"] not in seen_ids:
                    candidate_carriers.append(c)
                    seen_ids.add(c["id"])

    if effective_carrier_id is not None and str(effective_carrier_id) != "":
        payload["carrier_id"] = str(effective_carrier_id)

    logger.info(f"[Shipway] → create_shipment: order={order['order_id']}")
    logger.info(f"[Shipway] Payload: {json.dumps(payload, default=str)}")

    # Try each candidate carrier in order until one succeeds
    carriers_to_try = candidate_carriers if candidate_carriers else [{"id": str(effective_carrier_id or ""), "name": "default", "price": 0}]
    last_error = "Unknown Shipway error"

    for attempt_idx, carrier_opt in enumerate(carriers_to_try):
        carrier_attempt_id = carrier_opt["id"]
        if carrier_attempt_id:
            payload["carrier_id"] = carrier_attempt_id
        elif "carrier_id" in payload:
            del payload["carrier_id"]

        if attempt_idx > 0:
            logger.info(f"[Shipway] ↺ Retrying with fallback carrier {carrier_opt['name']} (ID: {carrier_attempt_id}) for order={order['order_id']}")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                raw = resp.text
                logger.info(f"[Shipway] ← create_shipment HTTP {resp.status_code} (carrier={carrier_attempt_id}): {raw[:500]}")

                try:
                    data = resp.json()
                except Exception:
                    last_error = f"Non-JSON response: {raw[:300]}"
                    continue

                awb_resp = data.get("awb_response")
                if not isinstance(awb_resp, dict):
                    awb_resp = {}

                awb = str(awb_resp.get("AWB") or awb_resp.get("awb") or "").strip()
                awb_err = awb_resp.get("error") or data.get("message")

                if not data.get("success") or not awb or awb_resp.get("success") is False:
                    last_error = str(awb_err or data.get("message") or data.get("error") or "Shipway AWB generation failed")
                    logger.warning(f"[Shipway] Carrier {carrier_attempt_id} failed: {last_error}")
                    continue  # Try next carrier

                carrier = str(awb_resp.get("carrier_id") or awb_resp.get("courier_name") or carrier_attempt_id)
                label_url = awb_resp.get("shipping_url") or awb_resp.get("label") or ""
                tracking_url = f"https://cremsonpublications.shipway.com/tracking/forward/{awb}/" if awb else "https://cremsonpublications.shipway.com/"
                shipment_id = str(
                    data.get("shipment_id")
                    or awb_resp.get("shipment_id")
                    or awb
                )

                logger.info(
                    f"[Shipway] Shipment created ✓ AWB={awb} ID={shipment_id} Carrier={carrier} (attempt {attempt_idx+1})"
                )
                return {
                    "success": True,
                    "shipment_id": shipment_id,
                    "awb": awb,
                    "courier_name": carrier,
                    "carrier_id": str(awb_resp.get("carrier_id") or carrier_attempt_id),
                    "tracking_url": tracking_url,
                    "label_url": label_url,
                }

        except httpx.TimeoutException:
            last_error = "Shipway API timed out"
            logger.error(f"[Shipway] create_shipment timed out (carrier={carrier_attempt_id})")
            continue
        except Exception as exc:
            last_error = str(exc)
            logger.error(f"[Shipway] create_shipment exception (carrier={carrier_attempt_id}): {exc}", exc_info=True)
            continue

    # All carriers exhausted
    logger.error(f"[Shipway] All carriers failed for order={order['order_id']}. Last error: {last_error}")
    return {"success": False, "error": last_error}


# ── Create Reverse Shipment ───────────────────────────────────────────────────


async def create_reverse_shipment(order: Dict[str, Any], reason: str = "") -> Dict[str, Any]:
    """
    Schedule a reverse shipment pickup from customer's address back to Cremson warehouse.

    Expected keys in `order`:
        order_id, total_amount, items, customer_name, customer_email, customer_phone,
        address, address2, city, state, pincode, weight_grams

    Returns:
        {
            success: bool,
            reverse_shipment_id: str,
            reverse_awb: str,
            courier_name: str,
            tracking_url: str,
            error: str (on failure)
        }
    """
    username, license_key, base_url, warehouse_id, _ = _cfg()
    url = f"{base_url}/api/v2reverseorders"

    headers = {
        "Authorization": _auth_header(username, license_key),
        "Content-Type": "application/json",
    }

    ret_order_id = f"RET_{order['order_id']}"
    weight_grams = str(order.get("weight_grams") or 500)

    payload: Dict[str, Any] = {
        "order_id": ret_order_id,
        "reference_order_id": order["order_id"],
        "order_date": datetime.now().strftime("%Y-%m-%d"),
        "payment_type": "P",
        "order_type": "R",  # Reverse
        "shipping_firstname": order.get("customer_name", ""),
        "shipping_email": order.get("customer_email", ""),
        "shipping_phone": order.get("customer_phone", ""),
        "shipping_address": order.get("address", ""),
        "shipping_address_2": order.get("address2", ""),
        "shipping_city": clean_city_for_shipway(str(order.get("pincode", "")), order.get("city", "")),
        "shipping_state": order.get("state", ""),
        "shipping_zipcode": str(order.get("pincode", "")),
        "shipping_country": "India",
        "order_weight": weight_grams,
        "length": "20",
        "breadth": "15",
        "height": "5",
        "collectable_amount": "0",
        "comment": f"Return for order {order['order_id']}: {reason}",
    }

    if warehouse_id:
        payload["warehouse_id"] = warehouse_id
        payload["return_warehouse_id"] = warehouse_id

    logger.info(f"[Shipway] → create_reverse_shipment: order={ret_order_id} reason={reason}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            # If v2reverseorders isn't enabled, fallback to v2orders with order_type='R'
            if resp.status_code == 404:
                url_alt = f"{base_url}/api/v2orders"
                resp = await client.post(url_alt, headers=headers, json=payload)

            raw = resp.text
            logger.info(f"[Shipway] ← create_reverse_shipment HTTP {resp.status_code}: {raw[:400]}")

            try:
                data = resp.json()
            except Exception:
                return {"success": False, "error": f"Non-JSON response: {raw[:300]}"}

            if not data.get("success") and resp.status_code != 200:
                err = data.get("message") or data.get("error") or "Reverse shipment failed"
                return {"success": False, "error": err}

            awb_resp = data.get("awb_response") or {}
            if not isinstance(awb_resp, dict):
                awb_resp = {}

            awb = awb_resp.get("AWB") or awb_resp.get("awb") or data.get("awb") or ""
            carrier = str(awb_resp.get("courier_name") or awb_resp.get("carrier_id") or "Shipway")
            tracking_url = f"https://cremsonpublications.shipway.com/tracking/forward/{awb}/" if awb else "https://cremsonpublications.shipway.com/"
            shipment_id = str(data.get("shipment_id") or awb_resp.get("shipment_id") or awb or ret_order_id)
            label_url = awb_resp.get("shipping_url") or awb_resp.get("label") or data.get("shipping_url") or data.get("label") or ""

            return {
                "success": True,
                "reverse_shipment_id": shipment_id,
                "reverse_awb": awb,
                "courier_name": carrier,
                "tracking_url": tracking_url,
                "label_url": label_url,
            }
    except Exception as exc:
        logger.error(f"[Shipway] create_reverse_shipment exception: {exc}")
        return {"success": False, "error": str(exc)}


# ── Request Pickup ────────────────────────────────────────────────────────────


async def request_pickup(
    shipment_id: str,
    awb: str,
    order_id: str,
    carrier_id: str = "",
    warehouse_id: str = "",
) -> Dict[str, Any]:
    """
    Ask Shipway to schedule a courier pickup using the createpickup API.
    Called when admin clicks 'Packed & Request Pickup'.

    Returns: { success: bool, data: dict, error: str }
    """
    username, license_key, base_url, default_warehouse_id, default_carrier_id = _cfg()
    url = f"{base_url}/api/createpickup"

    headers = {
        "Authorization": _auth_header(username, license_key),
        "Content-Type": "application/json",
    }

    # Format pickup date as YYYY-MM-DD
    pickup_date = datetime.now().strftime("%Y-%m-%d")
    pickup_time = "15:00"
    office_close_time = "19:00"

    w_id = warehouse_id or default_warehouse_id or "0"
    c_id = carrier_id or str(default_carrier_id or "0")

    payload = {
        "pickup_date": pickup_date,
        "pickup_time": pickup_time,
        "office_close_time": office_close_time,
        "package_count": "1",
        "carrier_id": str(c_id),
        "warehouse_id": str(w_id),
        "return_warehouse_id": str(w_id),
        "payment_type": "P",  # Prepaid
        "order_ids": [order_id],
    }

    logger.info(f"[Shipway] → request_pickup: order={order_id} AWB={awb} payload={payload}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            raw = resp.text
            logger.info(f"[Shipway] ← request_pickup HTTP {resp.status_code}: {raw[:400]}")

            try:
                data = resp.json()
            except Exception:
                data = raw

            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except Exception:
                    pass

            if isinstance(data, dict):
                ok = (
                    data.get("success") is True
                    or data.get("status") in [1, "1", "success", True]
                    or resp.status_code == 200
                )
                error_msg = data.get("message") or data.get("error") if not ok else None
            else:
                ok = resp.status_code == 200 and "success" in str(data).lower()
                error_msg = str(data) if not ok else None
                data = {"raw": data}

            return {
                "success": ok,
                "data": data,
                "error": error_msg,
            }

    except Exception as exc:
        logger.error(f"[Shipway] request_pickup exception: {exc}", exc_info=True)
        return {"success": False, "data": {}, "error": str(exc)}


# ── Get Tracking ──────────────────────────────────────────────────────────────


async def get_tracking(order_id: str) -> Dict[str, Any]:
    """Poll current tracking status for an order from Shipway."""
    username, license_key, base_url, _, _ = _cfg()
    url = f"{base_url}/api/getTrackingByOrderId"

    headers = {"Authorization": _auth_header(username, license_key)}
    params = {"order_id": order_id}

    logger.info(f"[Shipway] → get_tracking: order={order_id}")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers, params=params)
            logger.info(f"[Shipway] ← get_tracking HTTP {resp.status_code}")
            return resp.json()
    except Exception as exc:
        logger.error(f"[Shipway] get_tracking exception: {exc}")
        return {"error": str(exc)}


# ── Webhook Status Normalizer ─────────────────────────────────────────────────

SHIPWAY_STATUS_MAP: Dict[str, str] = {
    # Picked up
    "Picked Up": "PICKED_UP",
    "Shipment Picked Up": "PICKED_UP",
    "PP": "PICKED_UP",
    # In transit
    "In Transit": "IN_TRANSIT",
    "Reached at Hub": "IN_TRANSIT",
    "IT": "IN_TRANSIT",
    # Out for delivery
    "Out For Delivery": "OUT_FOR_DELIVERY",
    "Out for Delivery": "OUT_FOR_DELIVERY",
    "OD": "OUT_FOR_DELIVERY",
    # Delivered
    "Delivered": "DELIVERED",
    "DL": "DELIVERED",
    "DEL": "DELIVERED",
    # RTO
    "RTO": "RTO",
    "RTO Initiated": "RTO",
    "Return to Origin": "RTO",
    "RT": "RTO",
    # Undelivered
    "Undelivered": "UNDELIVERED",
    "UD": "UNDELIVERED",
    # Cancelled
    "Cancelled": "CANCELLED",
    # Exception
    "Exception": "DELIVERY_EXCEPTION",
    "Delivery Exception": "DELIVERY_EXCEPTION",
    "EX": "DELIVERY_EXCEPTION",
}


def parse_webhook_status(payload: Dict[str, Any]) -> str:
    """Normalise a Shipway webhook payload status to our internal status code."""
    raw = (
        payload.get("current_status")
        or payload.get("current_status_body")
        or payload.get("Status")
        or payload.get("status")
        or payload.get("api_input", {}).get("current_status")
        or payload.get("api_input", {}).get("current_status_desc")
        or "UNKNOWN"
    )
    return SHIPWAY_STATUS_MAP.get(str(raw), str(raw).upper().replace(" ", "_"))
