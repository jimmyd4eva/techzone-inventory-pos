"""
TechZone POS - Data Import Script
Run this on your local machine to import data from production.

Usage:
1. Save this file as import_data.py in your backend folder
2. Make sure MongoDB is running locally
3. Run: python import_data.py
"""

import json
import os
from pymongo import MongoClient

# MongoDB connection - adjust if your local MongoDB uses different settings
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

# Data to import (paste the JSON data below)
DATA = {
    "inventory": INVENTORY_DATA,
    "customers": CUSTOMERS_DATA,
    "users": USERS_DATA,
    "sales": SALES_DATA,
    "repair_jobs": REPAIR_JOBS_DATA,
    "coupons": COUPONS_DATA,
    "settings": SETTINGS_DATA
}

def import_data():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    for collection_name, documents in DATA.items():
        if documents:
            # Clear existing data
            db[collection_name].delete_many({})
            
            # Remove _id fields to let MongoDB generate new ones
            for doc in documents:
                if '_id' in doc:
                    del doc['_id']
            
            # Insert new data
            if documents:
                db[collection_name].insert_many(documents)
                print(f"Imported {len(documents)} documents into {collection_name}")
    
    client.close()
    print("\nData import complete!")

if __name__ == "__main__":
    import_data()
