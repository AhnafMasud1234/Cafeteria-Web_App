# app/storage/memory_repo.py

from typing import List, Optional

from app.core.models import CafeteriaItem, Order

# -------------------------------------------------
# ITEMS (existing logic)
# -------------------------------------------------

_items: List[CafeteriaItem] = [
    CafeteriaItem(id=1, name="Chicken Biryani", category="main",  price=4.50, available=True,  quantity=20),
    CafeteriaItem(id=2, name="Veg Sandwich",   category="snack", price=2.00, available=True,  quantity=15),
    CafeteriaItem(id=3, name="Coffee",         category="drink", price=1.50, available=False, quantity=0),
]


def list_items() -> List[CafeteriaItem]:
    return _items


def get_item_by_id(item_id: int) -> Optional[CafeteriaItem]:
    for item in _items:
        if item.id == item_id:
            return item
    return None


_next_item_id = 4  # next ID after 1, 2, 3


def add_item(
    name: str,
    category: str,
    price: float,
    quantity: int,
    available: bool = True,
) -> CafeteriaItem:
    global _next_item_id
    item = CafeteriaItem(
        id=_next_item_id,
        name=name,
        category=category,
        price=price,
        available=available,
        quantity=quantity,
    )
    _items.append(item)
    _next_item_id += 1
    return item


def update_item(
    item_id: int,
    name: Optional[str] = None,
    category: Optional[str] = None,
    price: Optional[float] = None,
    quantity: Optional[int] = None,
    available: Optional[bool] = None,
) -> Optional[CafeteriaItem]:
    item = get_item_by_id(item_id)
    if item is None:
        return None

    if name is not None:
        item.name = name
    if category is not None:
        item.category = category
    if price is not None:
        item.price = price
    if quantity is not None:
        item.quantity = quantity
    if available is not None:
        item.available = available

    return item


def delete_item(item_id: int) -> bool:
    global _items
    for i, item in enumerate(_items):
        if item.id == item_id:
            del _items[i]
            return True
    return False


# -------------------------------------------------
# ORDERS (new dynamic behavior)
# -------------------------------------------------

_orders: List[Order] = []
_next_order_id: int = 1


def list_orders() -> List[Order]:
    """
    Returns all orders (for admin side).
    """
    return _orders


def get_order_by_id(order_id: int) -> Optional[Order]:
    for order in _orders:
        if order.id == order_id:
            return order
    return None


def create_order_for_item(item: CafeteriaItem, quantity: int) -> Order:
    """
    Create an order for a given item and quantity.

    Business rules (dynamic backend behavior):
    - If quantity requested > available -> error
    - Decrease item.quantity by quantity
    - If item.quantity reaches 0 -> set available = False
    - Create Order with status 'pending'
    """
    global _next_order_id

    if quantity <= 0:
        raise ValueError("Quantity must be greater than zero")

    if item.quantity < quantity:
        raise ValueError("Not enough quantity available")

    # update item stock
    item.quantity -= quantity
    if item.quantity == 0:
        item.available = False

    total_price = item.price * quantity

    order = Order(
        id=_next_order_id,
        item_id=item.id,
        quantity=quantity,
        total_price=total_price,
        status="pending",
    )
    _orders.append(order)
    _next_order_id += 1
    return order


def update_order_status(order_id: int, new_status: str) -> Optional[Order]:
    """
    Update the status of an order (e.g. from 'pending' to 'completed').
    This is for the 'admin side'.
    """
    order = get_order_by_id(order_id)
    if order is None:
        return None
    order.status = new_status
    return order