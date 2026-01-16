from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get MongoDB URL from environment variable
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017")
client = MongoClient(MONGODB_URL)

db = client["cafeteria_db"]
items_collection = db["items"]
orders_collection = db["orders"]
favorites_collection = db["favorites"]


def seed_database():
    """Seed the database with initial menu items if empty."""
    if items_collection.count_documents({}) == 0:
        seed_items = [
            {
                "name": "Chicken Biryani",
                "category": "main",
                "price": 8.99,
                "quantity": 25,
                "available": True,
                "description": "Aromatic basmati rice cooked with tender chicken and traditional spices",
                "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8",
                "is_vegetarian": False,
                "is_vegan": False,
                "is_gluten_free": True,
                "allergens": ["dairy"],
                "calories": 650,
                "preparation_time": 15,
                "is_daily_special": True,
                "discount_percentage": 15.0,
                "units_sold": 0,
                "rating_sum": 0,
                "rating_count": 0,
            },
            {
                "name": "Veggie Supreme Pizza",
                "category": "main",
                "price": 7.50,
                "quantity": 20,
                "available": True,
                "description": "Fresh vegetables on a crispy crust with mozzarella cheese",
                "image_url": "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f",
                "is_vegetarian": True,
                "is_vegan": False,
                "is_gluten_free": False,
                "allergens": ["gluten", "dairy"],
                "calories": 550,
                "preparation_time": 12,
                "is_daily_special": False,
                "discount_percentage": 0,
                "units_sold": 0,
                "rating_sum": 0,
                "rating_count": 0,
            },
            {
                "name": "Caesar Salad",
                "category": "salad",
                "price": 5.99,
                "quantity": 30,
                "available": True,
                "description": "Crisp romaine lettuce with Caesar dressing, croutons, and parmesan",
                "image_url": "https://images.unsplash.com/photo-1546793665-c74683f339c1",
                "is_vegetarian": True,
                "is_vegan": False,
                "is_gluten_free": False,
                "allergens": ["gluten", "dairy", "eggs", "fish"],
                "calories": 350,
                "preparation_time": 5,
                "is_daily_special": False,
                "discount_percentage": 0,
                "units_sold": 0,
                "rating_sum": 0,
                "rating_count": 0,
            },
            {
                "name": "Chocolate Brownie",
                "category": "dessert",
                "price": 3.50,
                "quantity": 40,
                "available": True,
                "description": "Rich, fudgy chocolate brownie with a crispy top",
                "image_url": "https://images.unsplash.com/photo-1564355808853-df5480e8e1f7",
                "is_vegetarian": True,
                "is_vegan": False,
                "is_gluten_free": False,
                "allergens": ["gluten", "dairy", "eggs"],
                "calories": 450,
                "preparation_time": 3,
                "is_daily_special": True,
                "discount_percentage": 20.0,
                "units_sold": 0,
                "rating_sum": 0,
                "rating_count": 0,
            },
            {
                "name": "Fresh Orange Juice",
                "category": "drink",
                "price": 2.99,
                "quantity": 50,
                "available": True,
                "description": "Freshly squeezed orange juice, packed with vitamin C",
                "image_url": "https://images.unsplash.com/photo-1600271886742-f049cd451bba",
                "is_vegetarian": True,
                "is_vegan": True,
                "is_gluten_free": True,
                "allergens": [],
                "calories": 110,
                "preparation_time": 2,
                "is_daily_special": False,
                "discount_percentage": 0,
                "units_sold": 0,
                "rating_sum": 0,
                "rating_count": 0,
            },
            {
                "name": "Grilled Chicken Wrap",
                "category": "main",
                "price": 6.99,
                "quantity": 15,
                "available": True,
                "description": "Grilled chicken with fresh vegetables wrapped in a soft tortilla",
                "image_url": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f",
                "is_vegetarian": False,
                "is_vegan": False,
                "is_gluten_free": False,
                "allergens": ["gluten", "dairy"],
                "calories": 480,
                "preparation_time": 8,
                "is_daily_special": False,
                "discount_percentage": 0,
                "units_sold": 0,
                "rating_sum": 0,
                "rating_count": 0,
            },
            {
                "name": "Fruit Salad Bowl",
                "category": "dessert",
                "price": 4.50,
                "quantity": 35,
                "available": True,
                "description": "Fresh seasonal fruits with a honey drizzle",
                "image_url": "https://images.unsplash.com/photo-1564093497595-593b96d80180",
                "is_vegetarian": True,
                "is_vegan": True,
                "is_gluten_free": True,
                "allergens": [],
                "calories": 180,
                "preparation_time": 5,
                "is_daily_special": False,
                "discount_percentage": 0,
                "units_sold": 0,
                "rating_sum": 0,
                "rating_count": 0,
            },
            {
                "name": "Iced Coffee",
                "category": "drink",
                "price": 3.50,
                "quantity": 45,
                "available": True,
                "description": "Cold brew coffee served over ice with your choice of milk",
                "image_url": "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7",
                "is_vegetarian": True,
                "is_vegan": False,
                "is_gluten_free": True,
                "allergens": ["dairy"],
                "calories": 120,
                "preparation_time": 3,
                "is_daily_special": False,
                "discount_percentage": 0,
                "units_sold": 0,
                "rating_sum": 0,
                "rating_count": 0,
            },
        ]
        items_collection.insert_many(seed_items)
        print("✅ Database seeded with initial items")


def normalize_item(item):
    """Convert MongoDB document to dict with string ID."""
    if item:
        item["id"] = str(item["_id"])
        del item["_id"]
    return item


def normalize_order(order):
    """Convert MongoDB order document to dict with string ID."""
    if order:
        order["id"] = str(order["_id"])
        del order["_id"]
        if "order_time" in order and isinstance(order["order_time"], datetime):
            order["order_time"] = order["order_time"].isoformat()
    return order


# ========== ITEMS ==========
def get_all_items():
    """Get all menu items."""
    items = list(items_collection.find())
    return [normalize_item(item) for item in items]


def get_item_by_id(item_id: str):
    """Get a specific item by ID."""
    try:
        item = items_collection.find_one({"_id": ObjectId(item_id)})
        return normalize_item(item) if item else None
    except:
        return None


def create_item(item_data: dict):
    """Create a new menu item."""
    result = items_collection.insert_one(item_data)
    item_data["id"] = str(result.inserted_id)
    return item_data


def update_item(item_id: str, item_data: dict):
    """Update an existing item."""
    try:
        items_collection.update_one({"_id": ObjectId(item_id)}, {"$set": item_data})
        return get_item_by_id(item_id)
    except:
        return None


def delete_item(item_id: str):
    """Delete an item."""
    try:
        result = items_collection.delete_one({"_id": ObjectId(item_id)})
        return result.deleted_count > 0
    except:
        return False


def get_daily_specials():
    """Get all daily special items."""
    items = list(items_collection.find({"is_daily_special": True, "available": True}))
    return [normalize_item(item) for item in items]


# ========== ORDERS ==========
def create_order(order_data: dict):
    """Create a new order with cart-based items."""
    # Calculate ETA (base 5 minutes + 2 minutes per item)
    total_items = sum(item.get("quantity", 1) for item in order_data.get("items", []))
    eta_minutes = 5 + (total_items * 2)
    order_data["estimated_ready_time"] = (
        datetime.utcnow() + timedelta(minutes=eta_minutes)
    ).isoformat()

    # Calculate total with discounts
    total = 0
    for item in order_data.get("items", []):
        item_id = item.get("item_id")
        quantity = item.get("quantity", 1)

        # Get item details from database
        db_item = get_item_by_id(item_id)
        if db_item:
            price = db_item.get("price", 0)
            discount = db_item.get("discount_percentage", 0)

            # Apply discount if applicable
            if discount > 0:
                price = price * (1 - discount / 100)

            line_total = price * quantity
            item["line_total"] = round(line_total, 2)
            item["applied_discount"] = discount
            total += line_total

            # Update item statistics
            items_collection.update_one(
                {"_id": ObjectId(item_id)},
                {
                    "$inc": {"units_sold": quantity, "quantity": -quantity},
                    "$set": {
                        "available": db_item.get("quantity", 0) - quantity > 0
                    },
                },
            )

    order_data["total_price"] = round(total, 2)
    order_data["order_time"] = datetime.utcnow()
    order_data["status"] = order_data.get("status", "pending")
    order_data["status_history"] = [
        {"status": "pending", "timestamp": datetime.utcnow().isoformat()}
    ]

    result = orders_collection.insert_one(order_data)
    return normalize_order(orders_collection.find_one({"_id": result.inserted_id}))


def get_orders_by_customer(customer_id: str):
    """Get all orders for a customer."""
    orders = list(orders_collection.find({"customer_id": customer_id}).sort("order_time", -1))
    return [normalize_order(order) for order in orders]


def get_all_orders():
    """Get all orders (admin)."""
    orders = list(orders_collection.find().sort("order_time", -1))
    return [normalize_order(order) for order in orders]


def update_order_status(order_id: str, new_status: str):
    """Update order status."""
    try:
        order = orders_collection.find_one({"_id": ObjectId(order_id)})
        if not order:
            return None

        status_history = order.get("status_history", [])
        status_history.append(
            {"status": new_status, "timestamp": datetime.utcnow().isoformat()}
        )

        update_data = {"status": new_status, "status_history": status_history}

        if new_status == "completed":
            update_data["completion_time"] = datetime.utcnow()

        orders_collection.update_one({"_id": ObjectId(order_id)}, {"$set": update_data})

        return normalize_order(orders_collection.find_one({"_id": ObjectId(order_id)}))
    except:
        return None


# ========== FAVORITES ==========
def add_favorite(customer_id: str, item_id: str):
    """Add item to customer's favorites."""
    favorites_collection.update_one(
        {"customer_id": customer_id},
        {"$addToSet": {"item_ids": item_id}},
        upsert=True,
    )
    return True


def remove_favorite(customer_id: str, item_id: str):
    """Remove item from customer's favorites."""
    favorites_collection.update_one(
        {"customer_id": customer_id}, {"$pull": {"item_ids": item_id}}
    )
    return True


def get_favorites(customer_id: str):
    """Get customer's favorite items."""
    fav_doc = favorites_collection.find_one({"customer_id": customer_id})
    if not fav_doc:
        return []

    item_ids = fav_doc.get("item_ids", [])
    items = []
    for item_id in item_ids:
        item = get_item_by_id(item_id)
        if item:
            items.append(item)
    return items


# ========== ANALYTICS ==========
def get_top_selling_items(limit: int = 10):
    """Get top selling items."""
    items = list(
        items_collection.find({"units_sold": {"$gt": 0}})
        .sort("units_sold", -1)
        .limit(limit)
    )
    return [normalize_item(item) for item in items]


def get_top_rated_items(limit: int = 5):
    """Get top rated items."""
    items = list(items_collection.find({"rating_count": {"$gt": 0}}))
    for item in items:
        if item["rating_count"] > 0:
            item["rating_avg"] = item["rating_sum"] / item["rating_count"]
        else:
            item["rating_avg"] = 0

    items.sort(key=lambda x: x["rating_avg"], reverse=True)
    return [normalize_item(item) for item in items[:limit]]


def add_item_rating(item_id: str, rating: int):
    """Add a rating to an item (1-5 stars)."""
    try:
        items_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$inc": {"rating_sum": rating, "rating_count": 1}},
        )
        return True
    except:
        return False


# Initialize database on import
seed_database()