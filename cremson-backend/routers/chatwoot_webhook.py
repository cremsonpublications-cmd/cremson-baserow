"""
Chatwoot Outgoing Webhook Receiver
Fires when Chatwoot receives a new incoming WhatsApp message.
Triggers the chatbot flow so it can auto-reply.
"""

import logging
from typing import Any, Dict

from fastapi import APIRouter, BackgroundTasks, Request

from services.whatsapp_chat import handle_incoming_message

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chatwoot-webhook", summary="Receive Chatwoot message_created events")
async def chatwoot_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Chatwoot fires this when a new message arrives in any inbox.
    We filter for incoming messages from the WhatsApp inbox and run the chatbot.
    """
    try:
        payload: Dict[str, Any] = await request.json()
    except Exception:
        return {"status": "error", "message": "Invalid JSON"}

    event = payload.get("event")
    if event != "message_created":
        return {"status": "ignored", "event": event}

    # Only process incoming messages (message_type 0 or "incoming" = from customer)
    message_type = payload.get("message_type")
    if message_type not in (0, "incoming"):
        return {"status": "ignored", "message_type": message_type}

    # Only act on messages from WhatsApp inboxes
    # channel is nested inside conversation in the webhook payload
    conversation = payload.get("conversation") or {}
    channel = conversation.get("channel") or payload.get("channel")
    if channel not in ("Channel::Whatsapp", "Channel::Api"):
        return {"status": "ignored", "channel": channel}

    content = payload.get("content", "").strip()
    if not content:
        return {"status": "ignored", "reason": "empty content"}

    # Extract sender phone — try conversation.meta.sender first, then top-level sender
    meta = conversation.get("meta") or {}
    sender = meta.get("sender") or payload.get("sender") or {}
    phone_raw = sender.get("phone_number", "")

    # Normalise phone: strip leading + so it matches internal format (91XXXXXXXXXX)
    from_phone = phone_raw.lstrip("+")

    if not from_phone:
        logger.warning("[ChatwootWH] Could not extract sender phone from payload")
        return {"status": "error", "reason": "no phone"}

    msg_id = str(payload.get("id", ""))
    chatwoot_conversation_id = conversation.get("id")

    logger.info(f"[ChatwootWH] Incoming message from {from_phone}: '{content[:60]}'")
    background_tasks.add_task(handle_incoming_message, from_phone, content, msg_id, chatwoot_conversation_id)

    return {"status": "success"}
