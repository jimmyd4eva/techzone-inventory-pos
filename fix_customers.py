#!/usr/bin/env python3

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def fix_customers():
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("Fixing customer records...")
    
    # Find customers without account_number
    customers = await db.customers.find({"account_number": {"$exists": False}}).to_list(1000)
    
    print(f"Found {len(customers)} customers without account_number")
    
    for i, customer in enumerate(customers):
        # Generate account number based on customer name and index
        account_number = f"CUST{1000 + i:04d}"
        
        # Update the customer record
        await db.customers.update_one(
            {"id": customer["id"]},
            {"$set": {"account_number": account_number}}
        )
        
        print(f"Updated customer {customer['name']} with account number {account_number}")
    
    print("Customer records fixed!")
    
    # Also create some test customers for testing
    test_customers = [
        {
            "id": "test-customer-1",
            "account_number": "92001",
            "name": "John Smith",
            "email": "john.smith@example.com",
            "phone": "633-555-0123",
            "address": "123 Main Street, Kingston",
            "created_at": "2025-11-07T18:45:00.000Z"
        },
        {
            "id": "test-customer-2", 
            "account_number": "92002",
            "name": "Jane Johnson",
            "email": "jane.johnson@example.com",
            "phone": "633-555-0456",
            "address": "456 Oak Avenue, Kingston",
            "created_at": "2025-11-07T18:45:00.000Z"
        },
        {
            "id": "test-customer-3",
            "account_number": "92003", 
            "name": "Bob Wilson",
            "email": "bob.wilson@example.com",
            "phone": "633-555-0789",
            "address": "789 Pine Street, Kingston",
            "created_at": "2025-11-07T18:45:00.000Z"
        }
    ]
    
    for customer in test_customers:
        # Check if customer already exists
        existing = await db.customers.find_one({"id": customer["id"]})
        if not existing:
            await db.customers.insert_one(customer)
            print(f"Created test customer: {customer['name']} ({customer['account_number']})")
        else:
            print(f"Test customer {customer['name']} already exists")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_customers())