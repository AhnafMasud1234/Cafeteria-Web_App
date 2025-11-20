

import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.testing = True
    with app.test_client() as client:
        yield client

def test_get_items_ok(client):
    resp = client.get("/api/items")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert {"id", "name", "category", "price", "available", "quantity"} <= set(data[0].keys())

def test_get_single_item_ok(client):
    resp = client.get("/api/items/1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["id"] == 1

def test_get_single_item_not_found(client):
    resp = client.get("/api/items/9999")
    assert resp.status_code == 404
    data = resp.get_json()
    assert "error" in data

def test_create_item_success(client):
    payload = {
        "name": "Test Pizza",
        "category": "main",
        "price": 7.5,
        "quantity": 3,
        "available": True,
    }
    resp = client.post("/api/items", json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["name"] == "Test Pizza"
    assert data["quantity"] == 3

def test_create_item_missing_fields(client):
    payload = {
        "name": "Broken Item",
        "price": 3.0,
    }
    resp = client.post("/api/items", json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert "missing" in data