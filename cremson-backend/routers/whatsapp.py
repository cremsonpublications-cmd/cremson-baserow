"""
WhatsApp Incoming Webhook Router
Handles Meta Webhook verification (GET) and incoming WhatsApp messages (POST).
"""

import hmac
import hashlib
import os
import logging
from typing import Dict, Any

from fastapi import APIRouter, BackgroundTasks, Request, Response, HTTPException, Query

from services.whatsapp_chat import handle_incoming_message

logger = logging.getLogger(__name__)
router = APIRouter()

WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "cremson_whatsapp_verify_token")
WHATSAPP_APP_SECRET = os.getenv("WHATSAPP_APP_SECRET", "")


def _verify_meta_signature(raw_body: bytes, signature_header: str) -> bool:
    """Validate X-Hub-Signature-256 header against WHATSAPP_APP_SECRET if provided."""
    if not WHATSAPP_APP_SECRET:
        # If app secret is not set in env, skip HMAC check to avoid breaking setup
        return True

    if not signature_header or not signature_header.startswith("sha256="):
        return False

    expected_hash = hmac.new(
        WHATSAPP_APP_SECRET.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256,
    ).hexdigest()

    signature = signature_header.split("sha256=")[1]
    return hmac.compare_digest(expected_hash, signature)


@router.get("/whatsapp", summary="Verify Meta WhatsApp Webhook")
async def verify_whatsapp_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """
    Endpoint for Meta Graph API webhook subscription verification.
    """
    logger.info(f"[WhatsApp Webhook] Verification request mode={hub_mode} token={hub_verify_token}")
    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        logger.info("[WhatsApp Webhook] Verification SUCCESS")
        return Response(content=hub_challenge, media_type="text/plain")

    logger.warning("[WhatsApp Webhook] Verification FAILED - token mismatch")
    raise HTTPException(status_code=403, detail="Verification token mismatch")


@router.post("/whatsapp", summary="Receive WhatsApp incoming webhook events")
async def receive_whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Endpoint to receive incoming WhatsApp messages and status updates from Meta Cloud API.
    Returns HTTP 200 immediately and delegates processing to background task.
    """
    raw_body = await request.body()
    sig_header = request.headers.get("X-Hub-Signature-256", "")

    if WHATSAPP_APP_SECRET and not _verify_meta_signature(raw_body, sig_header):
        logger.warning("[WhatsApp Webhook] Invalid X-Hub-Signature-256 header - rejecting")
        raise HTTPException(status_code=401, detail="Invalid Meta signature")

    try:
        payload = await request.json()
    except Exception as parse_err:
        logger.error(f"[WhatsApp Webhook] JSON parse error: {parse_err}")
        return {"status": "error", "message": "Invalid JSON"}

    # Extract incoming message details from standard Meta payload
    # Payload structure: entry -> changes -> value -> messages
    entry_list = payload.get("entry", [])
    for entry in entry_list:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])

            for msg in messages:
                msg_type = msg.get("type")
                from_phone = msg.get("from")

                if msg_type == "text" and from_phone:
                    text_body = (msg.get("text") or {}).get("body", "")
                    # Schedule background handling of chatbot flow
                    background_tasks.add_task(
                        handle_incoming_message,
                        from_phone,
                        text_body,
                    )
                else:
                    logger.info(f"[WhatsApp Webhook] Received non-text message type '{msg_type}' from {from_phone}")

    # Return 200 OK to Meta immediately
    return {"status": "success"}
