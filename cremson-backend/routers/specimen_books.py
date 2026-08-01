from fastapi import APIRouter
from pathlib import Path
import json

router = APIRouter()

CONFIG_FILE = Path(__file__).parent.parent / "specimen_config.json"


def _read_config() -> list[int]:
    """Return the list of product IDs enabled for specimen requests."""
    if not CONFIG_FILE.exists():
        return []
    try:
        return json.loads(CONFIG_FILE.read_text())
    except Exception:
        return []


def _write_config(ids: list[int]) -> None:
    """Persist the list of enabled product IDs."""
    CONFIG_FILE.write_text(json.dumps(ids))


@router.get("/", summary="List specimen-eligible product IDs")
async def get_specimen_books():
    """Return the list of product IDs the admin has enabled for specimen requests."""
    return {"product_ids": _read_config()}


@router.post("/", summary="Set specimen-eligible product IDs")
async def set_specimen_books(body: dict):
    """Replace the full list of specimen-eligible product IDs.
    Body: { "product_ids": [1, 2, 3, ...] }
    """
    ids = [int(i) for i in body.get("product_ids", [])]
    _write_config(ids)
    return {"product_ids": ids}


@router.patch("/toggle/{product_id}", summary="Toggle a single product")
async def toggle_specimen_book(product_id: int):
    """Add or remove a single product from the specimen-eligible list."""
    ids = _read_config()
    if product_id in ids:
        ids.remove(product_id)
        enabled = False
    else:
        ids.append(product_id)
        enabled = True
    _write_config(ids)
    return {"product_id": product_id, "enabled": enabled, "product_ids": ids}
