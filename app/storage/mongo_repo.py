# app/storage/mongo_repo.py

from typing import List, Optional

from pymongo import MongoClient
from app.core.models import CafeteriaItem, Order

# -----------------------------------------
# MongoDB connection & collections
# -----------------------------------------

client = MongoClient("mongodb://localhost:27017")
db = client["cafeteria_db"]

items_col = db["items"]
orders_col = db["orders"]


def _doc_to_item(doc: dict) -> CafeteriaItem:
    return CafeteriaItem(
        id=doc["id"],
        name=doc["name"],
        category=doc["category"],
        price=doc["price"],
        quantity=doc["quantity"],
        available=doc["available"],
    )


def _item_to_doc(item: CafeteriaItem) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "price": item.price,
        "quantity": item.quantity,
        "available": item.available,
    }


def _doc_to_order(doc: dict) -> Order:
    return Order(
        id=doc["id"],
        item_id=doc["item_id"],
        quantity=doc["quantity"],
        total_price=doc["total_price"],
        status=doc["status"],
    )


def _order_to_doc(order: Order) -> dict:
    return {
        "id": order.id,
        "item_id": order.item_id,
        "quantity": order.quantity,
        "total_price": order.total_price,
        "status": order.status,
    }


# -----------------------------------------
# Seed initial items if empty
# -----------------------------------------

def _seed_initial_items():
    if items_col.count_documents({}) == 0:
        items_col.insert_many([
            {
                "id": 1,
                "name": "Chicken Biryani",
                "category": "main",
                "price": 4.50,
                "quantity": 20,
                "available": True,
            },
            {
                "id": 2,
                "name": "Veg Sandwich",
                "category": "snack",
                "price": 2.00,
                "quantity": 15,
                "available": True,
            },
            {
                "id": 3,
                "name": "Coffee",
                "category": "drink",
                "price": 1.50,
                "quantity": 0,
                "available": False,
            },
        ])


_seed_initial_items()


# -----------------------------------------
# ITEMS (Mongo-backed)
# -----------------------------------------

def list_items() -> List[CafeteriaItem]:
    docs = items_col.find({})
    return [_doc_to_item(d) for d in docs]


def get_item_by_id(item_id: int) -> Optional[CafeteriaItem]:
    doc = items_col.find_one({"id": item_id})
    if doc is None:
        return None
    return _doc_to_item(doc)


def _get_next_item_id() -> int:
    last = items_col.find_one(sort=[("id", -1)])
    if not last:
        return 1
    return last["id"] + 1


def add_item(
    name: str,
    category: str,
    price: float,
    quantity: int,
    available: bool = True,
) -> CafeteriaItem:
    new_id = _get_next_item_id()
    item = CafeteriaItem(
        id=new_id,
        name=name,
        category=category,
        price=price,
        quantity=quantity,
        available=available,
    )
    items_col.insert_one(_item_to_doc(item))
    return item


def update_item(
    item_id: int,
    name: Optional[str] = None,
    category: Optional[str] = None,
    price: Optional[float] = None,
    quantity: Optional[int] = None,
    available: Optional[bool] = None,
) -> Optional[CafeteriaItem]:
    update_fields = {}
    if name is not None:
        update_fields["name"] = name
    if category is not None:
        update_fields["category"] = category
    if price is not None:
        update_fields["price"] = price
    if quantity is not None:
        update_fields["quantity"] = quantity
    if available is not None:
        update_fields["available"] = available

    if not update_fields:
        return get_item_by_id(item_id)

    result = items_col.update_one({"id": item_id}, {"$set": update_fields})
    if result.matched_count == 0:
        return None

    return get_item_by_id(item_id)


def delete_item(item_id: int) -> bool:
    result = items_col.delete_one({"id": item_id})
    return result.deleted_count == 1


# -----------------------------------------
# ORDERS (Mongo-backed)
# -----------------------------------------

def list_orders() -> List[Order]:
    docs = orders_col.find({})
    return [_doc_to_order(d) for d in docs]


def get_order_by_id(order_id: int) -> Optional[Order]:
    doc = orders_col.find_one({"id": order_id})
    if doc is None:
        return None
    return _doc_to_order(doc)


def _get_next_order_id() -> int:
    last = orders_col.find_one(sort=[("id", -1)])
    if not last:
        return 1
    return last["id"] + 1


def create_order_for_item(item: CafeteriaItem, quantity: int) -> Order:
    """
    Create an order for a given item and quantity.

    Business rules:
    - If quantity requested > available -> error
    - Decrease item.quantity by quantity
    - If item.quantity reaches 0 -> set available = False
    - Create Order with status 'pending'
    """
    if quantity <= 0:
        raise ValueError("Quantity must be greater than zero")

    # Refresh item from DB to avoid stale data
    current_doc = items_col.find_one({"id": item.id})
    if current_doc is None:
        raise ValueError("Item not found")

    current_quantity = current_doc["quantity"]
    if current_quantity < quantity:
        raise ValueError("Not enough quantity available")

    new_quantity = current_quantity - quantity
    new_available = new_quantity > 0

    items_col.update_one(
        {"id": item.id},
        {"$set": {"quantity": new_quantity, "available": new_available}},
    )

    total_price = current_doc["price"] * quantity

    new_id = _get_next_order_id()
    order = Order(
        id=new_id,
        item_id=item.id,
        quantity=quantity,
        total_price=total_price,
        status="pending",
    )

    orders_col.insert_one(_order_to_doc(order))
    return order


def update_order_status(order_id: int, new_status: str) -> Optional[Order]:
    result = orders_col.update_one(
        {"id": order_id},
        {"$set": {"status": new_status}},
    )
    if result.matched_count == 0:
        return None

    return get_order_by_id(order_id)