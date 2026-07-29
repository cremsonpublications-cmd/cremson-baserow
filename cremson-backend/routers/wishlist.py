from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from routers.auth import current_user
from db.auth import (
    get_wishlist,
    add_wishlist_item,
    remove_wishlist_item,
    clear_wishlist,
    sync_wishlist,
)

router = APIRouter()


class WishlistItemIn(BaseModel):
    product_id: int


class SyncWishlistRequest(BaseModel):
    product_ids: List[int]


@router.get("/")
async def list_wishlist(user: dict = Depends(current_user)):
    return {"product_ids": await get_wishlist(user["id"])}


@router.post("/", status_code=201)
async def add_to_wishlist(body: WishlistItemIn, user: dict = Depends(current_user)):
    await add_wishlist_item(user["id"], body.product_id)
    return {"product_ids": await get_wishlist(user["id"])}


@router.delete("/{product_id}", status_code=204)
async def remove_from_wishlist(product_id: int, user: dict = Depends(current_user)):
    await remove_wishlist_item(user["id"], product_id)


@router.delete("/", status_code=204)
async def empty_wishlist(user: dict = Depends(current_user)):
    await clear_wishlist(user["id"])


@router.post("/sync")
async def sync_wishlist_route(body: SyncWishlistRequest, user: dict = Depends(current_user)):
    return {"product_ids": await sync_wishlist(user["id"], body.product_ids)}
