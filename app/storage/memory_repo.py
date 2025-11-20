

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