# app/core/models.py

from dataclasses import dataclass


@dataclass
class CafeteriaItem:
    id: int
    name: str
    category: str
    price: float
    quantity: int
    available: bool

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "price": self.price,
            "quantity": self.quantity,
            "available": self.available,
        }


@dataclass
class Order:
    """
    Represents a simple order for a single item.
    Later you could extend this to support multiple items per order.
    """
    id: int
    item_id: int
    quantity: int
    total_price: float
    status: str = "pending"  # "pending" or "completed"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "item_id": self.item_id,
            "quantity": self.quantity,
            "total_price": self.total_price,
            "status": self.status,
        }