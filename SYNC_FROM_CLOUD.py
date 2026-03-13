"""
TechZone POS - Data Sync from Cloud to Local
=============================================
This script downloads data from your cloud app and imports it locally.

Instructions:
1. Make sure your local MongoDB is running
2. Run: python SYNC_FROM_CLOUD.py
"""

import requests
import json
from pymongo import MongoClient

# Cloud API URL
CLOUD_URL = "https://zero-tax-pos.emergent.host/api"

# Local MongoDB
LOCAL_MONGO = "mongodb://localhost:27017"
DB_NAME = "test_database"

def sync_data():
    print("=" * 50)
    print("TechZone POS - Cloud to Local Sync")
    print("=" * 50)
    print()
    
    # First, login to get token
    print("Logging in to cloud...")
    try:
        login_response = requests.post(
            f"{CLOUD_URL}/auth/login",
            json={"username": "admin", "password": "admin123"},
            timeout=10
        )
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.text}")
            return
        
        token = login_response.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        print("Logged in successfully!")
    except Exception as e:
        print(f"Could not connect to cloud: {e}")
        return
    
    # Connect to local MongoDB
    print("Connecting to local MongoDB...")
    try:
        client = MongoClient(LOCAL_MONGO, serverSelectionTimeoutMS=5000)
        client.server_info()
        db = client[DB_NAME]
        print("Connected to local MongoDB!")
    except Exception as e:
        print(f"Could not connect to local MongoDB: {e}")
        print("Make sure MongoDB is running (mongod)")
        return
    
    # Sync each collection
    collections_to_sync = [
        ("inventory", "/inventory"),
        ("customers", "/customers"),
        ("sales", "/sales"),
        ("coupons", "/coupons"),
        ("repair_jobs", "/repair-jobs"),
    ]
    
    print()
    for collection_name, endpoint in collections_to_sync:
        try:
            response = requests.get(f"{CLOUD_URL}{endpoint}", headers=headers, timeout=30)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Clear and insert
                    db[collection_name].delete_many({})
                    for doc in data:
                        if '_id' in doc:
                            del doc['_id']
                    db[collection_name].insert_many(data)
                    print(f"[OK] Synced {len(data):>3} records to {collection_name}")
                else:
                    print(f"[--] No data in {collection_name}")
            else:
                print(f"[!!] Failed to fetch {collection_name}: {response.status_code}")
        except Exception as e:
            print(f"[!!] Error syncing {collection_name}: {e}")
    
    # Sync settings
    try:
        response = requests.get(f"{CLOUD_URL}/settings", headers=headers, timeout=10)
        if response.status_code == 200:
            settings = response.json()
            if '_id' in settings:
                del settings['_id']
            db.settings.delete_many({})
            db.settings.insert_one(settings)
            print(f"[OK] Synced settings")
    except Exception as e:
        print(f"[!!] Error syncing settings: {e}")
    
    # Sync users
    try:
        response = requests.get(f"{CLOUD_URL}/users", headers=headers, timeout=10)
        if response.status_code == 200:
            users = response.json()
            if isinstance(users, list) and len(users) > 0:
                db.users.delete_many({})
                for user in users:
                    if '_id' in user:
                        del user['_id']
                db.users.insert_many(users)
                print(f"[OK] Synced {len(users):>3} users")
    except Exception as e:
        print(f"[!!] Error syncing users: {e}")
    
    # Clear activation for fresh start
    db.activated_devices.delete_many({})
    db.activation_codes.delete_many({})
    print(f"[OK] Cleared activation data")
    
    client.close()
    
    print()
    print("=" * 50)
    print("Sync Complete!")
    print("=" * 50)
    print()
    print("Login with: admin / admin123")
    print()
    input("Press Enter to exit...")

if __name__ == "__main__":
    sync_data()
