# app/storage/mongo_repo.py

from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional

from pymongo import MongoClient

from app.core.models import CafeteriaItem, UserFavorite

# MongoDB connection
client = MongoClient("mongodb://127.0.0.1:27017")
db = client["cafeteria_db"]

items_col = db["items"]
orders_col = db["orders"]
favorites_col = db["favorites"]

# Constants
VALID_STATUSES = {"pending", "preparing", "ready", "completed", "cancelled"}
BASE_PREP_MINUTES = 5
PER_ITEM_MINUTES = 2


def _seed_initial_items():
    """Seed database with enhanced sample items"""
    if items_col.count_documents({}) == 0:
        items_col.insert_many([
            {
                "id": 1,
                "name": "Chicken Biryani",
                "category": "main",
                "price": 4.50,
                "quantity": 20,
                "available": True,
                "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
                "rating_avg": 4.5,
                "rating_count": 12,
                "description": "Aromatic basmati rice with tender chicken pieces and authentic spices",
                "is_vegetarian": False,
                "is_vegan": False,
                "is_gluten_free": True,
                "allergens": [],
                "is_daily_special": True,
                "discount_percentage": 10,
                "calories": 550,
                "preparation_time": 15,
            },
            {
                "id": 2,
                "name": "Veg Sandwich",
                "category": "snack",
                "price": 2.00,
                "quantity": 15,
                "available": True,
                "image_url": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500",
                "rating_avg": 4.0,
                "rating_count": 8,
                "description": "Fresh vegetables with cheese on whole grain bread",
                "is_vegetarian": True,
                "is_vegan": False,
                "is_gluten_free": False,
                "allergens": ["gluten", "dairy"],
                "is_daily_special": False,
                "discount_percentage": 0,
                "calories": 280,
                "preparation_time": 5,
            },
            {
                "id": 3,
                "name": "Coffee",
                "category": "drink",
                "price": 1.50,
                "quantity": 20,
                "available": True,
                "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500",
                "rating_avg": 4.8,
                "rating_count": 25,
                "description": "Freshly brewed aromatic coffee",
                "is_vegetarian": True,
                "is_vegan": True,
                "is_gluten_free": True,
                "allergens": [],
                "is_daily_special": False,
                "discount_percentage": 0,
                "calories": 5,
                "preparation_time": 3,
            },
            {
                "id": 4,
                "name": "Caesar Salad",
                "category": "salad",
                "price": 3.50,
                "quantity": 10,
                "available": True,
                "image_url": "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500",
                "rating_avg": 4.3,
                "rating_count": 15,
                "description": "Crisp romaine lettuce with parmesan and croutons",
                "is_vegetarian": True,
                "is_vegan": False,
                "is_gluten_free": False,
                "allergens": ["gluten", "dairy", "eggs"],
                "is_daily_special": False,
                "discount_percentage": 0,
                "calories": 320,
                "preparation_time": 5,
            },
            {
                "id": 5,
                "name": "Margherita Pizza",
                "category": "main",
                "price": 5.00,
                "quantity": 12,
                "available": True,
                "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500",
                "rating_avg": 4.6,
                "rating_count": 20,
                "description": "Classic pizza with tomato, mozzarella, and fresh basil",
                "is_vegetarian": True,
                "is_vegan": False,
                "is_gluten_free": False,
                "allergens": ["gluten", "dairy"],
                "is_daily_special": True,
                "discount_percentage": 15,
                "calories": 650,
                "preparation_time": 12,
            },
            {
                "id": 6,
                "name": "Green Smoothie",
                "category": "drink",
                "price": 3.00,
                "quantity": 15,
                "available": True,
                "image_url": "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=500",
                "rating_avg": 4.2,
                "rating_count": 10,
                "description": "Healthy blend of spinach, banana, and mango",
                "is_vegetarian": True,
                "is_vegan": True,
                "is_gluten_free": True,
                "allergens": [],
                "is_daily_special": False,
                "discount_percentage": 0,
                "calories": 180,
                "preparation_time": 3,
            },
            {
                "id": 7,
                "name": "Chocolate Brownie",
                "category": "dessert",
                "price": 2.50,
                "quantity": 18,
                "available": True,
                "image_url": "https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=500",
                "rating_avg": 4.7,
                "rating_count": 30,
                "description": "Rich and fudgy chocolate brownie",
                "is_vegetarian": True,
                "is_vegan": False,
                "is_gluten_free": False,
                "allergens": ["gluten", "dairy", "eggs"],
                "is_daily_special": False,
                "discount_percentage": 0,
                "calories": 380,
                "preparation_time": 0,
            },
            {
                "id": 8,
                "name": "Falafel Wrap",
                "category": "main",
                "price": 4.00,
                "quantity": 14,
                "available": True,
                "image_url": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
                "rating_avg": 4.4,
                "rating_count": 18,
                "description": "Crispy falafel with fresh veggies in a warm wrap",
                "is_vegetarian": True,
                "is_vegan": True,
                "is_gluten_free": False,
                "allergens": ["gluten"],
                "is_daily_special": False,
                "discount_percentage": 0,
                "calories": 420,
                "preparation_time": 8,
            },
        ])


_seed_initial_items()


def _doc_to_item(doc: dict) -> CafeteriaItem:
    return CafeteriaItem(
        id=int(doc["id"]),
        name=doc["name"],
        category=doc["category"],
        price=float(doc["price"]),
        quantity=int(doc["quantity"]),
        available=bool(doc["available"]),
        image_url=doc.get("image_url"),
        rating_avg=float(doc.get("rating_avg", 0.0)),
        rating_count=int(doc.get("rating_count", 0)),
        description=doc.get("description"),
        is_vegetarian=bool(doc.get("is_vegetarian", False)),
        is_vegan=bool(doc.get("is_vegan", False)),
        is_gluten_free=bool(doc.get("is_gluten_free", False)),
        allergens=doc.get("allergens", []),
        is_daily_special=bool(doc.get("is_daily_special", False)),
        discount_percentage=float(doc.get("discount_percentage", 0.0)),
        calories=doc.get("calories"),
        preparation_time=doc.get("preparation_time"),
    )


def _get_next_item_id() -> int:
    last = items_col.find_one(sort=[("id", -1)])
    return 1 if not last else int(last["id"]) + 1


def _get_next_order_id() -> int:
    last = orders_col.find_one(sort=[("id", -1)])
    return 1 if not last else int(last["id"]) + 1


def _normalize_order_doc(doc: dict) -> dict:
    if doc is None:
        return None
    doc = dict(doc)
    doc.pop("_id", None)
    
    if "items" in doc and isinstance(doc["items"], list):
        doc.setdefault("customer_id", doc.get("customer_id", "guest"))
        return doc
    
    item_id = doc.get("item_id")
    qty = int(doc.get("quantity", 0))
    total_price = float(doc.get("total_price", 0.0))
    
    item_doc = items_col.find_one({"id": item_id}) if item_id is not None else None
    name = item_doc.get("name") if item_doc else f"Item {item_id}"
    unit_price = (
        float(item_doc.get("price"))
        if item_doc and qty > 0
        else (total_price / qty if qty > 0 else 0.0)
    )
    
    doc["customer_id"] = doc.get("customer_id", "guest")
    doc["items"] = [
        {
            "item_id": item_id,
            "name": name,
            "quantity": qty,
            "unit_price": unit_price,
            "line_total": unit_price * qty,
        }
    ]
    doc["total_price"] = total_price
    return doc


# ITEMS API
def list_items() -> List[CafeteriaItem]:
    return [_doc_to_item(d) for d in items_col.find({})]


def get_item_by_id(item_id: int) -> Optional[CafeteriaItem]:
    doc = items_col.find_one({"id": item_id})
    return _doc_to_item(doc) if doc else None


def add_item(
    name: str,
    category: str,
    price: float,
    quantity: int,
    available: bool = True,
    image_url: Optional[str] = None,
    description: Optional[str] = None,
    is_vegetarian: bool = False,
    is_vegan: bool = False,
    is_gluten_free: bool = False,
    allergens: List[str] = None,
    is_daily_special: bool = False,
    discount_percentage: float = 0.0,
    calories: Optional[int] = None,
    preparation_time: Optional[int] = None,
) -> CafeteriaItem:
    new_id = _get_next_item_id()
    doc = {
        "id": new_id,
        "name": name,
        "category": category,
        "price": float(price),
        "quantity": int(quantity),
        "available": (int(quantity) > 0) and bool(available),
        "image_url": image_url,
        "rating_avg": 0.0,
        "rating_count": 0,
        "description": description,
        "is_vegetarian": is_vegetarian,
        "is_vegan": is_vegan,
        "is_gluten_free": is_gluten_free,
        "allergens": allergens or [],
        "is_daily_special": is_daily_special,
        "discount_percentage": float(discount_percentage),
        "calories": calories,
        "preparation_time": preparation_time,
    }
    items_col.insert_one(doc)
    return _doc_to_item(doc)


def update_item(
    item_id: int,
    name: Optional[str] = None,
    category: Optional[str] = None,
    price: Optional[float] = None,
    quantity: Optional[int] = None,
    available: Optional[bool] = None,
    image_url: Optional[str] = None,
    description: Optional[str] = None,
    is_vegetarian: Optional[bool] = None,
    is_vegan: Optional[bool] = None,
    is_gluten_free: Optional[bool] = None,
    allergens: Optional[List[str]] = None,
    is_daily_special: Optional[bool] = None,
    discount_percentage: Optional[float] = None,
    calories: Optional[int] = None,
    preparation_time: Optional[int] = None,
) -> Optional[CafeteriaItem]:
    update_fields = {}
    
    if name is not None:
        update_fields["name"] = name
    if category is not None:
        update_fields["category"] = category
    if price is not None:
        update_fields["price"] = float(price)
    if image_url is not None:
        update_fields["image_url"] = image_url
    if description is not None:
        update_fields["description"] = description
    if is_vegetarian is not None:
        update_fields["is_vegetarian"] = is_vegetarian
    if is_vegan is not None:
        update_fields["is_vegan"] = is_vegan
    if is_gluten_free is not None:
        update_fields["is_gluten_free"] = is_gluten_free
    if allergens is not None:
        update_fields["allergens"] = allergens
    if is_daily_special is not None:
        update_fields["is_daily_special"] = is_daily_special
    if discount_percentage is not None:
        update_fields["discount_percentage"] = float(discount_percentage)
    if calories is not None:
        update_fields["calories"] = calories
    if preparation_time is not None:
        update_fields["preparation_time"] = preparation_time
    
    if quantity is not None:
        if quantity < 0:
            raise ValueError("quantity must be >= 0")
        update_fields["quantity"] = int(quantity)
        update_fields["available"] = int(quantity) > 0
    
    if available is not None:
        update_fields["available"] = bool(available)
    
    if not update_fields:
        return get_item_by_id(item_id)
    
    res = items_col.update_one({"id": item_id}, {"$set": update_fields})
    if res.matched_count == 0:
        return None
    
    return get_item_by_id(item_id)


def delete_item(item_id: int) -> bool:
    res = items_col.delete_one({"id": item_id})
    return res.deleted_count == 1


# RATINGS
def add_rating(item_id: int, rating: int) -> Optional[dict]:
    if rating < 1 or rating > 5:
        raise ValueError("rating must be between 1 and 5")
    
    doc = items_col.find_one({"id": item_id})
    if not doc:
        return None
    
    old_avg = float(doc.get("rating_avg", 0.0))
    old_count = int(doc.get("rating_count", 0))
    
    new_count = old_count + 1
    new_avg = (old_avg * old_count + rating) / new_count
    
    items_col.update_one(
        {"id": item_id},
        {"$set": {"rating_avg": new_avg, "rating_count": new_count}},
    )
    
    updated = items_col.find_one({"id": item_id}, {"_id": 0})
    return updated


def get_top_rated_items(limit: int = 5) -> list[dict]:
    docs = list(
        items_col.find({"rating_count": {"$gt": 0}}, {"_id": 0})
        .sort([("rating_avg", -1), ("rating_count", -1)])
        .limit(limit)
    )
    return docs


# ORDERS
def list_orders(customer_id: Optional[str] = None) -> list[dict]:
    if customer_id is None:
        docs = list(orders_col.find({}).sort([("id", -1)]))
        return [_normalize_order_doc(d) for d in docs]
    
    if customer_id == "guest":
        q = {
            "$or": [
                {"customer_id": "guest"},
                {"customer_id": {"$exists": False}},
            ]
        }
    else:
        q = {"customer_id": customer_id}
    
    docs = list(orders_col.find(q).sort([("id", -1)]))
    return [_normalize_order_doc(d) for d in docs]


def get_order_by_id(order_id: int) -> Optional[dict]:
    doc = orders_col.find_one({"id": order_id})
    return _normalize_order_doc(doc) if doc else None


def create_order(customer_id: str, items: list[dict], notes: Optional[str] = None) -> dict:
    if not items:
        raise ValueError("Order must contain at least one item")
    
    ids = [int(x["item_id"]) for x in items]
    db_items = list(items_col.find({"id": {"$in": ids}}))
    by_id = {int(d["id"]): d for d in db_items}
    
    total_qty = 0
    for req in items:
        iid = int(req["item_id"])
        qty = int(req["quantity"])
        if iid not in by_id:
            raise ValueError(f"Item {iid} not found")
        if qty <= 0:
            raise ValueError("Quantity must be >= 1")
        if int(by_id[iid]["quantity"]) < qty:
            raise ValueError(f"Not enough stock for item {iid}")
        total_qty += qty
    
    lines = []
    total = 0.0
    for req in items:
        iid = int(req["item_id"])
        qty = int(req["quantity"])
        d = by_id[iid]
        unit_price = float(d["price"])
        
        # Apply discount if item is daily special
        discount = float(d.get("discount_percentage", 0.0))
        if discount > 0:
            unit_price = unit_price * (1 - discount / 100)
        
        line_total = unit_price * qty
        total += line_total
        lines.append({
            "item_id": iid,
            "name": d["name"],
            "quantity": qty,
            "unit_price": unit_price,
            "line_total": line_total,
        })
    
    for req in items:
        iid = int(req["item_id"])
        qty = int(req["quantity"])
        current_qty = int(by_id[iid]["quantity"])
        new_qty = current_qty - qty
        items_col.update_one(
            {"id": iid},
            {"$set": {"quantity": new_qty, "available": new_qty > 0}},
        )
    
    eta_minutes = BASE_PREP_MINUTES + (total_qty * PER_ITEM_MINUTES)
    now = datetime.utcnow()
    
    oid = _get_next_order_id()
    order_doc = {
        "id": oid,
        "customer_id": customer_id,
        "status": "pending",
        "items": lines,
        "total_price": total,
        "created_at": now,
        "estimated_ready_at": now + timedelta(minutes=eta_minutes),
        "status_history": [{"status": "pending", "at": now}],
        "notes": notes,
    }
    
    orders_col.insert_one(order_doc)
    return _normalize_order_doc(order_doc)


def update_order_status(order_id: int, new_status: str) -> Optional[dict]:
    if new_status not in VALID_STATUSES:
        return None
    
    now = datetime.utcnow()
    update_fields = {
        "status": new_status,
        "updated_at": now,
    }
    
    if new_status == "completed":
        update_fields["completed_at"] = now
    
    res = orders_col.update_one(
        {"id": order_id},
        {
            "$set": update_fields,
            "$push": {"status_history": {"status": new_status, "at": now}},
        },
    )
    if res.matched_count == 0:
        return None
    return get_order_by_id(order_id)


# ANALYTICS
def get_top_selling_items(limit: int = 5) -> list[dict]:
    pipeline_cart = [
        {"$match": {"items": {"$exists": True}}},
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.item_id", "units_sold": {"$sum": "$items.quantity"}}},
    ]
    cart = list(orders_col.aggregate(pipeline_cart))
    
    pipeline_old = [
        {"$match": {"items": {"$exists": False}, "item_id": {"$exists": True}}},
        {"$group": {"_id": "$item_id", "units_sold": {"$sum": "$quantity"}}},
    ]
    old = list(orders_col.aggregate(pipeline_old))
    
    combined = {}
    for r in cart + old:
        iid = int(r["_id"])
        combined[iid] = combined.get(iid, 0) + int(r["units_sold"])
    
    out = []
    for iid, units in sorted(combined.items(), key=lambda x: x[1], reverse=True)[:limit]:
        item = items_col.find_one({"id": iid})
        out.append({
            "item_id": iid,
            "name": item["name"] if item else f"Item {iid}",
            "units_sold": units,
        })
    return out


# FAVORITES
def add_favorite(customer_id: str, item_id: int) -> bool:
    """Add item to user's favorites"""
    item = items_col.find_one({"id": item_id})
    if not item:
        return False
    
    # Check if already favorited
    existing = favorites_col.find_one({"customer_id": customer_id, "item_id": item_id})
    if existing:
        return True
    
    favorites_col.insert_one({
        "customer_id": customer_id,
        "item_id": item_id,
        "added_at": datetime.utcnow(),
    })
    return True


def remove_favorite(customer_id: str, item_id: int) -> bool:
    """Remove item from user's favorites"""
    res = favorites_col.delete_one({"customer_id": customer_id, "item_id": item_id})
    return res.deleted_count == 1


def get_favorites(customer_id: str) -> list[int]:
    """Get list of favorited item IDs for a customer"""
    docs = list(favorites_col.find({"customer_id": customer_id}))
    return [int(d["item_id"]) for d in docs]


def get_daily_specials() -> list[dict]:
    """Get items marked as daily specials"""
    docs = list(items_col.find({"is_daily_special": True}, {"_id": 0}))
    return docs