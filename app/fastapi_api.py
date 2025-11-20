# app/fastapi_api.py

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.storage.memory_repo import (
    list_items,
    get_item_by_id,
    add_item,
    update_item,
    delete_item,
)

router = APIRouter(prefix="/api", tags=["items"])


# ----- Pydantic models (request/response schemas) ----- #

class ItemBase(BaseModel):
    name: str
    category: str
    price: float
    quantity: int
    available: bool = True


class ItemOut(ItemBase):
    id: int


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    available: Optional[bool] = None


# ----- Endpoints ----- #

@router.get("/items", response_model=list[ItemOut])
def get_items(
    available: Optional[bool] = None,
    category: Optional[str] = None,
):
    """
    List items, optionally filtered by availability and category.
    Example: /api/items?available=true&category=drink
    """
    items = [item.to_dict() for item in list_items()]

    if available is not None:
        items = [it for it in items if it["available"] == available]

    if category is not None:
        items = [it for it in items if it["category"] == category]

    return items


@router.get("/items/{item_id}", response_model=ItemOut)
def get_single_item(item_id: int):
    item = get_item_by_id(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item.to_dict()


@router.post("/items", response_model=ItemOut, status_code=201)
def create_item(payload: ItemBase):
    # validation similar to your Flask version
    if payload.price < 0 or payload.quantity < 0:
        raise HTTPException(status_code=400, detail="price and quantity must be non-negative")

    item = add_item(
        name=payload.name,
        category=payload.category,
        price=payload.price,
        quantity=payload.quantity,
        available=payload.available,
    )
    return item.to_dict()


@router.put("/items/{item_id}", response_model=ItemOut)
def update_item_route(item_id: int, payload: ItemUpdate):
    existing = get_item_by_id(item_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Item not found")

    # Validate non-negative fields if provided
    if payload.price is not None and payload.price < 0:
        raise HTTPException(status_code=400, detail="price must be non-negative")
    if payload.quantity is not None and payload.quantity < 0:
        raise HTTPException(status_code=400, detail="quantity must be non-negative")

    updated = update_item(
        item_id=item_id,
        name=payload.name,
        category=payload.category,
        price=payload.price,
        quantity=payload.quantity,
        available=payload.available,
    )
    return updated.to_dict()


@router.delete("/items/{item_id}", status_code=204)
def delete_item_route(item_id: int):
    ok = delete_item(item_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Item not found")
    # 204 No Content: no body returned
    return