from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from routers.auth import current_user
from db.auth import (
    get_addresses,
    get_address,
    create_address,
    update_address,
    delete_address,
    set_default_address,
)

router = APIRouter()


class AddressBody(BaseModel):
    label: Optional[str] = "Home"
    first_name: str
    last_name: str
    company: Optional[str] = ""
    street_address: str
    apartment: Optional[str] = ""
    city: str
    state: str
    pin_code: str
    phone: Optional[str] = ""
    country: Optional[str] = "India"
    is_default: Optional[bool] = False


class AddressUpdateBody(BaseModel):
    label: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    street_address: Optional[str] = None
    apartment: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None


@router.get("/")
async def list_addresses(user: dict = Depends(current_user)):
    return await get_addresses(user["id"])


@router.post("/", status_code=201)
async def add_address(body: AddressBody, user: dict = Depends(current_user)):
    result = await create_address(user["id"], body.model_dump())
    return {"message": "Address saved successfully", **result}


@router.put("/{address_id}")
async def edit_address(
    address_id: int,
    body: AddressUpdateBody,
    user: dict = Depends(current_user),
):
    result = await update_address(address_id, user["id"], {k: v for k, v in body.model_dump().items() if v is not None})
    if not result:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"message": "Address updated successfully", **result}


@router.delete("/{address_id}")
async def remove_address(address_id: int, user: dict = Depends(current_user)):
    if not await delete_address(address_id, user["id"]):
        raise HTTPException(status_code=404, detail="Address not found")
    return {"message": "Address deleted successfully"}


@router.put("/{address_id}/set-default")
async def make_default(address_id: int, user: dict = Depends(current_user)):
    result = await set_default_address(address_id, user["id"])
    if not result:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"message": "Default address updated", **result}
