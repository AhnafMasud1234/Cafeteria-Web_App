# tests/test_items_api_fastapi.py

from fastapi.testclient import TestClient
from app.fastapi_app import app

# Single TestClient shared by all tests
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
    # FastAPI uses "detail" for errors
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


def test_fastapi_update_item_success():
    # First create an item to update
    create_resp = client.post("/api/items", json={
        "name": "Old Fries",
        "category": "snack",
        "price": 3.0,
        "quantity": 10,
        "available": True,
    })
    assert create_resp.status_code == 201
    created = create_resp.json()
    item_id = created["id"]

    # Now update it
    update_resp = client.put(f"/api/items/{item_id}", json={
        "price": 3.5,
        "quantity": 5,
        "available": False,
    })
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["price"] == 3.5
    assert updated["quantity"] == 5
    assert updated["available"] is False


def test_fastapi_update_item_not_found():
    resp = client.put("/api/items/999999", json={"price": 10})
    assert resp.status_code == 404
    data = resp.json()
    assert data["detail"] == "Item not found"


def test_fastapi_delete_item_success():
    # Create an item to delete
    create_resp = client.post("/api/items", json={
        "name": "Temp Item",
        "category": "drink",
        "price": 1.0,
        "quantity": 2,
        "available": True,
    })
    assert create_resp.status_code == 201
    item_id = create_resp.json()["id"]

    # Delete it
    delete_resp = client.delete(f"/api/items/{item_id}")
    assert delete_resp.status_code == 204

    # Confirm it's gone
    get_resp = client.get(f"/api/items/{item_id}")
    assert get_resp.status_code == 404


def test_fastapi_filter_items_by_available_and_category():
    # Ensure there is at least one available drink
    client.post("/api/items", json={
        "name": "Filter Test Drink",
        "category": "drink",
        "price": 2.0,
        "quantity": 5,
        "available": True,
    })

    resp = client.get("/api/items", params={"available": True, "category": "drink"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert all(item["available"] is True for item in data)
    assert all(item["category"] == "drink" for item in data)