"""
Chatwoot utility: post outgoing private notes into a customer's conversation.
Used to mirror WhatsApp notifications (order confirmations, shipping updates, etc.)
into the Chatwoot dashboard so agents have full visibility.
"""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

_BASE = os.getenv("CHATWOOT_BASE_URL", "http://127.0.0.1:3000")
_TOKEN = os.getenv("CHATWOOT_API_TOKEN", "fpTVP7S7m5ABJhrhKuGgNceF")
_ACCOUNT = os.getenv("CHATWOOT_ACCOUNT_ID", "2")
_INBOX = os.getenv("CHATWOOT_INBOX_ID", "1")


async def post_to_chatwoot(phone: str, name: str, text: str) -> None:
    """
    Find (or create) a Chatwoot contact + open conversation for `phone`,
    then post `text` as a private outgoing note visible only to agents.
    Failures are logged but never raise — this must not break the main flow.
    """
    if not phone or not text:
        return

    digits = "".join(filter(str.isdigit, str(phone)))
    if len(digits) == 10:
        digits = "91" + digits
    e164 = f"+{digits}"

    headers = {"api_access_token": _TOKEN, "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            contact_id = await _get_or_create_contact(client, headers, e164, name or e164)
            if not contact_id:
                logger.warning(f"[Chatwoot] Could not find/create contact for {phone}")
                return

            conv_id = await _get_or_create_conversation(client, headers, contact_id)
            if not conv_id:
                logger.warning(f"[Chatwoot] Could not find/create conversation for contact {contact_id}")
                return

            resp = await client.post(
                f"{_BASE}/api/v1/accounts/{_ACCOUNT}/conversations/{conv_id}/messages",
                headers=headers,
                json={"content": text, "message_type": "outgoing", "private": True},
            )
            if resp.status_code in (200, 201):
                logger.info(f"[Chatwoot] ✓ Note posted conv={conv_id} phone={phone}")
            else:
                logger.warning(f"[Chatwoot] Note post failed {resp.status_code}: {resp.text[:120]}")
    except Exception as exc:
        logger.warning(f"[Chatwoot] Error: {exc}")


async def _get_or_create_contact(client, headers, e164, name):
    search = await client.get(
        f"{_BASE}/api/v1/accounts/{_ACCOUNT}/contacts/search",
        headers=headers,
        params={"q": e164, "include_contacts": "true"},
    )
    if search.status_code == 200:
        payload = search.json().get("payload", [])
        results = payload if isinstance(payload, list) else payload.get("contacts", [])
        if results:
            return results[0]["id"]

    create = await client.post(
        f"{_BASE}/api/v1/accounts/{_ACCOUNT}/contacts",
        headers=headers,
        json={"name": name, "phone_number": e164},
    )
    if create.status_code in (200, 201):
        return create.json().get("id")
    return None


async def _get_or_create_conversation(client, headers, contact_id):
    convs = await client.get(
        f"{_BASE}/api/v1/accounts/{_ACCOUNT}/contacts/{contact_id}/conversations",
        headers=headers,
    )
    if convs.status_code == 200:
        for conv in convs.json().get("payload", []):
            if conv.get("inbox_id") == int(_INBOX) and conv.get("status") == "open":
                return conv["id"]

    new_conv = await client.post(
        f"{_BASE}/api/v1/accounts/{_ACCOUNT}/conversations",
        headers=headers,
        json={"inbox_id": int(_INBOX), "contact_id": contact_id},
    )
    if new_conv.status_code in (200, 201):
        return new_conv.json().get("id")
    return None
