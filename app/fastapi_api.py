# app/fastapi_api.py

from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.storage.mongo_repo import (
    list_items,
    get_item_by_id,
    add_item,
    update_item,
    delete_item,
    add_rating,
    get_top_rated_items,
    create_order,
    list_orders,
    get_order_by_id,
    update_order_status,
    get_top_selling_items,
)

router = APIRouter(prefix="/api", tags=["items"])

# --------------------------
# ITEMS
# --------------------------

class ItemBase(BaseModel):
    name: str
    category: str
    price: float
    quantity: int
    available: bool = True
    image_url: Optional[str] = None


class ItemOut(ItemBase):
    id: int
    rating_avg: float = 0.0
    rating_count: int = 0


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    available: Optional[bool] = None
    image_url: Optional[str] = None


@router.get("/items", response_model=List[ItemOut])
def get_items(
    available: Optional[bool] = None,
    category: Optional[str] = None,
):
    items = [item.to_dict() for item in list_items()]
    if available is not None:
        items = [it for it in items if it["available"] == available]
    if category is not None:
        items = [it for it in items if it["category"] == category]
    return items


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
        image_url=payload.image_url,
    )
    return item.to_dict()


@router.put("/items/{item_id}", response_model=ItemOut)
def update_item_route(item_id: int, payload: ItemUpdate):
    try:
        updated = update_item(
            item_id=item_id,
            name=payload.name,
            category=payload.category,
            price=payload.price,
            quantity=payload.quantity,
            available=payload.available,
            image_url=payload.image_url,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if updated is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return updated.to_dict()


@router.delete("/items/{item_id}", status_code=204)
def delete_item_route(item_id: int):
    ok = delete_item(item_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Item not found")
    return


# ---- Ratings ----

class RatingIn(BaseModel):
    rating: int = Field(..., ge=1, le=5)


@router.post("/items/{item_id}/rating")
def rate_item(item_id: int, payload: RatingIn):
    try:
        updated = add_rating(item_id, payload.rating)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if updated is None:
        raise HTTPException(status_code=404, detail="Item not found")

    return updated


@router.get("/items/top-rated")
def top_rated(limit: int = 5):
    return get_top_rated_items(limit=limit)


# --------------------------
# ORDERS (supports single item OR cart)
# --------------------------

class OrderItemIn(BaseModel):
    item_id: int
    quantity: int


class OrderCreateIn(BaseModel):
    customer_id: str = "guest"
    item_id: Optional[int] = None
    quantity: Optional[int] = None
    items: Optional[List[OrderItemIn]] = None


class OrderOut(BaseModel):
    id: int
    customer_id: str
    status: str
    items: list[dict]
    total_price: float
    created_at: Optional[datetime] = None
    estimated_ready_at: Optional[datetime] = None


class OrderStatusUpdate(BaseModel):
    status: str  # pending | preparing | ready | completed | cancelled


@router.post("/orders", response_model=OrderOut, status_code=201, tags=["orders"])
def create_order_endpoint(payload: OrderCreateIn):
    if payload.items and len(payload.items) > 0:
        items = [{"item_id": x.item_id, "quantity": x.quantity} for x in payload.items]
        try:
            return create_order(payload.customer_id, items)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    if payload.item_id is None or payload.quantity is None:
        raise HTTPException(status_code=400, detail="Provide either items[] or item_id + quantity")

    try:
        return create_order(payload.customer_id, [{"item_id": payload.item_id, "quantity": payload.quantity}])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders/{order_id}", response_model=OrderOut, tags=["orders"])
def get_order(order_id: int):
    doc = get_order_by_id(order_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return doc


@router.get("/orders", response_model=List[OrderOut], tags=["orders"])
def list_my_orders(customer_id: str = "guest"):
    return list_orders(customer_id=customer_id)


# --------------------------
# ADMIN / KITCHEN
# --------------------------

@router.get("/admin/orders", response_model=List[OrderOut], tags=["admin"])
def admin_orders():
    return list_orders(customer_id=None)


@router.put("/admin/orders/{order_id}/status", response_model=OrderOut, tags=["admin"])
def change_status(order_id: int, payload: OrderStatusUpdate):
    updated = update_order_status(order_id, payload.status)
    if updated is None:
        raise HTTPException(status_code=400, detail="Invalid order or status")
    return updated


# --------------------------
# ANALYTICS
# --------------------------

# Admin analytics (existing)
@router.get("/admin/analytics/top-selling", tags=["admin"])
def top_selling(limit: int = 5):
    return get_top_selling_items(limit=limit)

# Public/customer analytics (NEW)
@router.get("/analytics/top-selling", tags=["analytics"])
def top_selling_public(limit: int = 5):
    return get_top_selling_items(limit=limit)