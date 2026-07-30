import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Simple thread-safe-ish in-memory TTL dictionary for conversation state
# Stores key: phone_number -> value: {"state": state_name, "context": dict_data, "updated_at": timestamp}
_STATE_STORE: Dict[str, Dict[str, Any]] = {}
DEFAULT_TTL_SECONDS = 1800  # 30 minutes


def get_conversation_state(phone: str, ttl: int = DEFAULT_TTL_SECONDS) -> Dict[str, Any]:
    """
    Retrieve conversation state for a phone number.
    If state is expired or not found, returns default main menu state.
    """
    clean_phone = "".join(filter(str.isdigit, str(phone)))
    if not clean_phone:
        return {"state": "MAIN_MENU", "context": {}}

    now = time.time()
    entry = _STATE_STORE.get(clean_phone)
    if not entry:
        return {"state": "MAIN_MENU", "context": {}}

    if now - entry.get("updated_at", 0) > ttl:
        logger.info(f"[State] Conversation state expired for {clean_phone}")
        _STATE_STORE.pop(clean_phone, None)
        return {"state": "MAIN_MENU", "context": {}}

    return {"state": entry.get("state", "MAIN_MENU"), "context": entry.get("context", {})}


def set_conversation_state(phone: str, state: str, context: Optional[Dict[str, Any]] = None) -> None:
    """Set or update conversation state for a phone number."""
    clean_phone = "".join(filter(str.isdigit, str(phone)))
    if not clean_phone:
        return

    _STATE_STORE[clean_phone] = {
        "state": state,
        "context": context or {},
        "updated_at": time.time(),
    }
    logger.info(f"[State] Updated state for {clean_phone} -> {state}")


def clear_conversation_state(phone: str) -> None:
    """Clear conversation state for a phone number."""
    clean_phone = "".join(filter(str.isdigit, str(phone)))
    if clean_phone in _STATE_STORE:
        del _STATE_STORE[clean_phone]
        logger.info(f"[State] Cleared state for {clean_phone}")
