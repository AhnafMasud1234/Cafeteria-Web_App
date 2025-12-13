# app/storage/mongo_repo.py

from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional

from pymongo import MongoClient

from app.core.models import CafeteriaItem

# -----------------------------
# Mongo connection
# -----------------------------
client = MongoClient("mongodb://127.0.0.1:27017")
db = client["cafeteria_db"]

items_col = db["items"]
orders_col = db["orders"]

# -----------------------------
# Constants / rules
# -----------------------------
VALID_STATUSES = {"pending", "preparing", "ready", "completed", "cancelled"}

# Kitchen ETA logic (simple, deterministic)
BASE_PREP_MINUTES = 5
PER_ITEM_MINUTES = 2


# -----------------------------
# Helpers
# -----------------------------
def _seed_initial_items():
    # Only seed if DB is empty
    if items_col.count_documents({}) == 0:
        items_col.insert_many(
            [
                {
                    "id": 1,
                    "name": "Chicken Biryani",
                    "category": "main",
                    "price": 4.50,
                    "quantity": 20,
                    "available": True,
                    "image_url": None,
                    "rating_avg": 0.0,
                    "rating_count": 0,
                },
                {
                    "id": 2,
                    "name": "Veg Sandwich",
                    "category": "snack",
                    "price": 2.00,
                    "quantity": 15,
                    "available": True,
                    "image_url": None,
                    "rating_avg": 0.0,
                    "rating_count": 0,
                },
                {
                    "id": 3,
                    "name": "Coffee",
                    "category": "drink",
                    "price": 1.50,
                    "quantity": 20,
                    "available": True,
                    "image_url": None,
                    "rating_avg": 0.0,
                    "rating_count": 0,
                },
            ]
        )


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
    )


def _get_next_item_id() -> int:
    last = items_col.find_one(sort=[("id", -1)])
    return 1 if not last else int(last["id"]) + 1


def _get_next_order_id() -> int:
    last = orders_col.find_one(sort=[("id", -1)])
    return 1 if not last else int(last["id"]) + 1


def _normalize_order_doc(doc: dict) -> dict:
    """
    Backward compatibility:
    - old format: {id, item_id, quantity, total_price, status}
    - new format: {id, customer_id, items:[...], total_price, status, created_at, estimated_ready_at}
    """
    if doc is None:
        return None

    doc = dict(doc)
    doc.pop("_id", None)

    # New format already
    if "items" in doc and isinstance(doc["items"], list):
        doc.setdefault("customer_id", doc.get("customer_id", "guest"))
        return doc

    # Old single-item order format -> convert to new format for API/UI
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


# -----------------------------
# ITEMS API for FastAPI
# -----------------------------
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
) -> CafeteriaItem:
    new_id = _get_next_item_id()
    doc = {
        "id": new_id,
        "name": name,
        "category": category,
        "price": float(price),
        "quantity": int(quantity),
        "available": bool(available),
        "image_url": image_url,
        "rating_avg": 0.0,
        "rating_count": 0,
    }
    # Keep availability consistent with stock
    doc["available"] = (doc["quantity"] > 0) and doc["available"]

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

    if quantity is not None:
        if quantity < 0:
            raise ValueError("quantity must be >= 0")
        update_fields["quantity"] = int(quantity)
        # default availability from quantity
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


# -----------------------------
# RATINGS
# -----------------------------
def add_rating(item_id: int, rating: int) -> Optional[dict]:
    """
    Stores rating as incremental average:
    rating_avg, rating_count.
    """
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


# -----------------------------
# ORDERS (single OR cart)
# -----------------------------
def list_orders(customer_id: Optional[str] = None) -> list[dict]:
    """
    Returns orders from MongoDB.
    - If customer_id is None: return ALL orders (admin view)
    - If customer_id is provided:
        - For "guest": return orders where customer_id=="guest" OR customer_id missing (old orders)
        - For any other customer_id: return only that customer's orders
    """
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


def create_order(customer_id: str, items: list[dict]) -> dict:
    """
    items: [{"item_id": int, "quantity": int}, ...]
    Kitchen sets:
      - status
      - ETA
    """
    if not items:
        raise ValueError("Order must contain at least one item")

    # Load items from DB
    ids = [int(x["item_id"]) for x in items]
    db_items = list(items_col.find({"id": {"$in": ids}}))
    by_id = {int(d["id"]): d for d in db_items}

    # Validate quantities & stock
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

    # Compute order lines + total
    lines = []
    total = 0.0
    for req in items:
        iid = int(req["item_id"])
        qty = int(req["quantity"])
        d = by_id[iid]
        unit_price = float(d["price"])
        line_total = unit_price * qty
        total += line_total
        lines.append(
            {
                "item_id": iid,
                "name": d["name"],
                "quantity": qty,
                "unit_price": unit_price,
                "line_total": line_total,
            }
        )

    # Decrement stock
    for req in items:
        iid = int(req["item_id"])
        qty = int(req["quantity"])
        current_qty = int(by_id[iid]["quantity"])
        new_qty = current_qty - qty
        items_col.update_one(
            {"id": iid},
            {"$set": {"quantity": new_qty, "available": new_qty > 0}},
        )

    # ETA
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
    }

    orders_col.insert_one(order_doc)
    return _normalize_order_doc(order_doc)


def update_order_status(order_id: int, new_status: str) -> Optional[dict]:
    if new_status not in VALID_STATUSES:
        return None

    now = datetime.utcnow()
    res = orders_col.update_one(
        {"id": order_id},
        {
            "$set": {"status": new_status, "updated_at": now},
            "$push": {"status_history": {"status": new_status, "at": now}},
        },
    )
    if res.matched_count == 0:
        return None
    return get_order_by_id(order_id)


# -----------------------------
# ANALYTICS
# -----------------------------
def get_top_selling_items(limit: int = 5) -> list[dict]:
    """
    Counts units sold per item across BOTH:
    - new cart orders (items list)
    - old single-item orders (item_id + quantity)
    """
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
        out.append(
            {
                "item_id": iid,
                "name": item["name"] if item else f"Item {iid}",
                "units_sold": units,
            }
        )
    return out