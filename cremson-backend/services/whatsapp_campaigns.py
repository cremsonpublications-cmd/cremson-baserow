import asyncio
import json
import logging
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx

from config import (
    TABLE_IDS,
    WHATSAPP_CAMPAIGN_BATCH_SIZE,
    WHATSAPP_CAMPAIGN_DELAY_MS,
    WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_WABA_ID,
    WHATSAPP_PHONE_NUMBER_ID,
)
from services.baserow import BaserowClient
from services.whatsapp import _format_phone, send_campaign_template_raw
from db.campaigns_db import get_campaign_db

logger = logging.getLogger("uvicorn.error")
client = BaserowClient()

# Active processing locks to prevent concurrent worker execution for the same campaign
_ACTIVE_CAMPAIGN_LOCKS = set()


def get_templates() -> List[Dict[str, Any]]:
    """
    Fetch all custom templates from SQLite database.
    (Excludes automated transactional system templates like reorder_reminder_v1 & review_request_v1).
    """
    conn = get_campaign_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM custom_whatsapp_templates ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        item = dict(r)
        item["variables"] = json.loads(item.get("variables_json") or "[]")
        item["buttons"] = json.loads(item.get("buttons_json") or "[]")
        result.append(item)
    return result


async def sync_templates_from_meta() -> List[Dict[str, Any]]:
    """
    Sync message template statuses directly from Meta Graph API (v25.0),
    matching AiSensy's automatic status polling behavior.
    """
    waba_id = WHATSAPP_WABA_ID or WHATSAPP_PHONE_NUMBER_ID
    if not WHATSAPP_ACCESS_TOKEN or not waba_id:
        logger.info("[Meta Template Sync] WHATSAPP_ACCESS_TOKEN or WABA_ID missing — using local DB template statuses.")
        return get_templates()

    url = f"https://graph.facebook.com/v25.0/{waba_id}/message_templates"
    headers = {"Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"}
    params = {"fields": "name,status,category,language,components", "limit": 100}

    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            res = await http_client.get(url, headers=headers, params=params)

        if res.status_code == 200:
            meta_data = res.json().get("data", [])
            conn = get_campaign_db()
            cursor = conn.cursor()
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            for item in meta_data:
                name = item.get("name", "").strip().lower()
                status = item.get("status", "APPROVED").strip().upper()
                category = item.get("category", "MARKETING").strip().upper()
                language = item.get("language", "en").strip()
                components = item.get("components", [])

                body_txt = ""
                buttons = []
                variables = []

                for comp in components:
                    ctype = comp.get("type", "").upper()
                    if ctype == "BODY":
                        body_txt = comp.get("text", "")
                        var_matches = re.findall(r"\{\{(\d+)\}\}", body_txt)
                        for vnum in sorted(set(var_matches), key=int):
                            if vnum == "1":
                                variables.append({"key": "1", "label": "Recipient Name", "source": "recipient_name"})
                            else:
                                variables.append({"key": vnum, "label": f"Variable {vnum}", "source": "custom"})
                    elif ctype == "BUTTONS":
                        for btn in comp.get("buttons", []):
                            btype = btn.get("type", "").upper()
                            if btype == "URL":
                                buttons.append({"type": "URL", "text": btn.get("text", "Visit Link"), "url": btn.get("url", "")})
                            elif btype in ["QUICK_REPLY", "PHONE_NUMBER"]:
                                buttons.append({"type": btype, "text": btn.get("text", "Action"), "url": ""})

                display_name = name.replace("_", " ").title()

                cursor.execute("SELECT id FROM custom_whatsapp_templates WHERE name = ?", (name,))
                existing = cursor.fetchone()

                if existing:
                    cursor.execute(
                        "UPDATE custom_whatsapp_templates SET status = ?, category = ?, body_preview = ?, variables_json = ?, buttons_json = ?, updated_at = ? WHERE name = ?",
                        (status, category, body_txt, json.dumps(variables), json.dumps(buttons), now_str, name)
                    )
                else:
                    cursor.execute("""
                        INSERT INTO custom_whatsapp_templates (
                            name, display_name, category, language, status, description,
                            variables_json, buttons_json, body_preview, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        name, display_name, category, language, status, f"Synced Meta Approved Template",
                        json.dumps(variables), json.dumps(buttons), body_txt, now_str, now_str
                    ))

            conn.commit()
            conn.close()
            logger.info(f"[Meta Template Sync] Successfully synced {len(meta_data)} templates from Meta API.")
        else:
            logger.warning(f"[Meta Template Sync] Graph API status {res.status_code}: {res.text}")
    except Exception as e:
        logger.error(f"[Meta Template Sync] Error querying Meta API: {str(e)}")

    return get_templates()

def get_next_template_version_name(name: str) -> str:
    """Increment version number of a template system name (e.g. teacher_webinar_v1 -> teacher_webinar_v2)."""
    match = re.search(r"_v(\d+)$", name)
    if match:
        curr_ver = int(match.group(1))
        base_name = name[:match.start()]
        return f"{base_name}_v{curr_ver + 1}"
    else:
        return f"{name}_v2"


async def submit_template_to_meta(template_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Submits a new WhatsApp message template directly to Meta Graph API v25.0
    Endpoint: POST https://graph.facebook.com/v25.0/{WABA_ID}/message_templates
    Auto-versions template name if editing or if name already exists on Meta.
    """
    waba_id = WHATSAPP_WABA_ID or WHATSAPP_PHONE_NUMBER_ID
    if not WHATSAPP_ACCESS_TOKEN or not waba_id:
        logger.warning("[Meta Template Submit] Credentials or WHATSAPP_WABA_ID not configured.")
        return {"submitted": False, "status": "PENDING", "meta_id": "", "error": "WHATSAPP_WABA_ID and WHATSAPP_ACCESS_TOKEN must be configured in environment to submit templates to Meta."}

    name = (template_data.get("name") or "").strip().lower()
    is_editing = template_data.get("is_editing", False)
    if is_editing:
        name = get_next_template_version_name(name)

    category = (template_data.get("category") or "MARKETING").strip().upper()
    language = (template_data.get("language") or "en").strip()
    body_preview = (template_data.get("body_preview") or "").strip()
    # Meta Rule: Variables cannot be at the very start or very end of template body text!
    if body_preview.startswith("{{"):
        body_preview = "Dear " + body_preview
    if body_preview.endswith("}}"):
        body_preview = body_preview + "."

    buttons = template_data.get("buttons") or []

    # Detect dynamic variables in body_preview
    matches = re.findall(r"\{\{(\d+)\}\}", body_preview)
    var_keys = sorted(list(set(int(m) for m in matches)))
    user_samples = template_data.get("sample_values") or {}
    
    body_component = {
        "type": "BODY",
        "text": body_preview,
    }
    
    if var_keys:
        default_dict = {
            1: "Arjun Kumar",
            2: "Mathematics Teaching Methodology",
            3: "15th October 2026",
            4: "4:30 PM IST",
            5: "https://forms.gle/JssTdyF2Kmkfx37PA",
        }
        samples = []
        for k in var_keys:
            val = user_samples.get(str(k)) or user_samples.get(k) or default_dict.get(k) or f"Sample Value {k}"
            samples.append(str(val).strip())

        body_component["example"] = {
            "body_text": [samples]
        }

    components = [body_component]

    if buttons:
        btn_list = []
        for b in buttons:
            if b.get("type") == "URL":
                btn_list.append({
                    "type": "URL",
                    "text": b.get("text") or "Visit Link",
                    "url": b.get("url") or "https://cremsonpublications.com",
                })
        if btn_list:
            components.append({
                "type": "BUTTONS",
                "buttons": btn_list,
            })

    meta_payload = {
        "name": name,
        "category": category,
        "allow_category_change": True,
        "language": language,
        "components": components,
    }

    url = f"https://graph.facebook.com/v25.0/{waba_id}/message_templates"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(url, json=meta_payload, headers=headers)
            res_data = res.json()
            if res.status_code in [200, 201] and "id" in res_data:
                meta_status = res_data.get("status", "PENDING").upper()
                logger.info(f"[Meta Template Submit] Successfully submitted template '{name}' to Meta (id: {res_data['id']}, status: {meta_status})")
                return {"submitted": True, "status": meta_status, "meta_id": res_data["id"], "name": name, "error": ""}
            elif any(x in str(res_data).lower() for x in ["already exists", "already associated", "exists on meta"]):
                # Name collision on Meta — retry with incremented version name!
                versioned_name = get_next_template_version_name(name)
                meta_payload["name"] = versioned_name
                logger.info(f"[Meta Template Submit] Name '{name}' exists on Meta. Retrying as '{versioned_name}'...")
                res_retry = await client.post(url, json=meta_payload, headers=headers)
                res_retry_data = res_retry.json()
                if res_retry.status_code in [200, 201] and "id" in res_retry_data:
                    meta_status = res_retry_data.get("status", "PENDING").upper()
                    return {"submitted": True, "status": meta_status, "meta_id": res_retry_data["id"], "name": versioned_name, "error": ""}
                else:
                    err = res_retry_data.get("error", {})
                    msg = err.get("message") or res_retry.text
                    return {"submitted": False, "status": "PENDING", "meta_id": "", "name": versioned_name, "error": msg}
            else:
                err = res_data.get("error", {})
                msg = err.get("message") or res.text
                logger.error(f"[Meta Template Submit] Graph API error submitting '{name}': {msg}")
                return {"submitted": False, "status": "PENDING", "meta_id": "", "name": name, "error": msg}
    except Exception as exc:
        logger.error(f"[Meta Template Submit] Exception submitting template '{name}': {exc}")
        return {"submitted": False, "status": "PENDING", "meta_id": "", "name": name, "error": str(exc)}


def save_template(template_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create or update a custom WhatsApp template in the database."""
    name = (template_data.get("name") or "").strip().lower()
    display_name = (template_data.get("display_name") or template_data.get("name") or "").strip()
    category = (template_data.get("category") or "MARKETING").strip().upper()
    language = (template_data.get("language") or "en").strip()
    status = (template_data.get("status") or "PENDING").strip().upper()
    description = (template_data.get("description") or "").strip()
    body_preview = (template_data.get("body_preview") or "").strip()
    variables = template_data.get("variables") or []
    buttons = template_data.get("buttons") or []

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_campaign_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM custom_whatsapp_templates WHERE name = ?", (name,))
    existing = cursor.fetchone()

    if existing:
        row_id = existing["id"]
        cursor.execute("""
            UPDATE custom_whatsapp_templates
            SET display_name = ?, category = ?, language = ?, status = ?, description = ?,
                variables_json = ?, buttons_json = ?, body_preview = ?, updated_at = ?
            WHERE id = ?
        """, (
            display_name, category, language, status, description,
            json.dumps(variables), json.dumps(buttons), body_preview, now_str, row_id
        ))
    else:
        cursor.execute("""
            INSERT INTO custom_whatsapp_templates (
                name, display_name, category, language, status, description,
                variables_json, buttons_json, body_preview, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            name, display_name, category, language, status, description,
            json.dumps(variables), json.dumps(buttons), body_preview, now_str, now_str
        ))

    conn.commit()
    conn.close()

    # Return updated templates
    templates = get_templates()
    for t in templates:
        if t["name"] == name:
            return t
    return template_data


async def delete_template(name: str) -> Dict[str, Any]:
    """Delete a template by name from Meta WABA account and local database."""
    meta_deleted = False
    meta_msg = ""

    waba_id = (WHATSAPP_WABA_ID or "2467890800356408").strip()
    token = WHATSAPP_ACCESS_TOKEN

    if waba_id and token:
        try:
            url = f"https://graph.facebook.com/v25.0/{waba_id}/message_templates?name={name}"
            headers = {"Authorization": f"Bearer {token}"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.delete(url, headers=headers)
                res_data = res.json()
                if res.status_code == 200 and res_data.get("success"):
                    meta_deleted = True
                    logger.info(f"[Meta Template Delete] Successfully deleted '{name}' from Meta WABA.")
                else:
                    err_msg = res_data.get("error", {}).get("message") or res.text
                    logger.warning(f"[Meta Template Delete] Meta response for '{name}': {err_msg}")
                    meta_msg = err_msg
        except Exception as exc:
            logger.error(f"[Meta Template Delete] Exception deleting '{name}' from Meta: {exc}")
            meta_msg = str(exc)

    conn = get_campaign_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM custom_whatsapp_templates WHERE name = ?", (name,))
    local_deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()

    return {
        "success": local_deleted or meta_deleted,
        "local_deleted": local_deleted,
        "meta_deleted": meta_deleted,
        "meta_message": meta_msg,
        "message": f"Template '{name}' deleted."
    }


# ── Audience Resolution ───────────────────────────────────────────────────────

async def resolve_audience(audience_type: str, audience_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Fetch and normalize recipient list based on selected audience_type:
      - 'teachers_all' | 'teachers_selected'
      - 'customers_all' | 'customers_selected'
    """
    recipients = []
    seen_phones = set()

    if audience_type.startswith("teachers"):
        # Query Teachers from Baserow Table 877
        res = await client.get_rows(TABLE_IDS["teacher"], size=200)
        results = res.get("results", [])
        
        for t in results:
            name = (t.get("Teacher Name") or t.get("name") or "Teacher").strip()
            raw_phone = t.get("Whatsapp Phone") or t.get("Phone") or t.get("phone") or ""
            formatted = _format_phone(raw_phone)
            
            if not formatted or len(formatted) < 10:
                continue
                
            if formatted in seen_phones:
                continue
                
            seen_phones.add(formatted)
            recipients.append({
                "user_id": f"teacher_{t.get('id')}",
                "recipient_name": name,
                "phone_number": formatted,
                "email": t.get("Email") or "",
                "city": t.get("City") or "",
            })

    elif audience_type.startswith("customers"):
        # Query Customers from Baserow Table 769 (auth_users) & Table 761 (users)
        auth_res = await client.get_rows(TABLE_IDS["auth_users"], size=200)
        for u in auth_res.get("results", []):
            name = (u.get("name") or "Customer").strip()
            raw_phone = u.get("phone") or ""
            formatted = _format_phone(raw_phone)
            
            if not formatted or len(formatted) < 10:
                continue
                
            if formatted in seen_phones:
                continue
                
            seen_phones.add(formatted)
            recipients.append({
                "user_id": f"user_{u.get('id')}",
                "recipient_name": name,
                "phone_number": formatted,
                "email": u.get("email") or "",
                "city": "",
            })

    elif audience_type in ["custom_numbers", "manual_numbers"]:
        # Parse comma or newline separated phone numbers from audience_filter
        if audience_filter:
            raw_entries = [num.strip() for num in audience_filter.replace(",", "\n").split("\n") if num.strip()]
            for item in raw_entries:
                formatted = _format_phone(item)
                if not formatted or len(formatted) < 10:
                    continue
                if formatted in seen_phones:
                    continue
                seen_phones.add(formatted)
                recipients.append({
                    "user_id": f"custom_{formatted}",
                    "recipient_name": f"Recipient ({formatted[-4:]})",
                    "phone_number": formatted,
                    "email": "",
                    "city": "",
                })

    if audience_filter and audience_type not in ["custom_numbers", "manual_numbers"]:
        selected_ids = set([x.strip() for x in audience_filter.split(",") if x.strip()])
        if selected_ids:
            recipients = [r for r in recipients if r["user_id"] in selected_ids]

    return recipients


# ── Campaign CRUD operations ──────────────────────────────────────────────────

async def create_campaign(
    campaign_name: str,
    template_name: str,
    audience_type: str,
    audience_filter: str = "",
    variables: Optional[Dict[str, Any]] = None,
    scheduled_at: Optional[str] = None,
    created_by: str = "Admin",
) -> Dict[str, Any]:
    """
    Creates a new campaign record and freezes the recipient snapshot.
    """
    if variables is None:
        variables = {}

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status = "scheduled" if scheduled_at else "draft"

    # 1. Resolve audience snapshot
    resolved_recipients = await resolve_audience(audience_type, audience_filter)
    total_count = len(resolved_recipients)

    conn = get_campaign_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO whatsapp_campaigns (
            campaign_name, template_name, template_language, audience_type,
            audience_filter, total_recipients, queued_count, sent_count,
            delivered_count, read_count, failed_count, status, variables_json,
            scheduled_at, created_by, created_at, updated_at
        ) VALUES (?, ?, 'en', ?, ?, ?, ?, 0, 0, 0, 0, ?, ?, ?, ?, ?, ?)
    """, (
        campaign_name, template_name, audience_type, audience_filter,
        total_count, total_count, status, json.dumps(variables),
        scheduled_at, created_by, now_str, now_str
    ))

    campaign_id = cursor.lastrowid

    # Fetch template body_preview to inspect exact variable placeholders
    cursor.execute("SELECT body_preview FROM custom_whatsapp_templates WHERE name = ?", (template_name,))
    tmpl_row = cursor.fetchone()
    body_txt = tmpl_row["body_preview"] if tmpl_row and tmpl_row["body_preview"] else ""

    # 2. Insert recipient snapshot rows
    for r in resolved_recipients:
        template_vars = []
        if body_txt:
            # Append variables ONLY if placeholders exist in template body text
            if "{{1}}" in body_txt:
                template_vars.append({"type": "text", "text": r["recipient_name"]})
            for key in sorted(variables.keys(), key=lambda x: int(x) if x.isdigit() else 99):
                if key != "1" and f"{{{{{key}}}}}" in body_txt:
                    template_vars.append({"type": "text", "text": str(variables[key])})
        else:
            # Fallback for templates without body_txt in DB
            if variables:
                for key in sorted(variables.keys(), key=lambda x: int(x) if x.isdigit() else 99):
                    if key == "1":
                        template_vars.append({"type": "text", "text": r["recipient_name"]})
                    else:
                        template_vars.append({"type": "text", "text": str(variables[key])})

        cursor.execute("""
            INSERT INTO whatsapp_campaign_recipients (
                campaign_id, user_id, phone_number, recipient_name,
                template_variables_json, status, queued_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, ?)
        """, (
            campaign_id, r["user_id"], r["phone_number"], r["recipient_name"],
            json.dumps(template_vars), now_str, now_str, now_str
        ))

    conn.commit()
    conn.close()

    logger.info(f"[Campaigns Engine] Created campaign #{campaign_id} '{campaign_name}' with {total_count} snapshot recipients.")
    return await get_campaign_details(campaign_id)


async def get_campaign_details(campaign_id: int) -> Dict[str, Any]:
    """Return campaign object with aggregate statistics."""
    conn = get_campaign_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM whatsapp_campaigns WHERE id = ?", (campaign_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {}

    data = dict(row)
    data["variables"] = json.loads(data.get("variables_json") or "{}")
    return data


async def list_campaigns() -> List[Dict[str, Any]]:
    """Return list of all campaigns sorted by newest first."""
    conn = get_campaign_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM whatsapp_campaigns ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        item = dict(r)
        item["variables"] = json.loads(item.get("variables_json") or "{}")
        result.append(item)
    return result


async def get_campaign_recipients(
    campaign_id: int,
    page: int = 1,
    size: int = 50,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    """Return paginated list of recipients for a campaign."""
    conn = get_campaign_db()
    cursor = conn.cursor()

    offset = (page - 1) * size

    if status_filter:
        cursor.execute(
            "SELECT COUNT(*) FROM whatsapp_campaign_recipients WHERE campaign_id = ? AND status = ?",
            (campaign_id, status_filter)
        )
        total = cursor.fetchone()[0]

        cursor.execute(
            "SELECT * FROM whatsapp_campaign_recipients WHERE campaign_id = ? AND status = ? ORDER BY id ASC LIMIT ? OFFSET ?",
            (campaign_id, status_filter, size, offset)
        )
    else:
        cursor.execute(
            "SELECT COUNT(*) FROM whatsapp_campaign_recipients WHERE campaign_id = ?",
            (campaign_id,)
        )
        total = cursor.fetchone()[0]

        cursor.execute(
            "SELECT * FROM whatsapp_campaign_recipients WHERE campaign_id = ? ORDER BY id ASC LIMIT ? OFFSET ?",
            (campaign_id, size, offset)
        )

    rows = cursor.fetchall()
    conn.close()

    recipients = []
    for r in rows:
        item = dict(r)
        item["template_variables"] = json.loads(item.get("template_variables_json") or "[]")
        recipients.append(item)

    return {"total": total, "page": page, "size": size, "recipients": recipients}


# ── Background Campaign Execution Engine ──────────────────────────────────────

async def process_campaign_queue(campaign_id: int):
    """
    Background worker loop: Sends messages for queued recipients in batch rate-limited chunks.
    Guaranteed single execution per campaign via _ACTIVE_CAMPAIGN_LOCKS.
    """
    if campaign_id in _ACTIVE_CAMPAIGN_LOCKS:
        logger.warning(f"[Campaign Engine] Campaign #{campaign_id} is already processing — skipping concurrent run.")
        return

    _ACTIVE_CAMPAIGN_LOCKS.add(campaign_id)
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        conn = get_campaign_db()
        cursor = conn.cursor()

        # Update campaign status to 'sending'
        cursor.execute(
            "UPDATE whatsapp_campaigns SET status = 'sending', started_at = ? WHERE id = ?",
            (now_str, campaign_id)
        )
        conn.commit()
        conn.close()

        logger.info(f"[Campaign Engine] Started sending campaign #{campaign_id}...")

        while True:
            # Check if campaign was cancelled by admin
            conn = get_campaign_db()
            cursor = conn.cursor()
            cursor.execute("SELECT status, template_name, template_language FROM whatsapp_campaigns WHERE id = ?", (campaign_id,))
            c_row = cursor.fetchone()

            if not c_row or c_row["status"] == "cancelled":
                logger.info(f"[Campaign Engine] Campaign #{campaign_id} was cancelled. Stopping queue loop.")
                conn.close()
                break

            template_name = c_row["template_name"]
            template_language = c_row["template_language"]

            # Fetch batch of queued recipients
            cursor.execute(
                "SELECT * FROM whatsapp_campaign_recipients WHERE campaign_id = ? AND status IN ('queued', 'pending') LIMIT ?",
                (campaign_id, WHATSAPP_CAMPAIGN_BATCH_SIZE)
            )
            batch = cursor.fetchall()
            conn.close()

            if not batch:
                # Queue completed!
                logger.info(f"[Campaign Engine] Queue completed for campaign #{campaign_id}.")
                break

            # Send batch concurrently with delay
            for recipient in batch:
                r_dict = dict(recipient)
                rec_id = r_dict["id"]
                phone = r_dict["phone_number"]
                name = r_dict["recipient_name"]
                vars_list = json.loads(r_dict.get("template_variables_json") or "[]")

                # Build Meta button components if template requires buttons
                components = [{"type": "body", "parameters": vars_list}]

                # Check if template has dynamic URL button parameter (e.g. review/reorder URL)
                if len(vars_list) > 1 and "http" in str(vars_list[-1].get("text", "")):
                    url_val = str(vars_list[-1].get("text", ""))
                    components.append({
                        "type": "button",
                        "sub_type": "url",
                        "index": "0",
                        "parameters": [{"type": "text", "text": url_val}]
                    })

                res = await send_campaign_template_raw(
                    phone=phone,
                    template_name=template_name,
                    parameters=vars_list,
                    components=components,
                    language=template_language,
                    log_tag=f"campaign_{campaign_id}_rec_{rec_id}"
                )

                ts_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                conn_up = get_campaign_db()
                cursor_up = conn_up.cursor()

                if res["success"]:
                    wamid = res["wamid"]
                    cursor_up.execute("""
                        UPDATE whatsapp_campaign_recipients
                        SET status = 'sent', whatsapp_message_id = ?, sent_at = ?, updated_at = ?
                        WHERE id = ?
                    """, (wamid, ts_str, ts_str, rec_id))

                    cursor_up.execute("""
                        UPDATE whatsapp_campaigns
                        SET sent_count = sent_count + 1, queued_count = MAX(0, queued_count - 1), updated_at = ?
                        WHERE id = ?
                    """, (ts_str, campaign_id))
                else:
                    err_code = res["error_code"] or "FAILED"
                    err_msg = res["error_message"] or "Failed to send message"
                    cursor_up.execute("""
                        UPDATE whatsapp_campaign_recipients
                        SET status = 'failed', error_code = ?, error_message = ?, failed_at = ?, updated_at = ?
                        WHERE id = ?
                    """, (err_code, err_msg, ts_str, ts_str, rec_id))

                    cursor_up.execute("""
                        UPDATE whatsapp_campaigns
                        SET failed_count = failed_count + 1, queued_count = MAX(0, queued_count - 1), updated_at = ?
                        WHERE id = ?
                    """, (ts_str, campaign_id))

                conn_up.commit()
                conn_up.close()

                # Delay between individual API calls
                await asyncio.sleep(WHATSAPP_CAMPAIGN_DELAY_MS / 1000.0)

        # Calculate final campaign status accurately based on delivery results
        fin_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        conn_fin = get_campaign_db()
        cursor_fin = conn_fin.cursor()
        cursor_fin.execute(
            "SELECT sent_count, failed_count, total_recipients FROM whatsapp_campaigns WHERE id = ?",
            (campaign_id,)
        )
        c_fin_row = cursor_fin.fetchone()
        
        final_status = "completed"
        if c_fin_row:
            sent_cnt = c_fin_row["sent_count"] or 0
            failed_cnt = c_fin_row["failed_count"] or 0
            if sent_cnt == 0 and failed_cnt > 0:
                final_status = "failed"
            elif sent_cnt > 0 and failed_cnt > 0:
                final_status = "partially_failed"
            else:
                final_status = "completed"

        cursor_fin.execute(
            "UPDATE whatsapp_campaigns SET status = ?, completed_at = ?, updated_at = ? WHERE id = ? AND status != 'cancelled'",
            (final_status, fin_now, fin_now, campaign_id)
        )
        conn_fin.commit()
        conn_fin.close()
        logger.info(f"[Campaign Engine] Campaign #{campaign_id} execution loop finished with status '{final_status}'.")

    except Exception as exc:
        logger.error(f"[Campaign Engine] Error executing campaign #{campaign_id}: {exc}")
    finally:
        _ACTIVE_CAMPAIGN_LOCKS.discard(campaign_id)


async def delete_campaign(campaign_id: int) -> bool:
    """Delete a campaign and all its recipient snapshot logs from database."""
    conn = get_campaign_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM whatsapp_campaign_recipients WHERE campaign_id = ?", (campaign_id,))
    cursor.execute("DELETE FROM whatsapp_campaigns WHERE id = ?", (campaign_id,))
    conn.commit()
    conn.close()
    return True


# ── Webhook Status Updater ────────────────────────────────────────────────────

async def update_recipient_status_by_wamid(
    wamid: str,
    status: str,
    timestamp_str: Optional[str] = None,
    error_code: str = "",
    error_message: str = ""
):
    """
    Called when Meta Webhook notifies status updates ('delivered', 'read', 'failed') for a wamid.
    """
    if not wamid:
        return

    ts_now = timestamp_str or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_campaign_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, campaign_id, status FROM whatsapp_campaign_recipients WHERE whatsapp_message_id = ?", (wamid,))
    rec = cursor.fetchone()

    if not rec:
        conn.close()
        return

    rec_id = rec["id"]
    campaign_id = rec["campaign_id"]
    old_status = rec["status"]

    if old_status == status:
        conn.close()
        return

    if status == "delivered":
        cursor.execute("""
            UPDATE whatsapp_campaign_recipients
            SET status = 'delivered', delivered_at = ?, updated_at = ?
            WHERE id = ?
        """, (ts_now, ts_now, rec_id))

        if old_status != "delivered" and old_status != "read":
            cursor.execute("""
                UPDATE whatsapp_campaigns
                SET delivered_count = delivered_count + 1, updated_at = ?
                WHERE id = ?
            """, (ts_now, campaign_id))

    elif status == "read":
        cursor.execute("""
            UPDATE whatsapp_campaign_recipients
            SET status = 'read', read_at = ?, updated_at = ?
            WHERE id = ?
        """, (ts_now, ts_now, rec_id))

        if old_status != "read":
            cursor.execute("""
                UPDATE whatsapp_campaigns
                SET read_count = read_count + 1, updated_at = ?
                WHERE id = ?
            """, (ts_now, campaign_id))

            if old_status != "delivered":
                cursor.execute("""
                    UPDATE whatsapp_campaigns
                    SET delivered_count = delivered_count + 1, updated_at = ?
                    WHERE id = ?
                """, (ts_now, campaign_id))

    elif status == "failed":
        cursor.execute("""
            UPDATE whatsapp_campaign_recipients
            SET status = 'failed', error_code = ?, error_message = ?, failed_at = ?, updated_at = ?
            WHERE id = ?
        """, (error_code, error_message, ts_now, ts_now, rec_id))

        cursor.execute("""
            UPDATE whatsapp_campaigns
            SET failed_count = failed_count + 1, updated_at = ?
            WHERE id = ?
        """, (ts_now, campaign_id))

    conn.commit()
    conn.close()
    logger.info(f"[Campaign Webhook] Updated recipient wamid={wamid} status: {old_status} → {status}")


# ── Cancel & Retry Actions ─────────────────────────────────────────────────────

async def cancel_campaign(campaign_id: int) -> bool:
    """Cancel a pending/scheduled campaign and mark remaining queued recipients as cancelled."""
    conn = get_campaign_db()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("UPDATE whatsapp_campaigns SET status = 'cancelled', updated_at = ? WHERE id = ?", (now_str, campaign_id))
    cursor.execute("UPDATE whatsapp_campaign_recipients SET status = 'cancelled', updated_at = ? WHERE campaign_id = ? AND status IN ('queued', 'pending')", (now_str, campaign_id))

    conn.commit()
    conn.close()
    logger.info(f"[Campaign Engine] Campaign #{campaign_id} cancelled.")
    return True


async def retry_failed_recipients(campaign_id: int) -> int:
    """Re-queues all failed recipients in a campaign."""
    conn = get_campaign_db()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("SELECT COUNT(*) FROM whatsapp_campaign_recipients WHERE campaign_id = ? AND status = 'failed'", (campaign_id,))
    failed_count = cursor.fetchone()[0]

    if failed_count == 0:
        conn.close()
        return 0

    cursor.execute("""
        UPDATE whatsapp_campaign_recipients
        SET status = 'queued', error_code = '', error_message = '', updated_at = ?
        WHERE campaign_id = ? AND status = 'failed'
    """, (now_str, campaign_id))

    cursor.execute("""
        UPDATE whatsapp_campaigns
        SET status = 'sending', queued_count = queued_count + ?, failed_count = 0, updated_at = ?
        WHERE id = ?
    """, (failed_count, now_str, campaign_id))

    conn.commit()
    conn.close()

    # Trigger background worker for retries
    asyncio.create_task(process_campaign_queue(campaign_id))
    logger.info(f"[Campaign Engine] Re-queued {failed_count} failed recipients for campaign #{campaign_id}.")
    return failed_count
