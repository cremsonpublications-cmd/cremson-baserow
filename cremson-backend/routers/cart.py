from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from routers.auth import current_user
from db.auth import (
    get_cart,
    upsert_cart_item,
    remove_cart_item,
    clear_cart,
    sync_cart,
)

router = APIRouter()


class CartItemIn(BaseModel):
    product_id: int
    quantity: int = 1
    title: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    image: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None


class SyncCartItem(BaseModel):
    product_id: int
    quantity: int = 1
    title: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    image: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None


class SyncCartRequest(BaseModel):
    items: List[SyncCartItem]


@router.get("/")
async def list_cart(user: dict = Depends(current_user)):
    return await get_cart(user["id"])


@router.post("/", status_code=201)
async def add_or_update_cart(body: CartItemIn, user: dict = Depends(current_user)):
    if body.quantity < 1:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")
    snapshot = {
        "title": body.title,
        "price": body.price,
        "original_price": body.original_price,
        "image": body.image,
        "author": body.author,
        "category": body.category,
    }
    return await upsert_cart_item(user["id"], body.product_id, body.quantity, snapshot)


@router.put("/{product_id}")
async def update_cart_quantity(product_id: int, body: dict, user: dict = Depends(current_user)):
    quantity = body.get("quantity")
    if quantity is None or quantity < 1:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")
    items = await get_cart(user["id"])
    existing = next((i for i in items if int(i.get("product_id") or 0) == product_id), None)
    if not existing:
        raise HTTPException(status_code=404, detail="Item not in cart")
    snapshot = {k: existing[k] for k in ("title", "price", "original_price", "image", "author", "category")}
    return await upsert_cart_item(user["id"], product_id, quantity, snapshot)


@router.delete("/{product_id}", status_code=204)
async def remove_from_cart(product_id: int, user: dict = Depends(current_user)):
    await remove_cart_item(user["id"], product_id)


@router.delete("/", status_code=204)
async def empty_cart(user: dict = Depends(current_user)):
    await clear_cart(user["id"])


@router.post("/sync")
async def sync_cart_route(body: SyncCartRequest, user: dict = Depends(current_user)):
    items = [item.model_dump() for item in body.items]
    return await sync_cart(user["id"], items)
