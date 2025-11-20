from typing import List, Optional
from app.core.models import CafeteriaItem

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


_next_id = 4  # next ID after 1, 2, 3


def add_item(name: str, category: str, price: float, quantity: int, available: bool = True) -> CafeteriaItem:
    global _next_id
    item = CafeteriaItem(
        id=_next_id,
        name=name,
        category=category,
        price=price,
        available=available,
        quantity=quantity,
    )
    _items.append(item)
    _next_id += 1
    return item


# 👇 NEW: update + delete helpers


def update_item(
    item_id: int,
    name: Optional[str] = None,
    category: Optional[str] = None,
    price: Optional[float] = None,
    quantity: Optional[int] = None,
    available: Optional[bool] = None,
) -> Optional[CafeteriaItem]:
    """Update fields of an existing item. Returns updated item or None."""
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
    """Delete item by id. Returns True if deleted, False if not found."""
    global _items
    for i, item in enumerate(_items):
        if item.id == item_id:
            del _items[i]
            return True
    return False