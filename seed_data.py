import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
import uuid
from datetime import datetime, timezone

async def seed_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["techzone_inventory"]
    
    # Check if admin exists
    existing_admin = await db.users.find_one({"username": "admin"})
    
    if not existing_admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "email": "admin@techzone.com",
            "password_hash": bcrypt.hash("admin123"),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        print("✓ Admin user created: username='admin', password='admin123'")
    else:
        print("✓ Admin user already exists")
    
    # Add some sample inventory
    inventory_count = await db.inventory.count_documents({})
    if inventory_count == 0:
        sample_items = [
            {
                "id": str(uuid.uuid4()),
                "name": "iPhone 13 Screen",
                "type": "part",
                "sku": "IP13-SCR-001",
                "quantity": 15,
                "cost_price": 50.00,
                "selling_price": 120.00,
                "supplier": "Tech Parts Co",
                "low_stock_threshold": 5,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Samsung Galaxy S21",
                "type": "phone",
                "sku": "SGS21-001",
                "quantity": 8,
                "cost_price": 400.00,
                "selling_price": 650.00,
                "supplier": "Mobile Wholesale",
                "low_stock_threshold": 3,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Phone Case - Universal",
                "type": "accessory",
                "sku": "CASE-UNI-001",
                "quantity": 50,
                "cost_price": 5.00,
                "selling_price": 15.00,
                "supplier": "Accessories Plus",
                "low_stock_threshold": 10,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Battery - iPhone 12",
                "type": "part",
                "sku": "IP12-BAT-001",
                "quantity": 3,
                "cost_price": 20.00,
                "selling_price": 60.00,
                "supplier": "Tech Parts Co",
                "low_stock_threshold": 5,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.inventory.insert_many(sample_items)
        print(f"✓ Added {len(sample_items)} sample inventory items")
    else:
        print(f"✓ Inventory already has {inventory_count} items")
    
    # Add sample customer
    customer_count = await db.customers.count_documents({})
    if customer_count == 0:
        sample_customers = [
            {
                "id": str(uuid.uuid4()),
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1-555-0123",
                "address": "123 Main St, City, State",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Jane Smith",
                "email": "jane@example.com",
                "phone": "+1-555-0456",
                "address": "456 Oak Ave, City, State",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.customers.insert_many(sample_customers)
        print(f"✓ Added {len(sample_customers)} sample customers")
    else:
        print(f"✓ Database already has {customer_count} customers")
    
    client.close()
    print("\n✅ Database seeding completed!")
    print("\nLogin credentials:")
    print("  Username: admin")
    print("  Password: admin123")

if __name__ == "__main__":
    asyncio.run(seed_admin())
