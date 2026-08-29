import json
import logging
import io
import zipfile
import httpx
from datetime import datetime
from typing import Optional, List, Union

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, File, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel
from pypdf import PdfWriter

from config import TABLE_IDS, SITE_URL
from services.baserow import BaserowClient
from services.shipway import request_pickup, create_shipment
from services.whatsapp import send_pickup_requested

logger = logging.getLogger(__name__)
router = APIRouter()
client = BaserowClient()


class OrderStatusUpdate(BaseModel):
    order_status: str


class DownloadLabelsRequest(BaseModel):
    order_ids: Optional[List[Union[str, int]]] = None


class DownloadLabelsPdfRequest(BaseModel):
    order_ids: Optional[List[Union[str, int]]] = None
    status_filter: Optional[str] = "ready_to_pack"


@router.post("/download-labels-zip", summary="Bulk download shipping label PDFs in a ZIP file")
async def download_labels_zip(payload: DownloadLabelsRequest):
    """
    Downloads shipping label PDFs server-side for requested order_ids (or all orders if empty).
    If a label URL is expired (S3 403) or missing, automatically re-registers/fetches a fresh label from Shipway.
    """
    rows = await client.get_rows(TABLE_IDS["orders"], size=200, order_by="-order_date")
    standard_orders = rows.get("results", [])

    bulk_orders_mapped = []
    try:
        from routers.bulk_orders import _normalize_bulk_row
        bulk_res = await client.get_rows(TABLE_IDS["bulk_orders"], size=100)
        for r in bulk_res.get("results", []):
            norm = _normalize_bulk_row(r)
            if norm.get("status") in ["approved", "partially_paid", "fully_paid", "shipped"]:
                mapped = _map_bulk_to_standard_order(norm)
                bulk_orders_mapped.append(mapped)
    except Exception as e:
        logger.error(f"[Orders] Error merging bulk orders in download_zip: {e}")

    all_orders = list(standard_orders) + bulk_orders_mapped

    if payload.order_ids:
        target_ids = set(str(oid) for oid in payload.order_ids)
        target_orders = [
            o for o in all_orders 
            if str(o.get("id")) in target_ids or str(o.get("order_id")) in target_ids
        ]
    else:
        target_orders = all_orders

    zip_buffer = io.BytesIO()
    count = 0

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as http_client:
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for order in target_orders:
                delivery_raw = order.get("delivery") or "{}"
                try:
                    delivery_data = json.loads(delivery_raw) if isinstance(delivery_raw, str) else (delivery_raw or {})
                except Exception:
                    delivery_data = {}

                label_url = delivery_data.get("label_url")
                order_id_str = order.get("order_id") or f"BOOK{order.get('id')}"

                pdf_bytes = None
                if label_url:
                    try:
                        resp = await http_client.get(label_url, headers={
                            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        })
                        if resp.status_code == 200 and resp.content.startswith(b"%PDF"):
                            pdf_bytes = resp.content
                    except Exception as exc:
                        logger.warning(f"[Orders] Label fetch warning for order {order_id_str}: {exc}")

                # If missing or expired (S3 403), auto-generate via Shipway
                if not pdf_bytes:
                    try:
                        user_info_raw = order.get("user_info") or "{}"
                        user_info = json.loads(user_info_raw) if isinstance(user_info_raw, str) else (user_info_raw or {})
                        address_obj = user_info.get("address") if isinstance(user_info.get("address"), dict) else {}
                        
                        items_raw = order.get("items") or "[]"
                        items = json.loads(items_raw) if isinstance(items_raw, str) else (items_raw or [])

                        ship_payload = {
                            "order_id": order_id_str,
                            "order_date": (order.get("order_date") or "").split(" ")[0] or datetime.now().strftime("%Y-%m-%d"),
                            "total_amount": order.get("total_amount") or 0,
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
                        
                        ship_res = await create_shipment(ship_payload)
                        if ship_res.get("success") and ship_res.get("label_url"):
                            new_label_url = ship_res["label_url"]
                            delivery_data.update({
                                "shipment_id": ship_res.get("shipment_id"),
                                "awb": ship_res.get("awb"),
                                "courier": ship_res.get("courier_name"),
                                "carrier_id": ship_res.get("carrier_id"),
                                "tracking_url": ship_res.get("tracking_url"),
                                "label_url": new_label_url,
                            })
                            if order.get("is_bulk"):
                                bulk_id = int(str(order["id"]).split("_")[1])
                                from routers.bulk_orders import _normalize_bulk_row, _save_bulk_data
                                bulk_row = await client.get_row(TABLE_IDS["bulk_orders"], bulk_id)
                                norm = _normalize_bulk_row(bulk_row)
                                norm["shipway_awb"] = ship_res.get("awb")
                                norm["shipment_id"] = ship_res.get("shipment_id")
                                norm["label_url"] = new_label_url
                                await _save_bulk_data(bulk_id, norm)
                            else:
                                await client.update_row(TABLE_IDS["orders"], order["id"], {"delivery": json.dumps(delivery_data)})
                            
                            r_new = await http_client.get(new_label_url)
                            if r_new.status_code == 200 and r_new.content.startswith(b"%PDF"):
                                pdf_bytes = r_new.content
                    except Exception as exc:
                        logger.warning(f"[Orders] Auto-create shipment failed for order {order_id_str}: {exc}")

                if pdf_bytes:
                    filename = f"shipping_label_{order_id_str}.pdf"
                    zip_file.writestr(filename, pdf_bytes)
                    count += 1

    if count == 0:
        raise HTTPException(status_code=400, detail="No valid shipping label PDFs could be generated or fetched for the selected orders.")

    zip_buffer.seek(0)
    headers = {
        "Content-Disposition": 'attachment; filename="shipping_labels.zip"',
        "X-Downloaded-Count": str(count),
    }
    return Response(content=zip_buffer.getvalue(), media_type="application/zip", headers=headers)


@router.post("/download-labels-pdf", summary="Bulk download combined Ready to Pack shipping labels PDF")
async def download_labels_pdf(payload: DownloadLabelsPdfRequest):
    """
    Fetches shipping label PDFs for target orders (or all orders in READY_TO_PACK status),
    merges them into a single multi-page PDF document using pypdf, and returns application/pdf.
    """
    rows = await client.get_rows(TABLE_IDS["orders"], size=200, order_by="-order_date")
    standard_orders = rows.get("results", [])

    bulk_orders_mapped = []
    try:
        from routers.bulk_orders import _normalize_bulk_row
        bulk_res = await client.get_rows(TABLE_IDS["bulk_orders"], size=100)
        for r in bulk_res.get("results", []):
            norm = _normalize_bulk_row(r)
            if norm.get("status") in ["approved", "partially_paid", "fully_paid", "shipped"]:
                mapped = _map_bulk_to_standard_order(norm)
                bulk_orders_mapped.append(mapped)
    except Exception as e:
        logger.error(f"[Orders] Error merging bulk orders in download_pdf: {e}")

    all_orders = list(standard_orders) + bulk_orders_mapped

    if payload.order_ids:
        target_ids = set(str(oid) for oid in payload.order_ids)
        target_orders = [
            o for o in all_orders 
            if str(o.get("id")) in target_ids or str(o.get("order_id")) in target_ids
        ]
    else:
        target_orders = [
            o for o in all_orders 
            if (o.get("order_status") or o.get("status") or "").lower().replace(" ", "_") in ("ready_to_pack", "ready_to_pack")
        ]

    if not target_orders:
        raise HTTPException(status_code=400, detail="No orders found in 'Ready to Pack' status.")

    writer = PdfWriter()
    count = 0

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as http_client:
        for order in target_orders:
            delivery_raw = order.get("delivery") or "{}"
            try:
                delivery_data = json.loads(delivery_raw) if isinstance(delivery_raw, str) else (delivery_raw or {})
            except Exception:
                delivery_data = {}

            label_url = delivery_data.get("label_url")
            order_id_str = order.get("order_id") or f"BOOK{order.get('id')}"

            pdf_bytes = None
            if label_url:
                try:
                    resp = await http_client.get(label_url, headers={
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    })
                    if resp.status_code == 200 and resp.content.startswith(b"%PDF"):
                        pdf_bytes = resp.content
                except Exception as exc:
                    logger.warning(f"[Orders PDF] Label fetch warning for {order_id_str}: {exc}")

            # Auto-generate via Shipway if label_url missing or expired (S3 403)
            if not pdf_bytes:
                try:
                    user_info_raw = order.get("user_info") or "{}"
                    user_info = json.loads(user_info_raw) if isinstance(user_info_raw, str) else (user_info_raw or {})
                    address_obj = user_info.get("address") if isinstance(user_info.get("address"), dict) else {}
                    items_raw = order.get("items") or "[]"
                    items = json.loads(items_raw) if isinstance(items_raw, str) else (items_raw or [])

                    ship_payload = {
                        "order_id": order_id_str,
                        "order_date": (order.get("order_date") or "").split(" ")[0] or datetime.now().strftime("%Y-%m-%d"),
                        "total_amount": order.get("total_amount") or 0,
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
                    
                    ship_res = await create_shipment(ship_payload)
                    if ship_res.get("success") and ship_res.get("label_url"):
                        new_label_url = ship_res["label_url"]
                        delivery_data.update({
                            "shipment_id": ship_res.get("shipment_id"),
                            "awb": ship_res.get("awb"),
                            "courier": ship_res.get("courier_name"),
                            "carrier_id": ship_res.get("carrier_id"),
                            "tracking_url": ship_res.get("tracking_url"),
                            "label_url": new_label_url,
                        })
                        if order.get("is_bulk"):
                            bulk_id = int(str(order["id"]).split("_")[1])
                            from routers.bulk_orders import _normalize_bulk_row, _save_bulk_data
                            bulk_row = await client.get_row(TABLE_IDS["bulk_orders"], bulk_id)
                            norm = _normalize_bulk_row(bulk_row)
                            norm["shipway_awb"] = ship_res.get("awb")
                            norm["shipment_id"] = ship_res.get("shipment_id")
                            norm["label_url"] = new_label_url
                            await _save_bulk_data(bulk_id, norm)
                        else:
                            await client.update_row(TABLE_IDS["orders"], order["id"], {"delivery": json.dumps(delivery_data)})
                        
                        r_new = await http_client.get(new_label_url)
                        if r_new.status_code == 200 and r_new.content.startswith(b"%PDF"):
                            pdf_bytes = r_new.content
                except Exception as exc:
                    logger.warning(f"[Orders PDF] Auto-create shipment failed for {order_id_str}: {exc}")

            if pdf_bytes:
                try:
                    stream = io.BytesIO(pdf_bytes)
                    writer.append(stream)
                    count += 1
                except Exception as exc:
                    logger.warning(f"[Orders PDF] Failed to append PDF for {order_id_str}: {exc}")

    if count == 0:
        raise HTTPException(status_code=400, detail="No valid shipping label PDFs could be generated or merged for Ready to Pack orders.")

    output_stream = io.BytesIO()
    writer.write(output_stream)
    merged_bytes = output_stream.getvalue()
    output_stream.close()

    headers = {
        "Content-Disposition": 'attachment; filename="ready_to_pack_shipping_labels.pdf"',
        "X-Downloaded-Count": str(count),
    }
    return Response(content=merged_bytes, media_type="application/pdf", headers=headers)


class BulkPickupRequest(BaseModel):
    order_ids: Optional[List[str]] = None


@router.post("/bulk-request-pickup", summary="Bulk request courier pickup for Ready to Pack orders")
async def bulk_request_pickup(payload: BulkPickupRequest, background_tasks: BackgroundTasks):
    """
    Finds all orders in READY_TO_PACK status (or matching passed order_ids),
    requests pickup via Shipway, sends WhatsApp notifications, and updates status to PICKUP_REQUESTED.
    """
    rows = await client.get_rows(TABLE_IDS["orders"], size=200, order_by="-order_date")
    standard_orders = rows.get("results", [])

    bulk_orders_mapped = []
    try:
        from routers.bulk_orders import _normalize_bulk_row
        bulk_res = await client.get_rows(TABLE_IDS["bulk_orders"], size=100)
        for r in bulk_res.get("results", []):
            norm = _normalize_bulk_row(r)
            if norm.get("status") in ["approved", "partially_paid", "fully_paid", "shipped"]:
                mapped = _map_bulk_to_standard_order(norm)
                bulk_orders_mapped.append(mapped)
    except Exception as e:
        logger.error(f"[Orders] Error merging bulk orders in bulk_request_pickup: {e}")

    all_orders = list(standard_orders) + bulk_orders_mapped

    if payload.order_ids:
        target_ids = set(str(oid) for oid in payload.order_ids)
        target_orders = [
            o for o in all_orders 
            if str(o.get("id")) in target_ids or str(o.get("order_id")) in target_ids
        ]
    else:
        target_orders = [
            o for o in all_orders 
            if (o.get("order_status") or o.get("status") or "").lower().replace(" ", "_") in ("ready_to_pack", "ready_to_pack")
        ]

    if not target_orders:
        raise HTTPException(status_code=400, detail="No orders found in 'Ready to Pack' status to request pickup.")

    success_count = 0
    failed_count = 0

    for order in target_orders:
        order_id_str = order.get("order_id") or f"BOOK{order.get('id')}"
        row_id = order["id"]

        delivery_raw = order.get("delivery") or "{}"
        try:
            delivery_data = json.loads(delivery_raw) if isinstance(delivery_raw, str) else (delivery_raw or {})
        except Exception:
            delivery_data = {}

        # Get or create shipment
        shipment_id = delivery_data.get("shipment_id") or delivery_data.get("awb")
        if not shipment_id:
            try:
                user_info_raw = order.get("user_info") or "{}"
                user_info = json.loads(user_info_raw) if isinstance(user_info_raw, str) else (user_info_raw or {})
                address_obj = user_info.get("address") if isinstance(user_info.get("address"), dict) else {}
                items_raw = order.get("items") or "[]"
                items = json.loads(items_raw) if isinstance(items_raw, str) else (items_raw or [])

                ship_payload = {
                    "order_id": order_id_str,
                    "order_date": (order.get("order_date") or "").split(" ")[0] or datetime.now().strftime("%Y-%m-%d"),
                    "total_amount": order.get("total_amount") or 0,
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
                
                ship_res = await create_shipment(ship_payload)
                if ship_res.get("success"):
                    shipment_id = ship_res.get("shipment_id") or ship_res.get("awb")
                    delivery_data.update({
                        "shipment_id": ship_res.get("shipment_id"),
                        "awb": ship_res.get("awb"),
                        "courier": ship_res.get("courier_name"),
                        "carrier_id": ship_res.get("carrier_id"),
                        "tracking_url": ship_res.get("tracking_url"),
                        "label_url": ship_res.get("label_url"),
                    })
            except Exception as exc:
                logger.error(f"[Bulk Pickup] Shipment create failed for {order_id_str}: {exc}")

        # Request pickup via Shipway
        pickup_res = {"success": True}
        if shipment_id:
            try:
                pickup_res = await request_pickup(shipment_id)
            except Exception as exc:
                logger.error(f"[Bulk Pickup] Shipway request_pickup exception for {order_id_str}: {exc}")

        # Update order status to PICKUP_REQUESTED
        now_iso = datetime.now().isoformat()
        delivery_data["status"] = "PICKUP_REQUESTED"
        delivery_data["pickup_requested_at"] = now_iso
        if pickup_res.get("pickup_token"):
            delivery_data["pickup_token"] = pickup_res["pickup_token"]

        try:
            if order.get("is_bulk"):
                bulk_id = int(str(order["id"]).split("_")[1])
                from routers.bulk_orders import _normalize_bulk_row, _save_bulk_data
                bulk_row = await client.get_row(TABLE_IDS["bulk_orders"], bulk_id)
                norm = _normalize_bulk_row(bulk_row)
                norm["status"] = "shipped"
                norm["shipway_awb"] = delivery_data.get("awb")
                norm["shipment_id"] = delivery_data.get("shipment_id")
                norm["label_url"] = delivery_data.get("label_url")
                await _save_bulk_data(bulk_id, norm)
            else:
                await client.update_row(
                    TABLE_IDS["orders"],
                    row_id,
                    {
                        "order_status": "PICKUP_REQUESTED",
                        "delivery": json.dumps(delivery_data),
                    },
                )
            success_count += 1

            # Background task: WhatsApp notification
            user_info_raw = order.get("user_info") or "{}"
            user_info = json.loads(user_info_raw) if isinstance(user_info_raw, str) else (user_info_raw or {})
            cust_phone = user_info.get("phone") or ""
            cust_name = user_info.get("name") or "Customer"
            tracking_url = delivery_data.get("tracking_url") or f"https://cremsonpublications.shipway.com/tracking/forward/{delivery_data.get('awb', '')}/"

            if cust_phone:
                if order.get("is_bulk"):
                    from services.whatsapp import send_bulk_order_shipped
                    background_tasks.add_task(
                        send_bulk_order_shipped,
                        phone=cust_phone,
                        name=cust_name,
                        school=order.get("school_name", "School"),
                        awb=delivery_data.get("awb"),
                        tracking_link=tracking_url,
                        order_link=f"{SITE_URL}/bulk-order/{norm['token']}"
                    )
                else:
                    background_tasks.add_task(
                        _notify_pickup_requested,
                        phone=cust_phone,
                        name=cust_name,
                        order_id=order_id_str,
                        tracking_url=tracking_url,
                    )
        except Exception as exc:
            logger.error(f"[Bulk Pickup] Baserow update failed for {order_id_str}: {exc}")
            failed_count += 1

    return {
        "success": True,
        "processed_count": len(target_orders),
        "success_count": success_count,
        "failed_count": failed_count,
        "message": f"Successfully requested pickup & notified WhatsApp for {success_count} order(s).",
    }


# ── List / Get / Patch (unchanged) ────────────────────────────────────────────


async def _get_bulk_order_by_order_id(order_id: str) -> Optional[dict]:
    """Look up a bulk order by its parsed order_id from the Notes JSON string."""
    try:
        bulk_rows = await client.get_rows(TABLE_IDS["bulk_orders"], search=order_id)
        for r in bulk_rows.get("results", []):
            try:
                notes_raw = r.get("Notes") or ""
                if isinstance(notes_raw, str) and notes_raw.strip():
                    notes_data = json.loads(notes_raw)
                    if notes_data.get("order_id") == order_id:
                        return r
            except Exception:
                continue
    except Exception as exc:
        logger.error(f"Error querying bulk orders by order_id '{order_id}': {exc}")
    return None


def _map_bulk_to_standard_order(bulk: dict) -> dict:
    items = []
    for item in bulk.get("items", []):
        qty = int(item.get("qty", 1))
        items.append({
            "product_id": item.get("product_id"),
            "title": item.get("title"),
            "name": item.get("title"),
            "quantity": qty,
            "qty": qty,
            "price": float(item.get("price", 0)),
        })
        
    user_info = {
        "name": bulk.get("contact_name", "Teacher"),
        "email": bulk.get("email") or "info@cremsonpublications.com",
        "phone": bulk.get("phone", ""),
        "address": {
            "street": bulk.get("address", ""),
            "city": bulk.get("city", ""),
            "state": bulk.get("state", ""),
            "pincode": bulk.get("pincode", ""),
        },
        "school_name": bulk.get("school_name", "")
    }
    
    order_summary = {
        "subtotal": float(bulk.get("subtotal", 0)),
        "discount": float(bulk.get("subtotal", 0)) - float(bulk.get("final_amount", 0)),
        "grandTotal": float(bulk.get("final_amount", 0))
    }
    
    bulk_status = bulk.get("status", "")
    if bulk_status == "shipped":
        order_status = "SHIPPED"
    elif bulk_status == "pickup_requested":
        order_status = "PICKUP_REQUESTED"
    elif bulk_status in ["fully_paid", "approved", "partially_paid"]:
        order_status = "READY_TO_PACK"
    else:
        order_status = "PENDING"
        
    payment = {
        "amount": float(bulk.get("final_amount", 0)),
        "method": "Razorpay (Bulk Split)" if bulk.get("split_count", 0) > 0 else "Razorpay",
        "status": "Paid" if bulk_status in ["fully_paid", "shipped", "pickup_requested"] else "Partially Paid" if bulk_status == "partially_paid" else "Unpaid",
        "transactionId": bulk.get("razorpay_payment_id") or ""
    }
    
    delivery = {
        "notes": bulk.get("admin_notes", ""),
        "status": "Shipped" if bulk_status == "shipped" else "Pickup Requested" if bulk_status == "pickup_requested" else "Confirmed",
        "awb": bulk.get("shipway_awb") or "",
        "tracking_url": f"https://shipway.in/track/{bulk.get('shipway_awb')}" if bulk.get("shipway_awb") else "",
        "label_url": bulk.get("label_url") or "",
        "return_status": bulk.get("return_status"),
        "return_reason": bulk.get("return_reason"),
        "return_notes": bulk.get("return_notes"),
        "reverse_awb": bulk.get("reverse_awb"),
        "reverse_tracking_url": bulk.get("reverse_tracking_url"),
        "refund_status": bulk.get("refund_status"),
        "refund_amount": bulk.get("refund_amount"),
        "refund_id": bulk.get("refund_id"),
        "refunded_at": bulk.get("refunded_at"),
    }
    
    order_date = bulk.get("order_date") or ""
    if "T" in order_date:
        order_date = order_date.replace("T", " ").split(".")[0]
        
    return {
        "id": f"bulk_{bulk.get('id')}",
        "order_id": bulk.get("order_id"),
        "order_status": order_status,
        "order_date": order_date,
        "user_info": json.dumps(user_info),
        "items": json.dumps(items),
        "order_summary": json.dumps(order_summary),
        "payment": json.dumps(payment),
        "delivery": json.dumps(delivery),
        "shipment_id": "",
        "awb": bulk.get("shipway_awb") or "",
        "courier": "Shipway",
        "tracking_url": f"https://shipway.in/track/{bulk.get('shipway_awb')}" if bulk.get("shipway_awb") else "",
        "label_url": bulk.get("label_url") or "",
        "is_bulk": True,
        "school_name": bulk.get("school_name", "")
    }


@router.get("/", summary="List orders")
async def list_orders(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
    order_status: str = Query(None, description="Filter by order status value"),
    user_id: str = Query(None, description="Filter orders by user ID"),
    email: str = Query(None, description="Filter orders by user email"),
    start_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(None, description="End date (YYYY-MM-DD)"),
):
    filters = {}
    if order_status is not None:
        status_map = {
            "ready_to_pack": "READY_TO_PACK",
            "pickup_requested": "PICKUP_REQUESTED",
            "return_initiated": "RETURN_INITIATED",
            "confirmed": "Confirmed",
            "shipped": "Shipped",
            "delivered": "Delivered",
            "pending": "pending",
            "cancelled": "Cancelled",
            "refunded": "Refunded"
        }
        mapped_status = status_map.get(order_status.lower(), order_status)
        filters["order_status"] = mapped_status

    contains_filters = {}
    if email is not None:
        contains_filters["user_info"] = f'"email": "{email}"'
    elif user_id is not None:
        contains_filters["user_info"] = f'"userId": {user_id}'

    # Fetch standard orders
    is_python_filtered = bool(start_date and end_date) or bool(search)
    fetch_size = 200 if is_python_filtered else size
    orders_res = await client.get_rows(
        TABLE_IDS["orders"],
        page=page if not is_python_filtered else 1,
        size=fetch_size,
        search=None if is_python_filtered else search,
        filters=filters if filters else None,
        contains_filters=contains_filters if contains_filters else None,
        order_by="-order_date",
    )
    standard_orders = orders_res.get("results", [])

    # Filter standard orders by customer name in Python if search is active
    if search:
        filtered_by_name = []
        search_lower = search.lower()
        for o in standard_orders:
            u_info_raw = o.get("user_info") or "{}"
            try:
                u_info = json.loads(u_info_raw) if isinstance(u_info_raw, str) else (u_info_raw or {})
            except Exception:
                u_info = {}
            c_name = u_info.get("name") or o.get("user_name") or ""
            if search_lower in c_name.lower():
                filtered_by_name.append(o)
        standard_orders = filtered_by_name

    # Filter standard orders by date range in Python if active
    if start_date and end_date:
        filtered_std = []
        for o in standard_orders:
            o_date = o.get("order_date")
            if o_date:
                date_part = o_date.split(" ")[0]
                if start_date <= date_part <= end_date:
                    filtered_std.append(o)
        standard_orders = filtered_std

    if is_python_filtered:
        total_standard_count = len(standard_orders)
        # Paginate standard orders manually
        standard_orders = standard_orders[(page - 1) * size: page * size]
    else:
        total_standard_count = orders_res.get("count", 0)

    # Fetch and merge bulk orders (only on the first page to keep pagination clean)
    bulk_orders_mapped = []
    if not user_id and not email and page == 1:
        try:
            from routers.bulk_orders import _normalize_bulk_row
            bulk_res = await client.get_rows(
                TABLE_IDS["bulk_orders"],
                size=100,
                search=None
            )
            for r in bulk_res.get("results", []):
                norm = _normalize_bulk_row(r)
                if norm.get("status") in ["approved", "partially_paid", "fully_paid", "shipped"]:
                    mapped = _map_bulk_to_standard_order(norm)
                    
                    # Apply search filter by customer name to bulk orders
                    if search:
                        c_name = mapped.get("customer_name") or norm.get("contact_name") or norm.get("full_name") or ""
                        if search.lower() not in c_name.lower():
                            continue

                    # Apply date filtering to bulk orders if specified
                    if start_date and end_date:
                        b_date = mapped.get("order_date")
                        if b_date:
                            date_part = b_date.split(" ")[0]
                            if not (start_date <= date_part <= end_date):
                                continue

                    if order_status:
                        if mapped["order_status"].lower() == order_status.lower():
                            bulk_orders_mapped.append(mapped)
                    else:
                        bulk_orders_mapped.append(mapped)
        except Exception as e:
            logger.error(f"[Orders] Error merging bulk orders: {e}")

    # Fetch and merge specimen requests (pending/rejected ones not yet in Table 762)
    specimen_orders_mapped = []
    if not user_id and not email and page == 1:
        try:
            # Build set of existing SPEC order IDs already in Table 762 (approved ones)
            approved_spec_ids = set()
            for o in list(standard_orders) + bulk_orders_mapped:
                oid = str(o.get("order_id") or "")
                if oid.startswith("SPEC-"):
                    approved_spec_ids.add(oid)

            spec_res = await client.get_rows(
                TABLE_IDS["specimen_requests"],
                size=200,
                order_by="-SpecimenID",
            )

            def _extract_val(v):
                if isinstance(v, list):
                    return " ".join(str(i.get("value", "")) if isinstance(i, dict) else str(i) for i in v).strip()
                if isinstance(v, dict):
                    return str(v.get("value", "")).strip()
                return str(v or "").strip()

            spec_status_map = {
                "pending": "pending",
                "dispatched": "dispatched",
                "rto": "rto",
                "rejected": "rto",
                "approved": "dispatched",
            }

            for sr in spec_res.get("results", []):
                spec_row_id = sr.get("id") or sr.get("SpecimenID")
                potential_order_id = f"SPEC-{spec_row_id}"

                # Skip if this request is already approved and has an order in Table 762
                if potential_order_id in approved_spec_ids:
                    continue

                raw_status = _extract_val(sr.get("DeliveryStatus") or "Pending").lower()
                mapped_status = spec_status_map.get(raw_status, raw_status)

                # Apply order_status filter if set
                if order_status:
                    filter_key = order_status.lower()
                    if filter_key not in ("pending", "dispatched", "rto") or mapped_status != filter_key:
                        # Only include specimen rows if the filter matches their status
                        if mapped_status != filter_key:
                            continue

                teacher_name = _extract_val(sr.get("Teacheer Name")) or _extract_val(sr.get("Teacher Name")) or ""
                email_val = _extract_val(sr.get("Email")) or ""
                phone_val = _extract_val(sr.get("Phone")) or ""
                school_val = _extract_val(sr.get("School Name")) or ""
                city_val = _extract_val(sr.get("City")) or ""
                pincode_val = _extract_val(sr.get("PinCode")) or ""
                full_address = sr.get("Full_Address") or ""
                books_requested = sr.get("BooksRequested") or ""
                created_at = sr.get("created_on") or sr.get("CreatedOn") or ""

                # Apply search filter
                if search:
                    search_lower = search.lower()
                    if (search_lower not in teacher_name.lower() and
                        search_lower not in school_val.lower() and
                        search_lower not in phone_val.lower()):
                        continue

                # Apply date filter
                if start_date and end_date and created_at:
                    date_part = str(created_at).split("T")[0].split(" ")[0]
                    if not (start_date <= date_part <= end_date):
                        continue

                user_info = json.dumps({
                    "name": teacher_name or "Teacher",
                    "email": email_val,
                    "phone": phone_val,
                    "school": school_val,
                    "address": {
                        "street": full_address or school_val,
                        "city": city_val,
                        "pincode": pincode_val,
                        "country": "India"
                    }
                })

                payment = json.dumps({
                    "method": "SPECIMEN (Free)",
                    "status": "Specimen Copy",
                    "amount": 0
                })

                specimen_orders_mapped.append({
                    "id": f"spec_req_{spec_row_id}",
                    "order_id": f"SPEC-REQ-{spec_row_id}",
                    "order_status": mapped_status,
                    "order_date": created_at,
                    "user_info": user_info,
                    "items": json.dumps([{"name": b.strip(), "quantity": 1} for b in books_requested.split(",") if b.strip()]),
                    "order_summary": json.dumps({"grandTotal": 0}),
                    "payment": payment,
                    "delivery": json.dumps({"status": mapped_status}),
                    "total_amount": 0,
                    "payment_status": "Specimen Copy",
                    "is_specimen_request": True,
                    "specimen_request_id": spec_row_id,
                    "books_requested": books_requested,
                    "school_name": school_val,
                })
        except Exception as e:
            logger.error(f"[Orders] Error merging specimen requests: {e}")

    # Merge and sort
    all_merged = list(standard_orders) + bulk_orders_mapped + specimen_orders_mapped
    all_merged.sort(key=lambda o: o.get("order_date") or "", reverse=True)

    return {
        "count": total_standard_count + len(bulk_orders_mapped) + len(specimen_orders_mapped),
        "results": all_merged
    }


@router.get("/{row_id}", summary="Get a single order by Baserow row ID")
async def get_order(row_id: str):
    """Return a single order by Baserow row ID."""
    if str(row_id).startswith("bulk_"):
        bulk_id = int(str(row_id).split("_")[1])
        row = await client.get_row(TABLE_IDS["bulk_orders"], bulk_id)
        if not row:
            raise HTTPException(status_code=404, detail="Bulk order not found")
        from routers.bulk_orders import _normalize_bulk_row
        norm = _normalize_bulk_row(row)
        return _map_bulk_to_standard_order(norm)
    else:
        return await client.get_row(TABLE_IDS["orders"], int(row_id))


@router.patch("/{row_id}", summary="Update order status by Baserow row ID")
async def update_order(row_id: str, body: OrderStatusUpdate):
    if str(row_id).startswith("bulk_"):
        bulk_id = int(str(row_id).split("_")[1])
        row = await client.get_row(TABLE_IDS["bulk_orders"], bulk_id)
        if not row:
            raise HTTPException(status_code=404, detail="Bulk order not found")
        from routers.bulk_orders import _normalize_bulk_row, _save_bulk_data
        norm = _normalize_bulk_row(row)
        
        std_status = body.order_status
        if std_status == "SHIPPED":
            norm["status"] = "shipped"
        elif std_status == "PICKUP_REQUESTED":
            norm["status"] = "pickup_requested"
        elif std_status == "READY_TO_PACK":
            norm["status"] = "fully_paid"
            
        await _save_bulk_data(bulk_id, norm)
        return {"success": True, "detail": "Bulk order status updated"}
    else:
        return await client.update_row(TABLE_IDS["orders"], int(row_id), body.model_dump(exclude_none=True))


# ── Admin action: Packed & Ready for Pickup ───────────────────────────────────


async def _notify_pickup_requested(
    phone: str,
    name: str,
    order_id: str,
    tracking_url: str,
) -> None:
    """Background task: send WhatsApp after marking pickup requested."""
    try:
        await send_pickup_requested(
            phone=phone,
            customer_name=name,
            order_id=order_id,
            tracking_url=tracking_url,
        )
    except Exception as exc:
        logger.error(f"[Orders] send_pickup_requested WhatsApp error: {exc}")


@router.post(
    "/{order_id}/ready-for-pickup",
    summary="Admin: Mark order as packed and request courier pickup",
)
async def ready_for_pickup(order_id: str, background_tasks: BackgroundTasks):
    """
    Called when admin clicks 'Packed & Ready for Pickup'.
    1. Finds the order by order_id string (e.g. BOOK5)
    2. Validates status is READY_TO_PACK
    3. Calls Shipway request_pickup()
    4. Updates Baserow status → PICKUP_REQUESTED
    5. Sends WhatsApp to customer (background task)
    """
    # ── 1. Find order ─────────────────────────────────────────────────────────
    if order_id.startswith("BOOK") and order_id[4:].isdigit():
        try:
            row = await client.get_row(TABLE_IDS["orders"], int(order_id[4:]))
            results = [row] if row else []
        except Exception:
            results = []
    else:
        rows = await client.get_rows(TABLE_IDS["orders"], filters={"order_id": order_id})
        results = rows.get("results", [])
    is_bulk = False
    
    if not results:
        bulk_row = await _get_bulk_order_by_order_id(order_id)
        if not bulk_row:
            raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
        from routers.bulk_orders import _normalize_bulk_row
        bulk_norm = _normalize_bulk_row(bulk_row)
        order = _map_bulk_to_standard_order(bulk_norm)
        is_bulk = True
        row_id = bulk_norm["id"]
    else:
        order = results[0]
        row_id = order["id"]

    # ── 2. Guard: must be READY_TO_PACK ──────────────────────────────────────
    current_status = order.get("order_status", "")
    if current_status not in ("READY_TO_PACK", "Confirmed"):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Order {order_id} is in status '{current_status}'. "
                "Only READY_TO_PACK orders can be marked for pickup."
            ),
        )

    delivery_raw = order.get("delivery") or "{}"
    try:
        delivery_data = json.loads(delivery_raw) if isinstance(delivery_raw, str) else (delivery_raw or {})
    except Exception:
        delivery_data = {}

    shipment_id: str = delivery_data.get("shipment_id") or ""
    awb: str = delivery_data.get("awb") or ""
    carrier_id: str = delivery_data.get("carrier_id") or ""
    tracking_url: str = delivery_data.get("tracking_url") or ""

    if not shipment_id and not awb:
        logger.info(f"[Orders] Order {order_id} has no shipment_id/awb. Attempting shipment creation first...")
        
        # Build items description for Shipway
        items_raw = order.get("items") or "[]"
        try:
            items = json.loads(items_raw) if isinstance(items_raw, str) else (items_raw or [])
        except Exception:
            items = []

        items_desc = ", ".join(
            (i.get("name") or i.get("title") or "Book")
            for i in items
        ) if items else "Books"

        # Extract shipping address
        user_info_raw = order.get("user_info") or "{}"
        try:
            user_info = json.loads(user_info_raw) if isinstance(user_info_raw, str) else (user_info_raw or {})
        except Exception:
            user_info = {}

        user_address = user_info.get("address") or {}
        if not isinstance(user_address, dict):
            user_address = {}

        cust_name = delivery_data.get("name") or user_info.get("name", "")
        cust_email = delivery_data.get("email") or user_info.get("email", "")
        cust_phone = delivery_data.get("phone") or user_info.get("phone", "")

        addr = delivery_data.get("address") or user_address.get("street") or ""
        addr2 = delivery_data.get("address2") or user_address.get("apartment") or ""
        city = delivery_data.get("city") or user_address.get("city") or ""
        state = delivery_data.get("state") or user_address.get("state") or ""
        pincode = delivery_data.get("pincode") or user_address.get("pincode") or ""

        # Weight/dimensions
        weight = order.get("weight") or 0.5
        weight_grams = int(weight * 1000)

        # Check total amount
        order_summary_raw = order.get("order_summary") or "{}"
        try:
            order_summary = json.loads(order_summary_raw) if isinstance(order_summary_raw, str) else (order_summary_raw or {})
        except Exception:
            order_summary = {}
        total_amount = order_summary.get("grandTotal") or order.get("total_amount") or 0.0

        order_payload = {
            "order_id": order_id,
            "order_date": order.get("order_date") or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_amount": total_amount,
            "items": items,
            "items_description": items_desc,
            "customer_name": cust_name,
            "customer_email": cust_email,
            "customer_phone": cust_phone,
            "address": addr,
            "address2": addr2,
            "city": city,
            "state": state,
            "pincode": pincode,
            "weight_grams": weight_grams,
        }

        shipment_result = await create_shipment(order_payload)
        if not shipment_result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=f"Failed to auto-create Shipway shipment: {shipment_result.get('error', 'Unknown error')}"
            )

        # Store shipment details back to delivery_data
        shipment_id = shipment_result.get("shipment_id", "")
        awb = shipment_result.get("awb", "")
        carrier_id = shipment_result.get("carrier_id", "")
        tracking_url = shipment_result.get("tracking_url", "")
        label_url = shipment_result.get("label_url", "")

        delivery_data["shipment_id"] = shipment_id
        delivery_data["awb"] = awb
        delivery_data["courier"] = shipment_result.get("courier_name", "")
        delivery_data["carrier_id"] = carrier_id
        delivery_data["tracking_url"] = tracking_url
        delivery_data["label_url"] = label_url
        delivery_data["status"] = "Confirmed"

        # Update order in Baserow
        if is_bulk:
            from routers.bulk_orders import _normalize_bulk_row, _save_bulk_data
            bulk_row = await client.get_row(TABLE_IDS["bulk_orders"], row_id)
            norm = _normalize_bulk_row(bulk_row)
            norm["shipway_awb"] = awb
            norm["shipment_id"] = shipment_id
            norm["label_url"] = label_url
            await _save_bulk_data(row_id, norm)
        else:
            await client.update_row(TABLE_IDS["orders"], row_id, {
                "shipment_id": shipment_id,
                "awb": awb,
                "courier": shipment_result.get("courier_name", ""),
                "tracking_url": tracking_url,
                "label_url": label_url,
                "delivery": json.dumps(delivery_data),
            })
        logger.info(f"[Orders] Order {order_id} auto-registered in Shipway. AWB: {awb}")

    # ── 3. Request pickup from Shipway ────────────────────────────────────────
    pickup_result = await request_pickup(shipment_id, awb, order_id, carrier_id=carrier_id)
    logger.info(f"[Orders] Shipway pickup result for {order_id}: {pickup_result}")

    # ── 4. Update Baserow ─────────────────────────────────────────────────────
    now_iso = datetime.now().isoformat()
    delivery_data["status"] = "PICKUP_REQUESTED"
    delivery_data["pickup_requested_at"] = now_iso
    
    if is_bulk:
        from routers.bulk_orders import _normalize_bulk_row, _save_bulk_data
        bulk_row = await client.get_row(TABLE_IDS["bulk_orders"], row_id)
        norm = _normalize_bulk_row(bulk_row)
        norm["status"] = "pickup_requested"
        norm["shipway_awb"] = awb
        norm["shipment_id"] = shipment_id
        norm["label_url"] = delivery_data.get("label_url") or label_url
        await _save_bulk_data(row_id, norm)
    else:
        await client.update_row(TABLE_IDS["orders"], row_id, {
            "order_status": "PICKUP_REQUESTED",
            "pickup_requested_at": now_iso,
            "delivery": json.dumps(delivery_data),
        })
    logger.info(f"[Orders] Order {order_id} → PICKUP_REQUESTED")

    # ── 5. Notification (WhatsApp bypassed per request for pickup_requested) ─────
    logger.info(f"[Orders] Order {order_id} pickup requested in Shipway & Baserow (WhatsApp notification bypassed).")

    return {
        "success": True,
        "order_id": order_id,
        "status": "PICKUP_REQUESTED",
        "pickup_requested_at": now_iso,
        "shipway_response": pickup_result,
    }


# ── Admin action: Initiate Return (Reverse Pickup Only) ─────────────────────────


class ReturnOrderRequest(BaseModel):
    return_reason: str
    return_notes: Optional[str] = None
    returned_items: list[dict] = []


@router.post(
    "/{order_id}/return",
    summary="Admin: Initiate order return & schedule reverse pickup via Shipway",
)
async def return_order(order_id: str, body: ReturnOrderRequest):
    """
    Called when admin clicks 'Initiate Return' in Admin Dashboard.
    1. Finds order by order_id
    2. Schedules reverse shipment pickup via Shipway API (from customer address to warehouse)
    3. Updates order status → RETURN_INITIATED in Baserow with reverse_awb & tracking_url
    Does NOT issue Razorpay refund automatically.
    """
    from services.shipway import create_reverse_shipment

    if order_id.startswith("BOOK") and order_id[4:].isdigit():
        try:
            row = await client.get_row(TABLE_IDS["orders"], int(order_id[4:]))
            results = [row] if row else []
        except Exception:
            results = []
    else:
        rows = await client.get_rows(TABLE_IDS["orders"], filters={"order_id": order_id})
        results = rows.get("results", [])
    is_bulk = False
    
    if not results:
        bulk_row = await _get_bulk_order_by_order_id(order_id)
        if not bulk_row:
            raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
        from routers.bulk_orders import _normalize_bulk_row
        bulk_norm = _normalize_bulk_row(bulk_row)
        order = _map_bulk_to_standard_order(bulk_norm)
        is_bulk = True
        row_id = bulk_norm["id"]
    else:
        order = results[0]
        row_id = order["id"]

    delivery_raw = order.get("delivery") or "{}"
    try:
        delivery_data = json.loads(delivery_raw) if isinstance(delivery_raw, str) else (delivery_raw or {})
    except Exception:
        delivery_data = {}

    user_info_raw = order.get("user_info") or "{}"
    try:
        user_info = json.loads(user_info_raw) if isinstance(user_info_raw, str) else (user_info_raw or {})
    except Exception:
        user_info = {}

    order_summary_raw = order.get("order_summary") or "{}"
    try:
        order_summary = json.loads(order_summary_raw) if isinstance(order_summary_raw, str) else (order_summary_raw or {})
    except Exception:
        order_summary = {}

    total_amount = float(
        order_summary.get("grandTotal")
        or order.get("total_amount")
        or delivery_data.get("amount")
        or 0.0
    )

    user_address = user_info.get("address") or {}
    if not isinstance(user_address, dict):
        user_address = {}

    cust_name = delivery_data.get("name") or user_info.get("name", "Customer")
    cust_email = delivery_data.get("email") or user_info.get("email", "")
    cust_phone = delivery_data.get("phone") or user_info.get("phone", "")

    addr = delivery_data.get("address") or user_address.get("street") or ""
    addr2 = delivery_data.get("address2") or user_address.get("apartment") or ""
    city = delivery_data.get("city") or user_address.get("city") or ""
    state = delivery_data.get("state") or user_address.get("state") or ""
    pincode = delivery_data.get("pincode") or user_address.get("pincode") or ""

    weight = order.get("weight") or 0.5
    weight_grams = int(weight * 1000)

    reverse_order_payload = {
        "order_id": order_id,
        "total_amount": total_amount,
        "customer_name": cust_name,
        "customer_email": cust_email,
        "customer_phone": cust_phone,
        "address": addr,
        "address2": addr2,
        "city": city,
        "state": state,
        "pincode": pincode,
        "weight_grams": weight_grams,
        "items": body.returned_items,
    }

    reverse_result = await create_reverse_shipment(
        reverse_order_payload, reason=body.return_reason
    )

    now_iso = datetime.now().isoformat()
    delivery_data["return_status"] = "RETURN_INITIATED"
    delivery_data["return_initiated_at"] = now_iso
    delivery_data["return_reason"] = body.return_reason
    delivery_data["return_notes"] = body.return_notes or ""
    delivery_data["reverse_awb"] = reverse_result.get("reverse_awb", "")
    delivery_data["reverse_tracking_url"] = reverse_result.get("tracking_url", "")

    if is_bulk:
        from routers.bulk_orders import _normalize_bulk_row, _save_bulk_data
        try:
            bulk_row = await client.get_row(TABLE_IDS["bulk_orders"], row_id)
            norm = _normalize_bulk_row(bulk_row)
            norm["return_status"] = "RETURN_INITIATED"
            norm["return_initiated_at"] = now_iso
            norm["return_reason"] = body.return_reason
            norm["return_notes"] = body.return_notes or ""
            norm["reverse_awb"] = reverse_result.get("reverse_awb", "")
            norm["reverse_tracking_url"] = reverse_result.get("tracking_url", "")
            await _save_bulk_data(row_id, norm)
        except Exception as exc:
            logger.error(f"[Orders Return] Error updating bulk Baserow row {row_id}: {exc}")
    else:
        update_payload = {
            "delivery": json.dumps(delivery_data),
        }
        try:
            await client.update_row(TABLE_IDS["orders"], row_id, update_payload)
            
            # Create a child order for the return
            if body.returned_items:
                ret_order_id = f"RET-{order_id}"
                
                # Try to create the return order
                child_delivery = {
                    "reverse_shipment_id": reverse_result.get("reverse_shipment_id", ""),
                    "reverse_awb": reverse_result.get("reverse_awb", ""),
                    "tracking_url": reverse_result.get("tracking_url", ""),
                    "label_url": reverse_result.get("label_url", ""),
                    "status": "RETURN_INITIATED"
                }
                
                child_payload = {
                    "order_id": ret_order_id,
                    "order_status": "RETURN_INITIATED",
                    "order_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "user_info": order.get("user_info", "{}"),
                    "items": json.dumps(body.returned_items),
                    "order_summary": json.dumps({"is_partial_return": True, "parent_order": order_id}),
                    "payment": order.get("payment", "{}"),
                    "delivery": json.dumps(child_delivery)
                }
                
                await client.create_row(TABLE_IDS["orders"], child_payload)
                
                # Trigger WhatsApp Return Initiated Message
                label_url = reverse_result.get("label_url", "")
                if cust_phone and label_url:
                    from services.whatsapp import send_return_initiated
                    
                    try:
                        await send_return_initiated(
                            phone=cust_phone,
                            customer_name=cust_name,
                            order_id=order_id,
                            courier_name=reverse_result.get("courier_name", "Courier"),
                            label_url=label_url
                        )
                    except Exception as w_err:
                        logger.error(f"[Orders Return] WhatsApp Error for {order_id}: {w_err}")

        except Exception as exc:
            logger.error(f"[Orders Return] Error updating Baserow row {row_id} or creating return order: {exc}")

    return {
        "success": True,
        "order_id": order_id,
        "status": order.get("order_status", "Delivered"),
        "returned_at": now_iso,
        "reverse_shipment": reverse_result,
        "return_reason": body.return_reason,
        "return_notes": body.return_notes,
    }


# ── Admin action: Issue Razorpay Refund Only ──────────────────────────────────


class RefundOrderRequest(BaseModel):
    refund_amount: Optional[float] = None
    refund_reason: Optional[str] = "Customer refund requested"
    refund_notes: Optional[str] = None


@router.post(
    "/{order_id}/refund",
    summary="Admin: Issue Razorpay refund for an order",
)
async def refund_order(order_id: str, body: RefundOrderRequest):
    """
    Called when admin clicks 'Process Refund' in Admin Dashboard.
    1. Finds order by order_id
    2. Extracts Razorpay payment_id
    3. Calls Razorpay API to refund specified amount
    4. Updates delivery details with refund_id, refund_amount & refund_status
    Does NOT affect return shipment status.
    """
    from services.razorpay import issue_refund

    if order_id.startswith("BOOK") and order_id[4:].isdigit():
        try:
            row = await client.get_row(TABLE_IDS["orders"], int(order_id[4:]))
            results = [row] if row else []
        except Exception:
            results = []
    else:
        rows = await client.get_rows(TABLE_IDS["orders"], filters={"order_id": order_id})
        results = rows.get("results", [])
    is_bulk = False
    
    if not results:
        bulk_row = await _get_bulk_order_by_order_id(order_id)
        if not bulk_row:
            raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
        from routers.bulk_orders import _normalize_bulk_row
        bulk_norm = _normalize_bulk_row(bulk_row)
        order = _map_bulk_to_standard_order(bulk_norm)
        is_bulk = True
        row_id = bulk_norm["id"]
    else:
        order = results[0]
        row_id = order["id"]

    delivery_raw = order.get("delivery") or "{}"
    try:
        delivery_data = json.loads(delivery_raw) if isinstance(delivery_raw, str) else (delivery_raw or {})
    except Exception:
        delivery_data = {}

    payment_raw = order.get("payment") or "{}"
    try:
        payment_data = json.loads(payment_raw) if isinstance(payment_raw, str) else (payment_raw or {})
    except Exception:
        payment_data = {}

    user_info_raw = order.get("user_info") or "{}"
    try:
        user_info = json.loads(user_info_raw) if isinstance(user_info_raw, str) else (user_info_raw or {})
    except Exception:
        user_info = {}

    order_summary_raw = order.get("order_summary") or "{}"
    try:
        order_summary = json.loads(order_summary_raw) if isinstance(order_summary_raw, str) else (order_summary_raw or {})
    except Exception:
        order_summary = {}

    payment_id = (
        order.get("razorpay_payment_id")
        or payment_data.get("transactionId")
        or payment_data.get("payment_id")
        or payment_data.get("razorpay_payment_id")
        or delivery_data.get("transactionId")
        or delivery_data.get("payment_id")
        or user_info.get("payment_id")
        or ""
    )

    total_amount = float(
        order_summary.get("grandTotal")
        or order.get("total_amount")
        or payment_data.get("amount")
        or delivery_data.get("amount")
        or 0.0
    )
    refund_amt = body.refund_amount if (body.refund_amount and body.refund_amount > 0) else total_amount

    if not payment_id:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot process refund for order {order_id}: No Razorpay Payment ID found.",
        )

    refund_result = await issue_refund(
        payment_id=payment_id,
        amount_rupees=refund_amt,
        reason=body.refund_reason or "Admin requested refund",
        notes={
            "order_id": order_id,
            "reason": body.refund_reason or "",
            "notes": body.refund_notes or "",
        },
    )

    if not refund_result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=f"Razorpay Refund Failed: {refund_result.get('error', 'Unknown Razorpay error')}",
        )

    now_iso = datetime.now().isoformat()
    delivery_data["refund_id"] = refund_result.get("refund_id", "")
    delivery_data["refund_amount"] = refund_amt
    delivery_data["refund_status"] = "PROCESSED"
    delivery_data["refunded_at"] = now_iso
    delivery_data["refund_notes"] = body.refund_notes or ""

    if is_bulk:
        from routers.bulk_orders import _normalize_bulk_row, _save_bulk_data
        try:
            bulk_row = await client.get_row(TABLE_IDS["bulk_orders"], row_id)
            norm = _normalize_bulk_row(bulk_row)
            
            current_status = str(order.get("order_status") or "").upper()
            if current_status != "RETURN_INITIATED":
                norm["status"] = "refunded"
                
            norm["refund_id"] = refund_result.get("refund_id", "")
            norm["refund_amount"] = refund_amt
            norm["refund_status"] = "PROCESSED"
            norm["refunded_at"] = now_iso
            norm["refund_notes"] = body.refund_notes or ""
            await _save_bulk_data(row_id, norm)
        except Exception as exc:
            logger.error(f"[Orders Refund] Error updating bulk Baserow row {row_id}: {exc}")
    else:
        update_payload = {
            "delivery": json.dumps(delivery_data),
        }
        current_status = str(order.get("order_status") or "").upper()
        if current_status != "RETURN_INITIATED":
            update_payload["order_status"] = "REFUNDED"
        try:
            await client.update_row(TABLE_IDS["orders"], row_id, update_payload)
        except Exception as exc:
            logger.error(f"[Orders Refund] Error updating Baserow row {row_id}: {exc}")

    return {
        "success": True,
        "order_id": order_id,
        "refund_id": refund_result.get("refund_id"),
        "refund_amount": refund_amt,
        "refund_status": "PROCESSED",
        "refunded_at": now_iso,
        "refund_notes": body.refund_notes,
    }


@router.post("/{order_id}/upload-invoice")
async def upload_order_invoice(
    order_id: str,
    file: UploadFile = File(...),
):
    """
    Admin uploads a PDF tax invoice for a specific order.
    Saves the file, updates Baserow order record, and triggers WhatsApp invoice_available_v1 notification.
    """
    import os
    if not file.filename.lower().endswith(".pdf") and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed for tax invoices.")

    # 1. Save PDF file
    os.makedirs("uploads/invoices", exist_ok=True)
    filename = f"{order_id}_invoice.pdf"
    file_path = os.path.join("uploads/invoices", filename)
    
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    invoice_url = f"https://api.cremsonpublications.com/uploads/invoices/{filename}"

    # 2. Update Baserow order record
    order_row = None
    row_id = None
    
    if order_id.startswith("BOOK") and order_id[4:].isdigit():
        try:
            row = await client.get_row(TABLE_IDS["orders"], int(order_id[4:]))
            results = [row] if row else []
        except Exception:
            results = []
    else:
        rows = await client.get_rows(TABLE_IDS["orders"], filters={"order_id": order_id})
        results = rows.get("results", [])
    if results:
        order_row = results[0]
        row_id = order_row["id"]
    elif order_id.isdigit():
        try:
            order_row = await client.get_row(TABLE_IDS["orders"], int(order_id))
            row_id = order_row.get("id")
        except Exception:
            pass

    user_info = {}
    phone = ""
    name = "Customer"
    
    if order_row:
        user_info_raw = order_row.get("user_info", "{}")
        user_info = json.loads(user_info_raw) if isinstance(user_info_raw, str) else (user_info_raw or {})
        phone = user_info.get("phone") or user_info.get("whatsapp_phone") or ""
        name = user_info.get("name") or "Customer"
        
        # Save invoice_url in delivery JSON
        delivery_raw = order_row.get("delivery") or "{}"
        delivery_data = json.loads(delivery_raw) if isinstance(delivery_raw, str) else (delivery_raw or {})
        delivery_data["invoice_url"] = invoice_url
        
        await client.update_row(TABLE_IDS["orders"], row_id, {
            "delivery": json.dumps(delivery_data),
        })

    # 3. Send WhatsApp notification
    if phone:
        try:
            from services.whatsapp import send_invoice_available
            await send_invoice_available(
                phone=phone,
                customer_name=name,
                order_id=order_id,
                invoice_url=invoice_url,
            )
            logger.info(f"[Orders] WhatsApp invoice_available_v1 sent to {phone} for order {order_id}")
        except Exception as exc:
            logger.error(f"[Orders] Failed to send WhatsApp invoice notification: {exc}")

    return {
        "success": True,
        "order_id": order_id,
        "invoice_url": invoice_url,
        "message": "Tax invoice uploaded successfully and WhatsApp notification sent to customer.",
    }
