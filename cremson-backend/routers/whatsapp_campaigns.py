import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Body, Depends
from pydantic import BaseModel

from services.whatsapp_campaigns import (
    get_templates,
    save_template,
    submit_template_to_meta,
    delete_template,
    sync_templates_from_meta,
    resolve_audience,
    create_campaign,
    get_campaign_details,
    list_campaigns,
    get_campaign_recipients,
    process_campaign_queue,
    cancel_campaign,
    delete_campaign,
    retry_failed_recipients,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class TemplateRequest(BaseModel):
    name: str
    display_name: str
    category: str = "MARKETING"
    language: str = "en"
    status: str = "APPROVED"
    description: Optional[str] = ""
    variables: Optional[List[Dict[str, Any]]] = []
    buttons: Optional[List[Dict[str, Any]]] = []
    body_preview: str


class CreateCampaignRequest(BaseModel):
    campaign_name: str
    template_name: str
    audience_type: str
    audience_filter: Optional[str] = ""
    variables: Optional[Dict[str, Any]] = {}
    scheduled_at: Optional[str] = None
    created_by: Optional[str] = "Admin"


class ScheduleCampaignRequest(BaseModel):
    scheduled_at: str


@router.get("/templates", summary="List available WhatsApp Cloud API templates")
async def list_templates_endpoint():
    """Return marketing & utility templates available for campaigns."""
    templates = get_templates()
    return {"count": len(templates), "templates": templates}


@router.post("/templates/sync", summary="Sync template approval statuses directly from Meta Graph API")
async def sync_templates_endpoint():
    """Sync message template statuses from Meta Graph API (v25.0) like AiSensy."""
    templates = await sync_templates_from_meta()
    return {"success": True, "count": len(templates), "templates": templates, "message": "Template statuses synced with Meta!"}


@router.post("/templates", summary="Add or update a WhatsApp template")
async def create_template_endpoint(body: TemplateRequest):
    """
    Submit a new custom WhatsApp template to Meta Graph API first.
    Only save locally if Meta Graph API accepts the template!
    """
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Template system name is required.")
    if not body.body_preview.strip():
        raise HTTPException(status_code=400, detail="Template body text is required.")

    template_dict = body.dict()
    # 1. Submit directly to Meta Graph API v25.0
    meta_res = await submit_template_to_meta(template_dict)
    
    # 2. If Meta Graph API rejects or returns error, fail request without saving to DB!
    if not meta_res.get("submitted"):
        err_detail = meta_res.get("error") or "Failed to submit template to Meta Graph API."
        raise HTTPException(status_code=400, detail=f"Meta Graph API Error: {err_detail}")

    # 3. Save to DB with Meta's actual returned status (PENDING / APPROVED) and versioned name
    template_dict["status"] = meta_res.get("status", "PENDING")
    if meta_res.get("name"):
        template_dict["name"] = meta_res["name"]
    res = save_template(template_dict)
    
    return {
        "success": True,
        "template": res,
        "message": f"Template '{body.display_name}' created and submitted to Meta! Status: {res['status']}",
        "meta_info": meta_res,
    }


@router.patch("/templates/{name}", summary="Update an existing WhatsApp template")
async def update_template_endpoint(name: str, body: TemplateRequest):
    """Update an existing custom WhatsApp template."""
    body_dict = body.dict()
    body_dict["name"] = name
    res = save_template(body_dict)
    return {"success": True, "template": res, "message": f"Template '{name}' updated successfully!"}


@router.delete("/templates/{name}", summary="Delete a custom WhatsApp template from Meta and DB")
async def delete_template_endpoint(name: str):
    """Delete a custom WhatsApp template from Meta WABA account and local DB."""
    result = await delete_template(name)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", f"Failed to delete template '{name}'."))
    return result


@router.get("/audiences", summary="Resolve audience recipient count preview and list")
async def preview_audience_endpoint(
    audience_type: str = Query(..., description="Audience type: teachers_all, customers_all, custom_numbers"),
    audience_filter: Optional[str] = Query(None),
):
    """Preview recipient count and sample for an audience selection."""
    recipients = await resolve_audience(audience_type, audience_filter)
    sample = recipients[:5] if recipients else []
    return {
        "audience_type": audience_type,
        "total_count": len(recipients),
        "sample": sample,
        "recipients": recipients,
    }


@router.get("/campaigns", summary="List all WhatsApp campaigns")
async def list_campaigns_endpoint():
    """Return list of all campaigns with aggregate stats."""
    campaigns = await list_campaigns()
    return {"count": len(campaigns), "campaigns": campaigns}


@router.post("/campaigns", summary="Create a new WhatsApp campaign")
async def create_campaign_endpoint(
    body: CreateCampaignRequest,
    background_tasks: BackgroundTasks,
):
    """
    Create campaign record, freeze recipient snapshot, and start execution if requested.
    """
    if not body.campaign_name.strip():
        raise HTTPException(status_code=400, detail="Campaign name is required.")
    if not body.template_name.strip():
        raise HTTPException(status_code=400, detail="Template name is required.")

    campaign = await create_campaign(
        campaign_name=body.campaign_name,
        template_name=body.template_name,
        audience_type=body.audience_type,
        audience_filter=body.audience_filter or "",
        variables=body.variables or {},
        scheduled_at=body.scheduled_at,
        created_by=body.created_by or "Admin",
    )

    campaign_id = campaign.get("id")

    # If send immediately (no scheduled_at), trigger background sender
    if campaign_id and not body.scheduled_at:
        asyncio.create_task(process_campaign_queue(campaign_id))

    return {
        "success": True,
        "campaign": campaign,
        "message": f"Campaign #{campaign_id} '{body.campaign_name}' created successfully with {campaign.get('total_recipients', 0)} recipients."
    }


@router.get("/campaigns/{campaign_id}", summary="Get campaign details & statistics")
async def get_campaign_endpoint(campaign_id: int):
    campaign = await get_campaign_details(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail=f"Campaign #{campaign_id} not found.")
    return campaign


@router.get("/campaigns/{campaign_id}/recipients", summary="Get paginated campaign recipients")
async def get_campaign_recipients_endpoint(
    campaign_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None, description="Filter status: queued, sent, delivered, read, failed, cancelled"),
):
    return await get_campaign_recipients(
        campaign_id=campaign_id,
        page=page,
        size=size,
        status_filter=status,
    )


@router.post("/campaigns/{campaign_id}/send", summary="Trigger immediate sending for campaign")
async def send_campaign_now_endpoint(
    campaign_id: int,
    background_tasks: BackgroundTasks,
):
    campaign = await get_campaign_details(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail=f"Campaign #{campaign_id} not found.")

    if campaign.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Campaign has already been completed.")

    asyncio.create_task(process_campaign_queue(campaign_id))
    return {"success": True, "message": f"Campaign #{campaign_id} send process started in background."}


@router.post("/campaigns/{campaign_id}/cancel", summary="Cancel a scheduled/queued campaign")
async def cancel_campaign_endpoint(campaign_id: int):
    success = await cancel_campaign(campaign_id)
    return {"success": success, "message": f"Campaign #{campaign_id} has been cancelled."}


@router.delete("/campaigns/{campaign_id}", summary="Delete a campaign and its recipient logs")
async def delete_campaign_endpoint(campaign_id: int):
    success = await delete_campaign(campaign_id)
    return {"success": success, "message": f"Campaign #{campaign_id} deleted."}


@router.post("/campaigns/{campaign_id}/retry-failed", summary="Retry failed recipients")
async def retry_failed_endpoint(campaign_id: int):
    count = await retry_failed_recipients(campaign_id)
    return {"success": True, "requeued_count": count, "message": f"Re-queued {count} failed recipients for campaign #{campaign_id}."}
