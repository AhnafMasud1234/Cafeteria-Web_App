

from dataclasses import dataclass, field
from typing import Optional, Any, Dict, List
from datetime import datetime


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
    description: Optional[str] = None
    
    # Dietary information
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_gluten_free: bool = False
    allergens: List[str] = field(default_factory=list)
    
    # Promotions
    is_daily_special: bool = False
    discount_percentage: float = 0.0
    calories: Optional[int] = None
    preparation_time: Optional[int] = None  # in minutes

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
            "description": self.description,
            "is_vegetarian": self.is_vegetarian,
            "is_vegan": self.is_vegan,
            "is_gluten_free": self.is_gluten_free,
            "allergens": self.allergens,
            "is_daily_special": self.is_daily_special,
            "discount_percentage": self.discount_percentage,
            "calories": self.calories,
            "preparation_time": self.preparation_time,
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
            description=d.get("description"),
            is_vegetarian=bool(d.get("is_vegetarian", False)),
            is_vegan=bool(d.get("is_vegan", False)),
            is_gluten_free=bool(d.get("is_gluten_free", False)),
            allergens=d.get("allergens", []),
            is_daily_special=bool(d.get("is_daily_special", False)),
            discount_percentage=float(d.get("discount_percentage", 0.0)),
            calories=d.get("calories"),
            preparation_time=d.get("preparation_time"),
        )


@dataclass
class Order:
    id: int
    item_id: int
    quantity: int
    total_price: float
    status: str = "pending"
    customer_id: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None
    created_at: Optional[str] = None
    estimated_ready_at: Optional[str] = None
    completed_at: Optional[str] = None
    notes: Optional[str] = None

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
        if self.completed_at is not None:
            out["completed_at"] = self.completed_at
        if self.notes is not None:
            out["notes"] = self.notes
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
            completed_at=d.get("completed_at"),
            notes=d.get("notes"),
        )


@dataclass
class UserFavorite:
    customer_id: str
    item_id: int
    added_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "customer_id": self.customer_id,
            "item_id": self.item_id,
            "added_at": self.added_at.isoformat() if self.added_at else None,
        }