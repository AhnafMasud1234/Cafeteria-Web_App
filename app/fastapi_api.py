# app/fastapi_api.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.storage.memory_repo import list_items, get_item_by_id, add_item

router = APIRouter(prefix="/api", tags=["items"])


# ----- Pydantic models (request/response schemas) ----- #

class ItemBase(BaseModel):
    name: str
    category: str
    price: float
    quantity: int
    available: bool = True


class ItemOut(ItemBase):
    id: int


# ----- Endpoints (adapted from Flask) ----- #

@router.get("/items", response_model=list[ItemOut])
def get_items():
    # Reuse your existing storage logic
    return [item.to_dict() for item in list_items()]


@router.get("/items/{item_id}", response_model=ItemOut)
def get_single_item(item_id: int):
    item = get_item_by_id(item_id)
    if item is None:
        # Flask: return jsonify({"error": "Item not found"}), 404
        # FastAPI: raise HTTPException
        raise HTTPException(status_code=404, detail="Item not found")
    return item.to_dict()


@router.post("/items", response_model=ItemOut, status_code=201)
def create_item(payload: ItemBase):
    # validation similar to your Flask version
    if payload.price < 0 or payload.quantity < 0:
        raise HTTPException(status_code=400, detail="price and quantity must be non-negative")

    item = add_item(
        name=payload.name,
        category=payload.category,
        price=payload.price,
        quantity=payload.quantity,
        available=payload.available,
    )
    return item.to_dict()