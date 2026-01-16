
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
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
    add_favorite,
    remove_favorite,
    get_favorites,
    get_daily_specials,
)

router = APIRouter(prefix="/api", tags=["items"])



class ItemBase(BaseModel):
    name: str
    category: str
    price: float
    quantity: int
    available: bool = True
    image_url: Optional[str] = None
    description: Optional[str] = None
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_gluten_free: bool = False
    allergens: List[str] = []
    is_daily_special: bool = False
    discount_percentage: float = 0.0
    calories: Optional[int] = None
    preparation_time: Optional[int] = None


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
    description: Optional[str] = None
    is_vegetarian: Optional[bool] = None
    is_vegan: Optional[bool] = None
    is_gluten_free: Optional[bool] = None
    allergens: Optional[List[str]] = None
    is_daily_special: Optional[bool] = None
    discount_percentage: Optional[float] = None
    calories: Optional[int] = None
    preparation_time: Optional[int] = None


@router.get("/items", response_model=List[ItemOut])
def get_items(
    available: Optional[bool] = None,
    category: Optional[str] = None,
    vegetarian: Optional[bool] = Query(None, description="Filter vegetarian items"),
    vegan: Optional[bool] = Query(None, description="Filter vegan items"),
    gluten_free: Optional[bool] = Query(None, description="Filter gluten-free items"),
    daily_special: Optional[bool] = Query(None, description="Filter daily specials"),
):
    """Get all items with optional filters"""
    items = [item.to_dict() for item in list_items()]
    
    if available is not None:
        items = [it for it in items if it["available"] == available]
    if category is not None:
        items = [it for it in items if it["category"] == category]
    if vegetarian is True:
        items = [it for it in items if it["is_vegetarian"]]
    if vegan is True:
        items = [it for it in items if it["is_vegan"]]
    if gluten_free is True:
        items = [it for it in items if it["is_gluten_free"]]
    if daily_special is True:
        items = [it for it in items if it["is_daily_special"]]
    
    return items


@router.get("/items/{item_id}", response_model=ItemOut)
def get_single_item(item_id: int):
    """Get a single item by ID"""
    item = get_item_by_id(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item.to_dict()


@router.post("/items", response_model=ItemOut, status_code=201)
def create_item(payload: ItemBase):
    """Create a new item"""
    if payload.price < 0 or payload.quantity < 0:
        raise HTTPException(status_code=400, detail="price and quantity must be non-negative")

    item = add_item(
        name=payload.name,
        category=payload.category,
        price=payload.price,
        quantity=payload.quantity,
        available=payload.available,
        image_url=payload.image_url,
        description=payload.description,
        is_vegetarian=payload.is_vegetarian,
        is_vegan=payload.is_vegan,
        is_gluten_free=payload.is_gluten_free,
        allergens=payload.allergens,
        is_daily_special=payload.is_daily_special,
        discount_percentage=payload.discount_percentage,
        calories=payload.calories,
        preparation_time=payload.preparation_time,
    )
    return item.to_dict()


@router.put("/items/{item_id}", response_model=ItemOut)
def update_item_route(item_id: int, payload: ItemUpdate):
    """Update an existing item"""
    try:
        updated = update_item(
            item_id=item_id,
            name=payload.name,
            category=payload.category,
            price=payload.price,
            quantity=payload.quantity,
            available=payload.available,
            image_url=payload.image_url,
            description=payload.description,
            is_vegetarian=payload.is_vegetarian,
            is_vegan=payload.is_vegan,
            is_gluten_free=payload.is_gluten_free,
            allergens=payload.allergens,
            is_daily_special=payload.is_daily_special,
            discount_percentage=payload.discount_percentage,
            calories=payload.calories,
            preparation_time=payload.preparation_time,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if updated is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return updated.to_dict()


@router.delete("/items/{item_id}", status_code=204)
def delete_item_route(item_id: int):
    """Delete an item"""
    ok = delete_item(item_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Item not found")
    return




class RatingIn(BaseModel):
    rating: int = Field(..., ge=1, le=5)


@router.post("/items/{item_id}/rating")
def rate_item(item_id: int, payload: RatingIn):
    """Add a rating to an item"""
    try:
        updated = add_rating(item_id, payload.rating)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if updated is None:
        raise HTTPException(status_code=404, detail="Item not found")

    return updated




@router.get("/daily-specials", tags=["specials"])
def daily_specials():
    """Get today's daily specials"""
    return get_daily_specials()



@router.post("/favorites/{item_id}", tags=["favorites"])
def add_to_favorites(item_id: int, customer_id: str = Query(..., description="Customer ID")):
    """Add item to favorites"""
    success = add_favorite(customer_id, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Added to favorites", "item_id": item_id}


@router.delete("/favorites/{item_id}", tags=["favorites"])
def remove_from_favorites(item_id: int, customer_id: str = Query(..., description="Customer ID")):
    """Remove item from favorites"""
    success = remove_favorite(customer_id, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Removed from favorites", "item_id": item_id}


@router.get("/favorites", tags=["favorites"])
def get_my_favorites(customer_id: str = Query(..., description="Customer ID")):
    """Get user's favorite items"""
    favorite_ids = get_favorites(customer_id)
    items = [item.to_dict() for item in list_items() if item.id in favorite_ids]
    return items




class OrderItemIn(BaseModel):
    item_id: int
    quantity: int


class OrderCreateIn(BaseModel):
    customer_id: str = "guest"
    item_id: Optional[int] = None
    quantity: Optional[int] = None
    items: Optional[List[OrderItemIn]] = None
    notes: Optional[str] = None


class OrderOut(BaseModel):
    id: int
    customer_id: str
    status: str
    items: list[dict]
    total_price: float
    created_at: Optional[datetime] = None
    estimated_ready_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str  # pending | preparing | ready | completed | cancelled


@router.post("/orders", response_model=OrderOut, status_code=201, tags=["orders"])
def create_order_endpoint(payload: OrderCreateIn):
    """Create a new order"""
    if payload.items and len(payload.items) > 0:
        items = [{"item_id": x.item_id, "quantity": x.quantity} for x in payload.items]
        try:
            return create_order(payload.customer_id, items, payload.notes)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    if payload.item_id is None or payload.quantity is None:
        raise HTTPException(status_code=400, detail="Provide either items[] or item_id + quantity")

    try:
        return create_order(
            payload.customer_id,
            [{"item_id": payload.item_id, "quantity": payload.quantity}],
            payload.notes
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders/{order_id}", response_model=OrderOut, tags=["orders"])
def get_order(order_id: int):
    """Get order by ID"""
    doc = get_order_by_id(order_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return doc


@router.get("/orders", response_model=List[OrderOut], tags=["orders"])
def list_my_orders(customer_id: str = "guest"):
    """Get all orders for a customer"""
    return list_orders(customer_id=customer_id)




@router.get("/admin/orders", response_model=List[OrderOut], tags=["admin"])
def admin_orders():
    """Get all orders (admin only)"""
    return list_orders(customer_id=None)


@router.put("/admin/orders/{order_id}/status", response_model=OrderOut, tags=["admin"])
def change_status(order_id: int, payload: OrderStatusUpdate):
    """Update order status (admin only)"""
    updated = update_order_status(order_id, payload.status)
    if updated is None:
        raise HTTPException(status_code=400, detail="Invalid order or status")
    return updated



@router.get("/admin/analytics/top-selling", tags=["admin"])
def top_selling_admin(limit: int = 5):
    """Get top-selling items (admin)"""
    return get_top_selling_items(limit=limit)


@router.get("/analytics/top-selling", tags=["analytics"])
def top_selling_public(limit: int = 5):
    """Get top-selling items (public)"""
    return get_top_selling_items(limit=limit)


@router.get("/analytics/top-rated", tags=["analytics"])
def top_rated(limit: int = 5):
    """Get top-rated items"""
    return get_top_rated_items(limit=limit)




@router.get("/categories", tags=["categories"])
def get_categories():
    """Get list of all categories"""
    items = list_items()
    categories = list(set(item.category for item in items))
    return sorted(categories)




@router.get("/search", tags=["search"])
def search_items(
    q: str = Query(..., min_length=1, description="Search query"),
    category: Optional[str] = None,
):
    """Search items by name or description"""
    items = [item.to_dict() for item in list_items()]
    query = q.lower()
    
    results = [
        item for item in items
        if query in item["name"].lower() or
           (item.get("description") and query in item["description"].lower())
    ]
    
    if category:
        results = [item for item in results if item["category"] == category]
    
    return results