# -*- coding: utf-8 -*-
"""
TechZone POS - Standalone Desktop Server
This version uses SQLite and serves everything from a single file.
"""

import os
import sys
import json
import uuid
import webbrowser
import threading
import time
import sqlite3
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

# Setup paths
if getattr(sys, 'frozen', False):
    APP_DIR = Path(sys.executable).parent
else:
    APP_DIR = Path(__file__).parent

DATA_DIR = APP_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / 'techzone.db'
UPLOAD_DIR = DATA_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)
FRONTEND_DIR = APP_DIR / 'frontend'

# FastAPI imports
from fastapi import FastAPI, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Authentication
import hashlib
import secrets

# JWT
JWT_SECRET = "techzone-desktop-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

app = FastAPI(title="TechZone POS Desktop")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ DATABASE ============

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TEXT
        )
    ''')
    
    # Inventory table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT,
            sku TEXT,
            barcode TEXT,
            quantity INTEGER DEFAULT 0,
            cost_price REAL DEFAULT 0,
            selling_price REAL DEFAULT 0,
            wholesale_price REAL,
            supplier TEXT,
            low_stock_threshold INTEGER DEFAULT 10,
            image_url TEXT,
            created_at TEXT
        )
    ''')
    
    # Customers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            account_number TEXT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            customer_type TEXT DEFAULT 'retail',
            total_spent REAL DEFAULT 0,
            points_balance REAL DEFAULT 0,
            created_at TEXT
        )
    ''')
    
    # Sales table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            customer_id TEXT,
            customer_name TEXT,
            items TEXT,
            subtotal REAL,
            tax REAL,
            discount REAL,
            total REAL,
            payment_method TEXT,
            status TEXT DEFAULT 'completed',
            created_at TEXT
        )
    ''')
    
    # Settings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            data TEXT
        )
    ''')
    
    # Create default admin user if not exists
    cursor.execute('SELECT id FROM users WHERE username = ?', ('admin',))
    if not cursor.fetchone():
        password_hash = hashlib.sha256('admin123'.encode()).hexdigest()
        cursor.execute('''
            INSERT INTO users (id, username, email, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (str(uuid.uuid4()), 'admin', 'admin@techzone.com', password_hash, 'admin', datetime.now(timezone.utc).isoformat()))
    
    # Create default settings if not exists
    cursor.execute('SELECT id FROM settings WHERE id = ?', ('app_settings',))
    if not cursor.fetchone():
        default_settings = {
            'tax_rate': 0,
            'tax_enabled': False,
            'currency': 'USD',
            'business_name': 'TechZone',
            'business_address': '',
            'business_phone': '',
            'dual_pricing_enabled': False,
            'cash_discount_percent': 0,
            'card_surcharge_percent': 0
        }
        cursor.execute('INSERT INTO settings (id, data) VALUES (?, ?)', 
                      ('app_settings', json.dumps(default_settings)))
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# ============ MODELS ============

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    role: str = 'user'

class InventoryItem(BaseModel):
    name: str
    type: str = 'other'
    sku: str = ''
    barcode: Optional[str] = None
    quantity: int = 0
    cost_price: float = 0
    selling_price: float = 0
    wholesale_price: Optional[float] = None
    supplier: Optional[str] = None
    low_stock_threshold: int = 10

class Customer(BaseModel):
    account_number: Optional[str] = None
    name: str
    email: Optional[str] = None
    phone: str = ''
    address: Optional[str] = None
    customer_type: str = 'retail'

class SaleCreate(BaseModel):
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    items: List[Dict[str, Any]]
    subtotal: float
    tax: float = 0
    discount: float = 0
    total: float
    payment_method: str = 'cash'

# ============ AUTH ============

def create_token(user_id: str, role: str):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }
    # Simple token for desktop use
    return secrets.token_urlsafe(32) + '.' + user_id + '.' + role

def verify_token(token: str):
    try:
        parts = token.split('.')
        if len(parts) >= 3:
            return {'user_id': parts[1], 'role': parts[2]}
    except:
        pass
    raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth_header.replace('Bearer ', '')
    return verify_token(token)

# ============ API ROUTES ============

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = ?', (request.username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    password_hash = hashlib.sha256(request.password.encode()).hexdigest()
    if user['password_hash'] != password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['role'])
    return {
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role']
        }
    }

@app.get("/api/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT data FROM settings WHERE id = ?', ('app_settings',))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return json.loads(row['data'])
    return {}

@app.put("/api/settings")
async def update_settings(settings: dict, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE settings SET data = ? WHERE id = ?', 
                  (json.dumps(settings), 'app_settings'))
    conn.commit()
    conn.close()
    return settings

@app.get("/api/settings/public")
async def get_public_settings():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT data FROM settings WHERE id = ?', ('app_settings',))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        settings = json.loads(row['data'])
        return {
            'business_name': settings.get('business_name', 'TechZone'),
            'business_address': settings.get('business_address', ''),
            'business_phone': settings.get('business_phone', ''),
            'business_logo': settings.get('business_logo')
        }
    return {'business_name': 'TechZone'}

# Inventory routes
@app.get("/api/inventory")
async def get_inventory(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM inventory ORDER BY name')
    items = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return items

@app.post("/api/inventory")
async def create_inventory(item: InventoryItem, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    item_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO inventory (id, name, type, sku, barcode, quantity, cost_price, selling_price, wholesale_price, supplier, low_stock_threshold, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (item_id, item.name, item.type, item.sku, item.barcode, item.quantity, item.cost_price, item.selling_price, item.wholesale_price, item.supplier, item.low_stock_threshold, datetime.now(timezone.utc).isoformat()))
    conn.commit()
    conn.close()
    return {'id': item_id, **item.dict()}

@app.put("/api/inventory/{item_id}")
async def update_inventory(item_id: str, item: InventoryItem, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE inventory SET name=?, type=?, sku=?, barcode=?, quantity=?, cost_price=?, selling_price=?, wholesale_price=?, supplier=?, low_stock_threshold=?
        WHERE id=?
    ''', (item.name, item.type, item.sku, item.barcode, item.quantity, item.cost_price, item.selling_price, item.wholesale_price, item.supplier, item.low_stock_threshold, item_id))
    conn.commit()
    conn.close()
    return {'id': item_id, **item.dict()}

@app.delete("/api/inventory/{item_id}")
async def delete_inventory(item_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM inventory WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()
    return {'message': 'Deleted'}

# Customer routes
@app.get("/api/customers")
async def get_customers(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM customers ORDER BY name')
    customers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return customers

@app.post("/api/customers")
async def create_customer(customer: Customer, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    customer_id = str(uuid.uuid4())
    account_number = customer.account_number or f"CUST-{uuid.uuid4().hex[:8].upper()}"
    cursor.execute('''
        INSERT INTO customers (id, account_number, name, email, phone, address, customer_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (customer_id, account_number, customer.name, customer.email, customer.phone, customer.address, customer.customer_type, datetime.now(timezone.utc).isoformat()))
    conn.commit()
    conn.close()
    return {'id': customer_id, 'account_number': account_number, **customer.dict()}

@app.put("/api/customers/{customer_id}")
async def update_customer(customer_id: str, customer: Customer, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE customers SET name=?, email=?, phone=?, address=?, customer_type=?
        WHERE id=?
    ''', (customer.name, customer.email, customer.phone, customer.address, customer.customer_type, customer_id))
    conn.commit()
    conn.close()
    return {'id': customer_id, **customer.dict()}

@app.delete("/api/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM customers WHERE id = ?', (customer_id,))
    conn.commit()
    conn.close()
    return {'message': 'Deleted'}

# Sales routes
@app.get("/api/sales")
async def get_sales(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM sales ORDER BY created_at DESC')
    sales = []
    for row in cursor.fetchall():
        sale = dict(row)
        sale['items'] = json.loads(sale['items']) if sale['items'] else []
        sales.append(sale)
    conn.close()
    return sales

@app.post("/api/sales")
async def create_sale(sale: SaleCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    sale_id = str(uuid.uuid4())
    
    # Update inventory quantities
    for item in sale.items:
        cursor.execute('UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
                      (item.get('quantity', 1), item.get('item_id')))
    
    # Insert sale
    cursor.execute('''
        INSERT INTO sales (id, customer_id, customer_name, items, subtotal, tax, discount, total, payment_method, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (sale_id, sale.customer_id, sale.customer_name, json.dumps(sale.items), sale.subtotal, sale.tax, sale.discount, sale.total, sale.payment_method, 'completed', datetime.now(timezone.utc).isoformat()))
    
    conn.commit()
    conn.close()
    return {'id': sale_id, **sale.dict()}

# Dashboard stats
@app.get("/api/reports/dashboard-stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    # Today's sales
    cursor.execute("SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM sales WHERE created_at LIKE ?", (f"{today}%",))
    sales_row = cursor.fetchone()
    
    # Total inventory
    cursor.execute("SELECT COUNT(*) FROM inventory")
    inventory_count = cursor.fetchone()[0]
    
    # Total customers
    cursor.execute("SELECT COUNT(*) FROM customers")
    customer_count = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        'today_sales': sales_row['total'] or 0,
        'today_transactions': sales_row['count'] or 0,
        'total_stock_items': inventory_count,
        'low_stock_items': 0,
        'total_customers': customer_count,
        'pending_repairs': 0
    }

# Users routes
@app.get("/api/users")
async def get_users(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, email, role, created_at FROM users')
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return users

@app.post("/api/users/register")
async def register_user(user: UserCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can create users")
    
    conn = get_db()
    cursor = conn.cursor()
    user_id = str(uuid.uuid4())
    password_hash = hashlib.sha256(user.password.encode()).hexdigest()
    
    try:
        cursor.execute('''
            INSERT INTO users (id, username, email, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, user.username, user.email, password_hash, user.role, datetime.now(timezone.utc).isoformat()))
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username already exists")
    finally:
        conn.close()
    
    return {'id': user_id, 'username': user.username, 'email': user.email, 'role': user.role}

# Activation endpoints (simplified for desktop)
@app.post("/api/activation/check")
async def check_activation(request: dict):
    # Desktop version is always activated
    return {'is_activated': True}

@app.post("/api/activation/request-code")
async def request_activation_code(request: dict):
    return {'success': True, 'message': 'Desktop version - no activation required', 'code': '000000'}

@app.post("/api/activation/activate")
async def activate_device(request: dict):
    return {'success': True, 'message': 'Desktop version activated'}

# Serve static frontend
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR / 'static')), name="static")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404)
    
    file_path = FRONTEND_DIR / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    index_path = FRONTEND_DIR / 'index.html'
    if index_path.exists():
        return FileResponse(index_path)
    
    return HTMLResponse("""
        <h1>TechZone POS</h1>
        <p>API running at <a href="/api/settings/public">/api/settings/public</a></p>
        <p>Frontend folder not found. Place React build files in 'frontend' folder.</p>
    """)

def open_browser():
    time.sleep(2)
    webbrowser.open('http://localhost:8001')

if __name__ == "__main__":
    print("=" * 50)
    print("TechZone POS Desktop")
    print("=" * 50)
    print(f"Database: {DB_PATH}")
    print("Server: http://localhost:8001")
    print()
    
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run(app, host="127.0.0.1", port=8001)
