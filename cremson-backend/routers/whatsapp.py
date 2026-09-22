"""
WhatsApp Incoming Webhook Router
Handles Meta Webhook verification (GET) and incoming WhatsApp messages (POST).
"""

import hmac
import hashlib
import os
import logging
from typing import Dict, Any, Optional

import httpx
from fastapi import APIRouter, BackgroundTasks, Request, Response, HTTPException, Query

from services.whatsapp_chat import handle_incoming_message

# ── Chatwoot forwarder ─────────────────────────────────────────────────────────
CHATWOOT_BASE_URL = os.getenv("CHATWOOT_BASE_URL", "http://127.0.0.1:3000")
CHATWOOT_API_TOKEN = os.getenv("CHATWOOT_API_TOKEN", "fpTVP7S7m5ABJhrhKuGgNceF")
CHATWOOT_ACCOUNT_ID = os.getenv("CHATWOOT_ACCOUNT_ID", "2")
CHATWOOT_INBOX_ID = os.getenv("CHATWOOT_INBOX_ID", "1")

async def _get_or_create_chatwoot_contact(client: httpx.AsyncClient, headers: dict, phone: str, name: str) -> Optional[int]:
    """Find existing Chatwoot contact by phone or create a new one. Returns contact_id or None."""
    # Search for existing contact
    search_resp = await client.get(
        f"{CHATWOOT_BASE_URL}/api/v1/accounts/{CHATWOOT_ACCOUNT_ID}/contacts/search",
        headers=headers,
        params={"q": phone, "include_contacts": "true"},
    )
    if search_resp.status_code == 200:
        results = search_resp.json().get("payload", {}).get("contacts", [])
        if results:
            return results[0]["id"]

    # Create new contact
    create_resp = await client.post(
        f"{CHATWOOT_BASE_URL}/api/v1/accounts/{CHATWOOT_ACCOUNT_ID}/contacts",
        headers=headers,
        json={"name": name, "phone_number": f"+{phone}"},
    )
    if create_resp.status_code in (200, 201):
        return create_resp.json().get("id")
    return None


async def _get_or_create_chatwoot_conversation(client: httpx.AsyncClient, headers: dict, contact_id: int) -> Optional[int]:
    """Find an open conversation for the contact in the WhatsApp inbox, or create one."""
    conv_resp = await client.get(
        f"{CHATWOOT_BASE_URL}/api/v1/accounts/{CHATWOOT_ACCOUNT_ID}/contacts/{contact_id}/conversations",
        headers=headers,
    )
    if conv_resp.status_code == 200:
        convs = conv_resp.json().get("payload", [])
        for conv in convs:
            if conv.get("inbox_id") == int(CHATWOOT_INBOX_ID) and conv.get("status") == "open":
                return conv["id"]

    # Create new conversation
    new_conv_resp = await client.post(
        f"{CHATWOOT_BASE_URL}/api/v1/accounts/{CHATWOOT_ACCOUNT_ID}/conversations",
        headers=headers,
        json={"inbox_id": int(CHATWOOT_INBOX_ID), "contact_id": contact_id},
    )
    if new_conv_resp.status_code in (200, 201):
        return new_conv_resp.json().get("id")
    return None


async def _forward_to_chatwoot(payload: Dict[str, Any]) -> None:
    """Forward incoming WhatsApp message to Chatwoot so agents can see it."""
    try:
        entry_list = payload.get("entry", [])
        for entry in entry_list:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                contacts = value.get("contacts", [])
                messages = value.get("messages", [])
                for msg in messages:
                    if msg.get("type") != "text":
                        continue
                    from_phone = msg.get("from", "")
                    text_body = (msg.get("text") or {}).get("body", "")
                    contact_name = contacts[0].get("profile", {}).get("name", from_phone) if contacts else from_phone

                    headers = {
                        "api_access_token": CHATWOOT_API_TOKEN,
                        "Content-Type": "application/json",
                    }
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        contact_id = await _get_or_create_chatwoot_contact(client, headers, from_phone, contact_name)
                        if not contact_id:
                            logger.warning(f"[Chatwoot Forward] Could not find/create contact for {from_phone}")
                            continue

                        conv_id = await _get_or_create_chatwoot_conversation(client, headers, contact_id)
                        if not conv_id:
                            logger.warning(f"[Chatwoot Forward] Could not find/create conversation for contact {contact_id}")
                            continue

                        msg_resp = await client.post(
                            f"{CHATWOOT_BASE_URL}/api/v1/accounts/{CHATWOOT_ACCOUNT_ID}/conversations/{conv_id}/messages",
                            headers=headers,
                            json={"content": text_body, "message_type": "incoming", "private": False},
                        )
                        if msg_resp.status_code in (200, 201):
                            logger.info(f"[Chatwoot Forward] Message from {from_phone} forwarded to conversation {conv_id}")
                        else:
                            logger.warning(f"[Chatwoot Forward] Message post failed: {msg_resp.status_code} {msg_resp.text[:100]}")
    except Exception as exc:
        logger.warning(f"[Chatwoot Forward] Failed: {exc}")

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

    # Forward to Chatwoot so agents can see all incoming WhatsApp messages
    background_tasks.add_task(_forward_to_chatwoot, payload)

    # Extract incoming message details from standard Meta payload
    # Payload structure: entry -> changes -> value -> messages / statuses
    entry_list = payload.get("entry", [])
    for entry in entry_list:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            statuses = value.get("statuses", [])

            # 1. Incoming chat messages
            for msg in messages:
                msg_type = msg.get("type")
                from_phone = msg.get("from")

                if msg_type == "text" and from_phone:
                    text_body = (msg.get("text") or {}).get("body", "")
                    msg_wamid = msg.get("id", "")  # Unique WhatsApp message ID for dedup
                    # Schedule background handling of chatbot flow
                    background_tasks.add_task(
                        handle_incoming_message,
                        from_phone,
                        text_body,
                        msg_wamid,
                    )
                else:
                    logger.info(f"[WhatsApp Webhook] Received non-text message type '{msg_type}' from {from_phone}")

            # 2. Campaign message delivery status updates (sent, delivered, read, failed)
            for st in statuses:
                wamid = st.get("id")
                status_val = st.get("status")  # 'sent', 'delivered', 'read', 'failed'
                errors = st.get("errors", [])
                err_code = str(errors[0].get("code")) if errors else ""
                err_msg = str(errors[0].get("title") or errors[0].get("message") or "") if errors else ""

                if wamid and status_val:
                    from services.whatsapp_campaigns import update_recipient_status_by_wamid
                    background_tasks.add_task(
                        update_recipient_status_by_wamid,
                        wamid,
                        status_val,
                        None,
                        err_code,
                        err_msg,
                    )

    # Return 200 OK to Meta immediately
    return {"status": "success"}
