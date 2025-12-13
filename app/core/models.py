# app/core/models.py

from dataclasses import dataclass
from typing import Optional, Any, Dict, List


@dataclass
class CafeteriaItem:
    id: int
    name: str
    category: str
    price: float
    quantity: int
    available: bool
    image_url: Optional[str] = None
    rating_avg: float = 0.0
    rating_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "price": self.price,
            "quantity": self.quantity,
            "available": self.available,
            "image_url": self.image_url,
            "rating_avg": self.rating_avg,
            "rating_count": self.rating_count,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "CafeteriaItem":
        return cls(
            id=int(d["id"]),
            name=d["name"],
            category=d["category"],
            price=float(d["price"]),
            quantity=int(d["quantity"]),
            available=bool(d["available"]),
            image_url=d.get("image_url"),
            rating_avg=float(d.get("rating_avg", 0.0)),
            rating_count=int(d.get("rating_count", 0)),
        )


@dataclass
class Order:
    # Keep this simple — it mainly exists to satisfy memory_repo / flask_api imports.
    id: int
    item_id: int
    quantity: int
    total_price: float
    status: str = "pending"

    # Optional extra fields for newer logic (won't break old code)
    customer_id: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None
    created_at: Optional[str] = None
    estimated_ready_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        out = {
            "id": self.id,
            "item_id": self.item_id,
            "quantity": self.quantity,
            "total_price": self.total_price,
            "status": self.status,
        }
        if self.customer_id is not None:
            out["customer_id"] = self.customer_id
        if self.items is not None:
            out["items"] = self.items
        if self.created_at is not None:
            out["created_at"] = self.created_at
        if self.estimated_ready_at is not None:
            out["estimated_ready_at"] = self.estimated_ready_at
        return out

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Order":
        return cls(
            id=int(d["id"]),
            item_id=int(d.get("item_id", 0)),
            quantity=int(d.get("quantity", 0)),
            total_price=float(d.get("total_price", 0.0)),
            status=d.get("status", "pending"),
            customer_id=d.get("customer_id"),
            items=d.get("items"),
            created_at=d.get("created_at"),
            estimated_ready_at=d.get("estimated_ready_at"),
        )