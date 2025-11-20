# tests/test_items_api_fastapi.py

from fastapi.testclient import TestClient
from app.fastapi_app import app

# Create a TestClient for the FastAPI app
client = TestClient(app)


def test_fastapi_get_items_ok():
    resp = client.get("/api/items")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert {"id", "name", "category", "price", "available", "quantity"} <= set(data[0].keys())


def test_fastapi_get_single_item_ok():
    resp = client.get("/api/items/1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == 1


def test_fastapi_get_single_item_not_found():
    resp = client.get("/api/items/999999")
    assert resp.status_code == 404
    body = resp.json()
    # FastAPI uses "detail" key for error messages
    assert body["detail"] == "Item not found"


def test_fastapi_create_item_success():
    payload = {
        "name": "FastAPI Pizza",
        "category": "main",
        "price": 8.5,
        "quantity": 4,
        "available": True,
    }
    resp = client.post("/api/items", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "FastAPI Pizza"
    assert data["quantity"] == 4
    assert data["available"] is True


def test_fastapi_create_item_negative_price_or_quantity():
    payload = {
        "name": "Broken Item",
        "category": "snack",
        "price": -1.0,
        "quantity": 1,
        "available": True,
    }
    resp = client.post("/api/items", json=payload)
    assert resp.status_code == 400
    data = resp.json()
    assert data["detail"] == "price and quantity must be non-negative"