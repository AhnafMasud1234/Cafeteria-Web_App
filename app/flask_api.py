

from flask import Blueprint, jsonify, request  # 👈 added request
from app.storage.memory_repo import list_items, get_item_by_id, add_item  # 👈 added add_item

bp = Blueprint("api", __name__, url_prefix="/api")

@bp.get("/items")
def get_items():
    items = [item.to_dict() for item in list_items()]
    return jsonify(items), 200

@bp.get("/items/<int:item_id>")
def get_single_item(item_id: int):
    item = get_item_by_id(item_id)
    if item is None:
        return jsonify({"error": "Item not found"}), 404
    return jsonify(item.to_dict()), 200



@bp.post("/items")
def create_item():
    data = request.get_json(silent=True) or {}

    required_fields = ["name", "category", "price", "quantity"]
    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({"error": "Missing fields", "missing": missing}), 400

    try:
        name = str(data["name"])
        category = str(data["category"])
        price = float(data["price"])
        quantity = int(data["quantity"])
        available = bool(data.get("available", True))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid field types"}), 400

    if price < 0 or quantity < 0:
        return jsonify({"error": "price and quantity must be non-negative"}), 400

    item = add_item(
        name=name,
        category=category,
        price=price,
        quantity=quantity,
        available=available,
    )
    return jsonify(item.to_dict()), 201