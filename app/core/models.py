
from dataclasses import dataclass

@dataclass
class CafeteriaItem:
    id: int
    name: str
    category: str
    price: float
    available: bool
    quantity: int

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "price": self.price,
            "available": self.available,
            "quantity": self.quantity,
        }