# app/fastapi_api.py

from typing import Optional, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.storage.mongo_repo import (
    list_items,
    get_item_by_id,
    add_item,
    update_item,
    delete_item,
    list_orders,
    get_order_by_id,
    create_order_for_item,
    update_order_status,
)

router = APIRouter(prefix="/api", tags=["items"])


# ----- Pydantic models (items) ----- #

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


# ----- Endpoints (items) ----- #

@router.get("/items", response_model=List[ItemOut])
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


# ==========================================
# ORDERS (dynamic backend behavior)
# ==========================================

# ----- Pydantic models (orders) ----- #

class OrderCreate(BaseModel):
    item_id: int
    quantity: int


class OrderOut(BaseModel):
    id: int
    item_id: int
    quantity: int
    total_price: float
    status: str


class OrderStatusUpdate(BaseModel):
    status: str  # "pending" or "completed"


# ----- User-side order endpoints ----- #

@router.post("/orders", response_model=OrderOut, status_code=201, tags=["orders"])
def create_order(payload: OrderCreate):
    """
    User places an order for a single item.

    Dynamic behavior:
    - Validate item exists
    - Validate enough quantity
    - Decrease stock
    - Mark item unavailable if stock reaches 0
    - Create order with status 'pending'
    """
    item = get_item_by_id(payload.item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    try:
        order = create_order_for_item(item, payload.quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return order.to_dict()


@router.get("/orders/{order_id}", response_model=OrderOut, tags=["orders"])
def get_order(order_id: int):
    """
    User sees their order details and status.
    """
    order = get_order_by_id(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order.to_dict()


# ----- Admin-side order endpoints ----- #

@router.get("/admin/orders", response_model=List[OrderOut], tags=["admin"])
def get_all_orders():
    """
    Admin side: see all orders and their status.
    """
    orders = [order.to_dict() for order in list_orders()]
    return orders


@router.put("/admin/orders/{order_id}/status", response_model=OrderOut, tags=["admin"])
def change_order_status(order_id: int, payload: OrderStatusUpdate):
    """
    Admin side: update order status from 'pending' to 'completed', etc.
    """
    if payload.status not in ("pending", "completed"):
        raise HTTPException(status_code=400, detail="Invalid status")

    order = update_order_status(order_id, payload.status)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    return order.to_dict()