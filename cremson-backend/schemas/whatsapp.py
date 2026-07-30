from typing import Optional
from pydantic import BaseModel, Field


class WhatsAppWebhookMessage(BaseModel):
    id: Optional[str] = None
    from_phone: Optional[str] = Field(None, alias="from")
    timestamp: Optional[str] = None
    text_body: Optional[str] = None
    type: Optional[str] = "text"


class WhatsAppWebhookPayload(BaseModel):
    object: Optional[str] = None
    entry: Optional[list] = None
