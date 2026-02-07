from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import io
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.hash import bcrypt
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from paypalcheckoutsdk.core import PayPalHttpClient, SandboxEnvironment, LiveEnvironment
from paypalcheckoutsdk.orders import OrdersCreateRequest, OrdersCaptureRequest, OrdersGetRequest
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_RIGHT

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'techzone-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Stripe configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# PayPal configuration
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', 'test')
PAYPAL_SECRET = os.environ.get('PAYPAL_SECRET', 'test')
PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')

# Initialize PayPal client
if PAYPAL_MODE == 'live':
    paypal_environment = LiveEnvironment(client_id=PAYPAL_CLIENT_ID, client_secret=PAYPAL_SECRET)
else:
    paypal_environment = SandboxEnvironment(client_id=PAYPAL_CLIENT_ID, client_secret=PAYPAL_SECRET)

paypal_client = PayPalHttpClient(paypal_environment)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    role: str  # admin, technician, cashier
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str

class UserLogin(BaseModel):
    username: str
    password: str

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_number: Optional[str] = None
    name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    account_number: Optional[str] = None
    name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None

class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # phone, part, accessory, other
    sku: str
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    gsm_arena_url: Optional[str] = None
    quantity: int
    cost_price: float
    selling_price: float
    supplier: Optional[str] = None
    low_stock_threshold: int = 10
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InventoryItemCreate(BaseModel):
    name: str
    type: str
    sku: str
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    gsm_arena_url: Optional[str] = None
    quantity: int
    cost_price: float
    selling_price: float
    supplier: Optional[str] = None
    low_stock_threshold: int = 10

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    gsm_arena_url: Optional[str] = None
    quantity: Optional[int] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    supplier: Optional[str] = None
    low_stock_threshold: Optional[int] = None

class RepairJob(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    device: str
    issue_description: str
    status: str  # pending, in-progress, completed, delivered
    assigned_technician: Optional[str] = None
    cost: float
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RepairJobCreate(BaseModel):
    customer_id: str
    device: str
    issue_description: str
    cost: float
    assigned_technician: Optional[str] = None
    notes: Optional[str] = None

class RepairJobUpdate(BaseModel):
    device: Optional[str] = None
    issue_description: Optional[str] = None
    status: Optional[str] = None
    assigned_technician: Optional[str] = None
    cost: Optional[float] = None
    notes: Optional[str] = None

class SaleItem(BaseModel):
    item_id: str
    item_name: str
    quantity: int
    price: float
    subtotal: float

class Sale(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[SaleItem]
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    payment_method: str  # cash, stripe, paypal
    subtotal: float
    tax: float
    discount: float = 0  # Coupon discount amount
    coupon_code: Optional[str] = None
    coupon_id: Optional[str] = None
    total: float
    payment_status: str  # completed, pending
    stripe_session_id: Optional[str] = None
    paypal_order_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SaleCreate(BaseModel):
    items: List[SaleItem]
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    payment_method: str
    coupon_code: Optional[str] = None
    created_by: str

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    sale_id: str
    amount: float
    currency: str
    payment_status: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    sale_id: str
    origin_url: str

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "app_settings"
    tax_rate: float = 0.0  # Tax rate as decimal (e.g., 0.1 for 10%)
    tax_enabled: bool = False
    currency: str = "USD"
    # Category-specific tax exemptions (categories listed here are TAX EXEMPT)
    tax_exempt_categories: List[str] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None

class SettingsUpdate(BaseModel):
    tax_rate: Optional[float] = None
    tax_enabled: Optional[bool] = None
    currency: Optional[str] = None
    tax_exempt_categories: Optional[List[str]] = None

# ============ COUPON MODELS ============

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str  # Unique coupon code
    description: Optional[str] = None
    discount_type: str  # 'percentage' or 'fixed'
    discount_value: float  # Percentage (0-100) or fixed amount
    min_purchase: float = 0  # Minimum purchase amount to use coupon
    max_discount: Optional[float] = None  # Maximum discount for percentage coupons
    usage_limit: Optional[int] = None  # Max number of times coupon can be used
    usage_count: int = 0  # How many times it's been used
    is_active: bool = True
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str
    discount_value: float
    min_purchase: float = 0
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    is_active: bool = True
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None

class CouponUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_purchase: Optional[float] = None
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    is_active: Optional[bool] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None

# ============ AUTH UTILITIES ============

def create_token(user_id: str, role: str, username: str = None) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authentication token")
    
    token = auth_header.split(" ")[1]
    return verify_token(token)

def check_not_readonly(current_user: dict):
    """Check if user is not read-only (demo user)"""
    if current_user.get("username") == "demo":
        raise HTTPException(
            status_code=403, 
            detail="Demo account is read-only. Write operations are not permitted."
        )
    return current_user

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Hash password
    password_hash = bcrypt.hash(user_data.password)
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        role=user_data.role
    )
    
    doc = user.model_dump()
    doc['password_hash'] = password_hash
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    # Create token
    token = create_token(user.id, user.role, user.username)
    
    return {"user": user, "token": token}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"username": credentials.username})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not bcrypt.verify(credentials.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = create_token(user_doc['id'], user_doc['role'], user_doc['username'])
    
    # Remove password hash from response
    user_doc.pop('password_hash', None)
    user_doc.pop('_id', None)
    
    return {"user": user_doc, "token": token}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    # Only admins can view all users
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        if isinstance(user['created_at'], str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    # Only admins can delete users
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Don't allow deleting yourself
    if user_id == current_user['user_id']:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    # Only admins can update users
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_fields = {k: v for k, v in user_data.model_dump().items() if v is not None}
    
    # Hash password if provided
    if 'password' in update_fields:
        update_fields['password_hash'] = bcrypt.hash(update_fields.pop('password'))
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated successfully"}

# ============ CUSTOMER ENDPOINTS ============

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    # Use provided account number or default to last 4 digits of phone
    if customer_data.account_number:
        # Check if provided account number already exists
        existing = await db.customers.find_one({"account_number": customer_data.account_number})
        if existing:
            raise HTTPException(status_code=400, detail="Account number already exists")
        account_number = customer_data.account_number
    else:
        # Default: Use last 4 digits of phone number as account number
        # Extract only digits from phone number
        phone_digits = ''.join(filter(str.isdigit, customer_data.phone))
        
        if len(phone_digits) >= 4:
            last_4_digits = phone_digits[-4:]
        else:
            # If phone has less than 4 digits, use what we have
            last_4_digits = phone_digits
        
        # Check if last 4 digits already used as account number
        existing = await db.customers.find_one({"account_number": last_4_digits})
        if existing:
            # If exists, append a letter or number to make it unique
            suffix = 'A'
            account_number = f"{last_4_digits}{suffix}"
            while await db.customers.find_one({"account_number": account_number}):
                suffix = chr(ord(suffix) + 1) if suffix != 'Z' else '1'
                account_number = f"{last_4_digits}{suffix}"
        else:
            account_number = last_4_digits
    
    customer_dict = customer_data.model_dump()
    customer_dict['account_number'] = account_number
    customer = Customer(**customer_dict)
    doc = customer.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.customers.insert_one(doc)
    return customer

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: dict = Depends(get_current_user)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    for customer in customers:
        if isinstance(customer['created_at'], str):
            customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    return customers

@api_router.get("/customers/{customer_id}")
async def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get repair history
    repairs = await db.repair_jobs.find({"customer_id": customer_id}, {"_id": 0}).to_list(100)
    customer['repair_history'] = repairs
    
    # Get purchase history
    sales = await db.sales.find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for sale in sales:
        if isinstance(sale.get('created_at'), str):
            sale['created_at'] = datetime.fromisoformat(sale['created_at'])
    customer['purchase_history'] = sales
    
    return customer

@api_router.get("/customers/account/{account_number}")
async def get_customer_by_account(account_number: str, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"account_number": account_number}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get repair history
    repairs = await db.repair_jobs.find({"customer_id": customer['id']}, {"_id": 0}).to_list(100)
    customer['repair_history'] = repairs
    
    # Get purchase history
    sales = await db.sales.find({"customer_id": customer['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for sale in sales:
        if isinstance(sale.get('created_at'), str):
            sale['created_at'] = datetime.fromisoformat(sale['created_at'])
    customer['purchase_history'] = sales
    
    return customer

@api_router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, customer_data: CustomerCreate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    result = await db.customers.update_one(
        {"id": customer_id},
        {"$set": customer_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer updated successfully"}

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

# ============ INVENTORY ENDPOINTS ============

@api_router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(item_data: InventoryItemCreate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    item = InventoryItem(**item_data.model_dump())
    doc = item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.inventory.insert_one(doc)
    return item

@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory(current_user: dict = Depends(get_current_user)):
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    for item in items:
        if isinstance(item['created_at'], str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items

@api_router.get("/inventory/low-stock")
async def get_low_stock_items(current_user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"$expr": {"$lte": ["$quantity", "$low_stock_threshold"]}}},
        {"$project": {"_id": 0}}
    ]
    items = await db.inventory.aggregate(pipeline).to_list(100)
    return items

@api_router.get("/inventory/{item_id}", response_model=InventoryItem)
async def get_inventory_item(item_id: str, current_user: dict = Depends(get_current_user)):
    item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@api_router.put("/inventory/{item_id}")
async def update_inventory_item(item_id: str, item_data: InventoryItemUpdate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    update_data = {k: v for k, v in item_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.inventory.update_one(
        {"id": item_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item updated successfully"}

@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    result = await db.inventory.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

@api_router.get("/inventory/barcode/{barcode}")
async def get_inventory_by_barcode(barcode: str, current_user: dict = Depends(get_current_user)):
    item = await db.inventory.find_one({"barcode": barcode}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found with this barcode")
    return item

# ============ REPAIR JOB ENDPOINTS ============

@api_router.post("/repairs", response_model=RepairJob)
async def create_repair_job(job_data: RepairJobCreate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    # Get customer name
    customer = await db.customers.find_one({"id": job_data.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    job = RepairJob(
        **job_data.model_dump(),
        customer_name=customer['name'],
        status="pending"
    )
    doc = job.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.repair_jobs.insert_one(doc)
    return job

@api_router.get("/repairs", response_model=List[RepairJob])
async def get_repair_jobs(current_user: dict = Depends(get_current_user)):
    jobs = await db.repair_jobs.find({}, {"_id": 0}).to_list(1000)
    for job in jobs:
        if isinstance(job['created_at'], str):
            job['created_at'] = datetime.fromisoformat(job['created_at'])
        if isinstance(job['updated_at'], str):
            job['updated_at'] = datetime.fromisoformat(job['updated_at'])
    return jobs

@api_router.get("/repairs/{job_id}", response_model=RepairJob)
async def get_repair_job(job_id: str, current_user: dict = Depends(get_current_user)):
    job = await db.repair_jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Repair job not found")
    return job

@api_router.put("/repairs/{job_id}")
async def update_repair_job(job_id: str, job_data: RepairJobUpdate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    update_data = {k: v for k, v in job_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.repair_jobs.update_one(
        {"id": job_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Repair job not found")
    return {"message": "Repair job updated successfully"}

@api_router.delete("/repairs/{job_id}")
async def delete_repair_job(job_id: str, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    result = await db.repair_jobs.delete_one({"id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Repair job not found")
    return {"message": "Repair job deleted successfully"}

# ============ SETTINGS ENDPOINTS ============

@api_router.get("/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        return {
            "id": "app_settings",
            "tax_rate": 0.0,
            "tax_enabled": False,
            "currency": "USD",
            "tax_exempt_categories": [],
            "updated_at": None,
            "updated_by": None
        }
    # Ensure tax_exempt_categories exists
    if "tax_exempt_categories" not in settings:
        settings["tax_exempt_categories"] = []
    return settings

@api_router.put("/settings")
async def update_settings(settings_data: SettingsUpdate, current_user: dict = Depends(get_current_user)):
    # Only admin can update settings
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can update settings")
    
    update_data = {k: v for k, v in settings_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    update_data['updated_by'] = current_user.get('username')
    
    await db.settings.update_one(
        {"id": "app_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    return settings

# ============ COUPON ENDPOINTS ============

@api_router.get("/coupons")
async def get_coupons(current_user: dict = Depends(get_current_user)):
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return coupons

@api_router.get("/coupons/{coupon_id}")
async def get_coupon(coupon_id: str, current_user: dict = Depends(get_current_user)):
    coupon = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return coupon

@api_router.post("/coupons")
async def create_coupon(coupon_data: CouponCreate, current_user: dict = Depends(get_current_user)):
    # Only admin can create coupons
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can create coupons")
    
    # Check if coupon code already exists
    existing = await db.coupons.find_one({"code": coupon_data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon = Coupon(
        code=coupon_data.code.upper(),
        description=coupon_data.description,
        discount_type=coupon_data.discount_type,
        discount_value=coupon_data.discount_value,
        min_purchase=coupon_data.min_purchase,
        max_discount=coupon_data.max_discount,
        usage_limit=coupon_data.usage_limit,
        is_active=coupon_data.is_active,
        valid_from=coupon_data.valid_from,
        valid_until=coupon_data.valid_until,
        created_by=current_user.get('username')
    )
    
    doc = coupon.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.coupons.insert_one(doc)
    
    return {k: v for k, v in doc.items() if k != '_id'}

@api_router.put("/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon_data: CouponUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can update coupons")
    
    update_data = {k: v for k, v in coupon_data.model_dump().items() if v is not None}
    if 'code' in update_data:
        update_data['code'] = update_data['code'].upper()
        # Check if new code already exists
        existing = await db.coupons.find_one({"code": update_data['code'], "id": {"$ne": coupon_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    result = await db.coupons.update_one({"id": coupon_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    coupon = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    return coupon

@api_router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can delete coupons")
    
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"message": "Coupon deleted successfully"}

@api_router.post("/coupons/validate")
async def validate_coupon(data: dict, current_user: dict = Depends(get_current_user)):
    """Validate a coupon code and calculate discount"""
    code = data.get('code', '').upper()
    subtotal = data.get('subtotal', 0)
    
    coupon = await db.coupons.find_one({"code": code}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    if not coupon.get('is_active', False):
        raise HTTPException(status_code=400, detail="This coupon is no longer active")
    
    # Check usage limit
    if coupon.get('usage_limit') and coupon.get('usage_count', 0) >= coupon.get('usage_limit'):
        raise HTTPException(status_code=400, detail="This coupon has reached its usage limit")
    
    # Check minimum purchase
    if subtotal < coupon.get('min_purchase', 0):
        raise HTTPException(status_code=400, detail=f"Minimum purchase of ${coupon.get('min_purchase', 0):.2f} required")
    
    # Check validity dates
    now = datetime.now(timezone.utc).isoformat()
    if coupon.get('valid_from') and now < coupon.get('valid_from'):
        raise HTTPException(status_code=400, detail="This coupon is not yet valid")
    if coupon.get('valid_until') and now > coupon.get('valid_until'):
        raise HTTPException(status_code=400, detail="This coupon has expired")
    
    # Calculate discount
    if coupon.get('discount_type') == 'percentage':
        discount = subtotal * (coupon.get('discount_value', 0) / 100)
        if coupon.get('max_discount') and discount > coupon.get('max_discount'):
            discount = coupon.get('max_discount')
    else:  # fixed
        discount = min(coupon.get('discount_value', 0), subtotal)
    
    return {
        "valid": True,
        "coupon": coupon,
        "discount": round(discount, 2)
    }

@api_router.post("/coupons/{coupon_id}/increment-usage")
async def increment_coupon_usage(coupon_id: str, current_user: dict = Depends(get_current_user)):
    """Increment usage count when a coupon is used in a sale"""
    result = await db.coupons.update_one(
        {"id": coupon_id},
        {"$inc": {"usage_count": 1}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"message": "Usage count incremented"}

# ============ SALES ENDPOINTS ============

@api_router.post("/sales", response_model=Sale)
async def create_sale(sale_data: SaleCreate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    
    # Get tax settings
    settings = await db.settings.find_one({"id": "app_settings"})
    tax_rate = 0.0
    tax_exempt_categories = []
    if settings and settings.get('tax_enabled', False):
        tax_rate = settings.get('tax_rate', 0.0)
        tax_exempt_categories = settings.get('tax_exempt_categories', [])
    
    # Calculate totals with category-based tax exemptions
    subtotal = sum(item.subtotal for item in sale_data.items)
    taxable_subtotal = 0.0
    
    # Look up each item's type to determine if it's taxable
    for item in sale_data.items:
        inv_item = await db.inventory.find_one({"id": item.item_id})
        item_type = inv_item.get('type', '') if inv_item else ''
        # Item is taxable if its type is NOT in the exempt list
        if item_type.lower() not in [cat.lower() for cat in tax_exempt_categories]:
            taxable_subtotal += item.subtotal
    
    tax = taxable_subtotal * tax_rate
    
    # Handle coupon discount
    discount = 0
    coupon_code = None
    coupon_id = None
    
    if sale_data.coupon_code:
        coupon = await db.coupons.find_one({"code": sale_data.coupon_code.upper(), "is_active": True})
        if coupon:
            # Validate coupon
            if coupon.get('usage_limit') and coupon.get('usage_count', 0) >= coupon.get('usage_limit'):
                pass  # Skip - usage limit reached
            elif subtotal < coupon.get('min_purchase', 0):
                pass  # Skip - minimum not met
            else:
                # Calculate discount
                if coupon.get('discount_type') == 'percentage':
                    discount = subtotal * (coupon.get('discount_value', 0) / 100)
                    if coupon.get('max_discount') and discount > coupon.get('max_discount'):
                        discount = coupon.get('max_discount')
                else:
                    discount = min(coupon.get('discount_value', 0), subtotal)
                
                coupon_code = coupon.get('code')
                coupon_id = coupon.get('id')
                
                # Increment usage count
                await db.coupons.update_one({"id": coupon_id}, {"$inc": {"usage_count": 1}})
    
    total = subtotal + tax - discount
    
    # Get customer name - prioritize the direct customer_name field over customer_id lookup
    customer_name = sale_data.customer_name
    if not customer_name and sale_data.customer_id:
        customer = await db.customers.find_one({"id": sale_data.customer_id})
        if customer:
            customer_name = customer['name']
    
    # Determine payment status
    payment_status = "completed" if sale_data.payment_method == "cash" else "pending"
    
    sale = Sale(
        items=sale_data.items,
        customer_id=sale_data.customer_id,
        customer_name=customer_name,
        payment_method=sale_data.payment_method,
        subtotal=subtotal,
        tax=tax,
        discount=discount,
        coupon_code=coupon_code,
        coupon_id=coupon_id,
        total=total,
        payment_status=payment_status,
        created_by=sale_data.created_by
    )
    
    doc = sale.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.sales.insert_one(doc)
    
    # Update inventory quantities for completed sales
    if payment_status == "completed":
        for item in sale_data.items:
            await db.inventory.update_one(
                {"id": item.item_id},
                {"$inc": {"quantity": -item.quantity}}
            )
    
    return sale

@api_router.get("/sales", response_model=List[Sale])
async def get_sales(current_user: dict = Depends(get_current_user)):
    sales = await db.sales.find({}, {"_id": 0}).to_list(1000)
    for sale in sales:
        if isinstance(sale['created_at'], str):
            sale['created_at'] = datetime.fromisoformat(sale['created_at'])
    return sales

@api_router.get("/sales/{sale_id}", response_model=Sale)
async def get_sale(sale_id: str, current_user: dict = Depends(get_current_user)):
    sale = await db.sales.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@api_router.delete("/sales/{sale_id}")
async def delete_sale(sale_id: str, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    # Only admins should be able to delete sales
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can delete sales")
    
    # Check if sale exists
    sale = await db.sales.find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Delete the sale
    result = await db.sales.delete_one({"id": sale_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete sale")
    
    return {"message": "Sale deleted successfully", "sale_id": sale_id}

# ============ MIGRATION ENDPOINT ============

@api_router.post("/admin/migrate-data")
async def migrate_data(current_user: dict = Depends(get_current_user)):
    # Only admins can run migration
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can run migrations")
    
    from pathlib import Path
    import json
    
    migration_dir = Path(__file__).parent / "migration_data"
    
    if not migration_dir.exists():
        raise HTTPException(status_code=500, detail="Migration data directory not found")
    
    collections = ['users', 'customers', 'inventory', 'sales', 'repair_jobs']
    results = {}
    total_imported = 0
    
    for collection_name in collections:
        json_file = migration_dir / f"{collection_name}.json"
        
        if not json_file.exists():
            results[collection_name] = {"status": "skipped", "reason": "file not found"}
            continue
        
        try:
            # Load JSON data
            with open(json_file, 'r') as f:
                data = json.load(f)
            
            if not data:
                results[collection_name] = {"status": "skipped", "reason": "no data"}
                continue
            
            # Clear existing data
            delete_result = await db[collection_name].delete_many({})
            
            # Import new data
            await db[collection_name].insert_many(data)
            
            total_imported += len(data)
            results[collection_name] = {
                "status": "success",
                "deleted": delete_result.deleted_count,
                "imported": len(data)
            }
            
        except Exception as e:
            results[collection_name] = {"status": "error", "message": str(e)}
    
    return {
        "status": "completed",
        "total_imported": total_imported,
        "collections": results
    }

# ============ PAYMENT ENDPOINTS ============

@api_router.post("/payments/checkout")
async def create_checkout_session(checkout_data: CheckoutRequest, request: Request, current_user: dict = Depends(get_current_user)):
    # Get sale details
    sale = await db.sales.find_one({"id": checkout_data.sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    if sale['payment_status'] == "completed":
        raise HTTPException(status_code=400, detail="Sale already paid")
    
    # Initialize Stripe
    webhook_url = f"{checkout_data.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session
    success_url = f"{checkout_data.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{checkout_data.origin_url}/sales"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(sale['total']),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "sale_id": checkout_data.sale_id,
            "source": "techzone_pos"
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        session_id=session.session_id,
        sale_id=checkout_data.sale_id,
        amount=float(sale['total']),
        currency="usd",
        payment_status="pending",
        metadata={"sale_id": checkout_data.sale_id}
    )
    
    trans_doc = transaction.model_dump()
    trans_doc['created_at'] = trans_doc['created_at'].isoformat()
    await db.payment_transactions.insert_one(trans_doc)
    
    # Update sale with session ID
    await db.sales.update_one(
        {"id": checkout_data.sale_id},
        {"$set": {"stripe_session_id": session.session_id}}
    )
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def check_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    # Initialize Stripe
    webhook_url = ""  # Not needed for status check
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update payment transaction
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if transaction:
            # Check if already processed
            if transaction['payment_status'] != "completed":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": checkout_status.payment_status}}
                )
                
                # Update sale if payment successful
                if checkout_status.payment_status == "paid":
                    sale_id = transaction['sale_id']
                    sale = await db.sales.find_one({"id": sale_id})
                    
                    # Only update inventory once
                    if sale and sale['payment_status'] != "completed":
                        await db.sales.update_one(
                            {"id": sale_id},
                            {"$set": {"payment_status": "completed"}}
                        )
                        
                        # Update inventory
                        for item in sale['items']:
                            await db.inventory.update_one(
                                {"id": item['item_id']},
                                {"$inc": {"quantity": -item['quantity']}}
                            )
        
        return checkout_status
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    webhook_url = ""  # Not needed for webhook handling
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Process webhook
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            
            if transaction and transaction['payment_status'] != "completed":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid"}}
                )
                
                sale_id = transaction['sale_id']
                sale = await db.sales.find_one({"id": sale_id})
                
                if sale and sale['payment_status'] != "completed":
                    await db.sales.update_one(
                        {"id": sale_id},
                        {"$set": {"payment_status": "completed"}}
                    )
                    
                    for item in sale['items']:
                        await db.inventory.update_one(
                            {"id": item['item_id']},
                            {"$inc": {"quantity": -item['quantity']}}
                        )
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============ PAYPAL PAYMENT ENDPOINTS ============

class PayPalOrderRequest(BaseModel):
    sale_id: str

@api_router.post("/payments/paypal/create-order")
async def create_paypal_order(order_data: PayPalOrderRequest, current_user: dict = Depends(get_current_user)):
    # Get sale details
    sale = await db.sales.find_one({"id": order_data.sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    if sale['payment_status'] == "completed":
        raise HTTPException(status_code=400, detail="Sale already paid")
    
    # Create PayPal order
    request = OrdersCreateRequest()
    request.prefer('return=representation')
    request.request_body({
        "intent": "CAPTURE",
        "purchase_units": [{
            "reference_id": order_data.sale_id,
            "amount": {
                "currency_code": "USD",
                "value": f"{sale['total']:.2f}"
            },
            "description": f"Techzone POS Sale #{order_data.sale_id[:8]}"
        }],
        "application_context": {
            "brand_name": "Techzone Inventory",
            "landing_page": "NO_PREFERENCE",
            "user_action": "PAY_NOW",
            "return_url": f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/payment-success-paypal",
            "cancel_url": f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/sales"
        }
    })
    
    try:
        response = paypal_client.execute(request)
        order_id = response.result.id
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            session_id=order_id,
            sale_id=order_data.sale_id,
            amount=float(sale['total']),
            currency="usd",
            payment_status="pending",
            metadata={"sale_id": order_data.sale_id, "payment_method": "paypal"}
        )
        
        trans_doc = transaction.model_dump()
        trans_doc['created_at'] = trans_doc['created_at'].isoformat()
        await db.payment_transactions.insert_one(trans_doc)
        
        # Update sale with PayPal order ID
        await db.sales.update_one(
            {"id": order_data.sale_id},
            {"$set": {"paypal_order_id": order_id}}
        )
        
        # Get approval URL
        approval_url = None
        for link in response.result.links:
            if link.rel == "approve":
                approval_url = link.href
                break
        
        return {"order_id": order_id, "approval_url": approval_url}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PayPal order creation failed: {str(e)}")

@api_router.post("/payments/paypal/capture/{order_id}")
async def capture_paypal_order(order_id: str, current_user: dict = Depends(get_current_user)):
    request = OrdersCaptureRequest(order_id)
    
    try:
        response = paypal_client.execute(request)
        
        # Update payment transaction
        transaction = await db.payment_transactions.find_one({"session_id": order_id})
        if transaction:
            if transaction['payment_status'] != "completed":
                await db.payment_transactions.update_one(
                    {"session_id": order_id},
                    {"$set": {"payment_status": "completed"}}
                )
                
                # Update sale
                sale_id = transaction['sale_id']
                sale = await db.sales.find_one({"id": sale_id})
                
                if sale and sale['payment_status'] != "completed":
                    await db.sales.update_one(
                        {"id": sale_id},
                        {"$set": {"payment_status": "completed"}}
                    )
                    
                    # Update inventory
                    for item in sale['items']:
                        await db.inventory.update_one(
                            {"id": item['item_id']},
                            {"$inc": {"quantity": -item['quantity']}}
                        )
        
        return {
            "status": response.result.status,
            "order_id": order_id,
            "payment_status": "completed"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PayPal capture failed: {str(e)}")

@api_router.get("/payments/paypal/status/{order_id}")
async def get_paypal_order_status(order_id: str, current_user: dict = Depends(get_current_user)):
    request = OrdersGetRequest(order_id)
    
    try:
        response = paypal_client.execute(request)
        order = response.result
        
        return {
            "order_id": order.id,
            "status": order.status,
            "amount": order.purchase_units[0].amount.value if order.purchase_units else 0
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get order status: {str(e)}")

# ============ REPORTS ENDPOINTS ============

@api_router.get("/reports/daily-sales")
async def get_daily_sales(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_iso = today.isoformat()
    
    # Calculate sales revenue
    sales_pipeline = [
        {"$match": {
            "created_at": {"$gte": today_iso},
            "payment_status": "completed"
        }},
        {"$group": {
            "_id": None,
            "total_sales": {"$sum": "$total"},
            "total_transactions": {"$sum": 1}
        }}
    ]
    sales_result = await db.sales.aggregate(sales_pipeline).to_list(1)
    
    # Calculate completed repair jobs revenue
    repairs_pipeline = [
        {"$match": {
            "created_at": {"$gte": today_iso},
            "status": "completed"
        }},
        {"$group": {
            "_id": None,
            "total_repairs": {"$sum": "$cost"},
            "total_repair_jobs": {"$sum": 1}
        }}
    ]
    repairs_result = await db.repair_jobs.aggregate(repairs_pipeline).to_list(1)
    
    sales_total = sales_result[0]['total_sales'] if sales_result else 0
    sales_count = sales_result[0]['total_transactions'] if sales_result else 0
    repairs_total = repairs_result[0]['total_repairs'] if repairs_result else 0
    repairs_count = repairs_result[0]['total_repair_jobs'] if repairs_result else 0
    
    return {
        "date": today.date().isoformat(),
        "total_sales": sales_total + repairs_total,
        "total_transactions": sales_count + repairs_count
    }

@api_router.get("/reports/weekly-sales")
async def get_weekly_sales(current_user: dict = Depends(get_current_user)):
    # Calculate start of current week (Monday)
    today = datetime.now(timezone.utc)
    start_of_week = today - timedelta(days=today.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_week_iso = start_of_week.isoformat()
    
    # Calculate weekly sales revenue
    sales_pipeline = [
        {"$match": {
            "created_at": {"$gte": start_of_week_iso},
            "payment_status": "completed"
        }},
        {"$group": {
            "_id": None,
            "total_sales": {"$sum": "$total"},
            "total_transactions": {"$sum": 1}
        }}
    ]
    sales_result = await db.sales.aggregate(sales_pipeline).to_list(1)
    
    # Calculate completed repair jobs revenue for the week
    repairs_pipeline = [
        {"$match": {
            "created_at": {"$gte": start_of_week_iso},
            "status": "completed"
        }},
        {"$group": {
            "_id": None,
            "total_repairs": {"$sum": "$cost"},
            "total_repair_jobs": {"$sum": 1}
        }}
    ]
    repairs_result = await db.repair_jobs.aggregate(repairs_pipeline).to_list(1)
    
    sales_total = sales_result[0]['total_sales'] if sales_result else 0
    sales_count = sales_result[0]['total_transactions'] if sales_result else 0
    repairs_total = repairs_result[0]['total_repairs'] if repairs_result else 0
    repairs_count = repairs_result[0]['total_repair_jobs'] if repairs_result else 0
    
    return {
        "week_start": start_of_week.date().isoformat(),
        "week_end": today.date().isoformat(),
        "total_sales": sales_total + repairs_total,
        "total_transactions": sales_count + repairs_count
    }

@api_router.get("/reports/monthly-sales")
async def get_monthly_sales(current_user: dict = Depends(get_current_user)):
    # Calculate start of current month
    today = datetime.now(timezone.utc)
    start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_of_month_iso = start_of_month.isoformat()
    
    # Calculate monthly sales revenue
    sales_pipeline = [
        {"$match": {
            "created_at": {"$gte": start_of_month_iso},
            "payment_status": "completed"
        }},
        {"$group": {
            "_id": None,
            "total_sales": {"$sum": "$total"},
            "total_transactions": {"$sum": 1}
        }}
    ]
    sales_result = await db.sales.aggregate(sales_pipeline).to_list(1)
    
    # Calculate completed repair jobs revenue for the month
    repairs_pipeline = [
        {"$match": {
            "created_at": {"$gte": start_of_month_iso},
            "status": "completed"
        }},
        {"$group": {
            "_id": None,
            "total_repairs": {"$sum": "$cost"},
            "total_repair_jobs": {"$sum": 1}
        }}
    ]
    repairs_result = await db.repair_jobs.aggregate(repairs_pipeline).to_list(1)
    
    sales_total = sales_result[0]['total_sales'] if sales_result else 0
    sales_count = sales_result[0]['total_transactions'] if sales_result else 0
    repairs_total = repairs_result[0]['total_repairs'] if repairs_result else 0
    repairs_count = repairs_result[0]['total_repair_jobs'] if repairs_result else 0
    
    return {
        "month": today.strftime("%B %Y"),
        "month_start": start_of_month.date().isoformat(),
        "month_end": today.date().isoformat(),
        "total_sales": sales_total + repairs_total,
        "total_transactions": sales_count + repairs_count
    }

@api_router.get("/reports/dashboard-stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_iso = today.isoformat()
    
    # Today's sales
    sales_pipeline = [
        {"$match": {
            "created_at": {"$gte": today_iso},
            "payment_status": "completed"
        }},
        {"$group": {
            "_id": None,
            "total_sales": {"$sum": "$total"},
            "total_transactions": {"$sum": 1}
        }}
    ]
    sales_result = await db.sales.aggregate(sales_pipeline).to_list(1)
    
    # Today's completed repair jobs
    repairs_pipeline = [
        {"$match": {
            "created_at": {"$gte": today_iso},
            "status": "completed"
        }},
        {"$group": {
            "_id": None,
            "total_repairs": {"$sum": "$cost"},
            "total_repair_jobs": {"$sum": 1}
        }}
    ]
    repairs_result = await db.repair_jobs.aggregate(repairs_pipeline).to_list(1)
    
    sales_total = sales_result[0]['total_sales'] if sales_result else 0
    sales_count = sales_result[0]['total_transactions'] if sales_result else 0
    repairs_total = repairs_result[0]['total_repairs'] if repairs_result else 0
    repairs_count = repairs_result[0]['total_repair_jobs'] if repairs_result else 0
    
    # Pending repairs
    pending_repairs = await db.repair_jobs.count_documents({"status": {"$in": ["pending", "in-progress"]}})
    
    # Low stock items
    low_stock_pipeline = [
        {"$match": {"$expr": {"$lte": ["$quantity", "$low_stock_threshold"]}}},
        {"$count": "count"}
    ]
    low_stock_result = await db.inventory.aggregate(low_stock_pipeline).to_list(1)
    low_stock_count = low_stock_result[0]['count'] if low_stock_result else 0
    
    # Total customers
    total_customers = await db.customers.count_documents({})
    
    return {
        "today_sales": sales_total + repairs_total,
        "today_transactions": sales_count + repairs_count,
        "pending_repairs": pending_repairs,
        "low_stock_items": low_stock_count,
        "total_customers": total_customers
    }

@api_router.get("/reports/tax-summary")
async def get_tax_summary(current_user: dict = Depends(get_current_user)):
    """Get tax collection summary with breakdown by category and time periods"""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Calculate date ranges
    start_of_week = today - timedelta(days=today.weekday())
    start_of_month = today.replace(day=1)
    
    today_iso = today.isoformat()
    week_iso = start_of_week.isoformat()
    month_iso = start_of_month.isoformat()
    
    # Get current tax settings
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    tax_enabled = settings.get('tax_enabled', False) if settings else False
    tax_rate = settings.get('tax_rate', 0) if settings else 0
    exempt_categories = settings.get('tax_exempt_categories', []) if settings else []
    
    # Daily tax collected
    daily_pipeline = [
        {"$match": {"created_at": {"$gte": today_iso}, "payment_status": "completed"}},
        {"$group": {
            "_id": None,
            "total_tax": {"$sum": "$tax"},
            "total_sales": {"$sum": "$subtotal"},
            "transaction_count": {"$sum": 1}
        }}
    ]
    daily_result = await db.sales.aggregate(daily_pipeline).to_list(1)
    
    # Weekly tax collected
    weekly_pipeline = [
        {"$match": {"created_at": {"$gte": week_iso}, "payment_status": "completed"}},
        {"$group": {
            "_id": None,
            "total_tax": {"$sum": "$tax"},
            "total_sales": {"$sum": "$subtotal"},
            "transaction_count": {"$sum": 1}
        }}
    ]
    weekly_result = await db.sales.aggregate(weekly_pipeline).to_list(1)
    
    # Monthly tax collected
    monthly_pipeline = [
        {"$match": {"created_at": {"$gte": month_iso}, "payment_status": "completed"}},
        {"$group": {
            "_id": None,
            "total_tax": {"$sum": "$tax"},
            "total_sales": {"$sum": "$subtotal"},
            "transaction_count": {"$sum": 1}
        }}
    ]
    monthly_result = await db.sales.aggregate(monthly_pipeline).to_list(1)
    
    # Get category breakdown for the month (taxable vs exempt)
    # We need to look at individual items in each sale
    all_sales = await db.sales.find(
        {"created_at": {"$gte": month_iso}, "payment_status": "completed"},
        {"_id": 0, "items": 1, "subtotal": 1, "tax": 1}
    ).to_list(1000)
    
    category_totals = {}
    taxable_total = 0
    exempt_total = 0
    total_tax_collected = monthly_result[0]["total_tax"] if monthly_result else 0
    
    for sale in all_sales:
        for item in sale.get('items', []):
            # Look up item type
            inv_item = await db.inventory.find_one({"id": item.get('item_id')}, {"_id": 0, "type": 1})
            item_type = inv_item.get('type', 'other') if inv_item else 'other'
            item_subtotal = item.get('subtotal', 0)
            
            # Track by category
            if item_type not in category_totals:
                category_totals[item_type] = {"sales": 0, "is_exempt": False}
            category_totals[item_type]["sales"] += item_subtotal
            
            # Check if exempt (using current settings)
            is_exempt = item_type.lower() in [c.lower() for c in exempt_categories]
            category_totals[item_type]["is_exempt"] = is_exempt
            
            if is_exempt:
                exempt_total += item_subtotal
            else:
                taxable_total += item_subtotal
    
    # Format category breakdown - allocate actual tax proportionally to taxable categories
    category_breakdown = []
    for cat, data in sorted(category_totals.items(), key=lambda x: x[1]["sales"], reverse=True):
        if data["is_exempt"]:
            tax_for_category = 0
        else:
            # Proportional allocation of actual tax collected
            tax_for_category = (data["sales"] / taxable_total * total_tax_collected) if taxable_total > 0 else 0
        
        category_breakdown.append({
            "category": cat,
            "sales": data["sales"],
            "is_exempt": data["is_exempt"],
            "tax_collected": round(tax_for_category, 2)
        })
    
    return {
        "tax_enabled": tax_enabled,
        "tax_rate": tax_rate,
        "exempt_categories": exempt_categories,
        "daily": {
            "tax_collected": daily_result[0]["total_tax"] if daily_result else 0,
            "total_sales": daily_result[0]["total_sales"] if daily_result else 0,
            "transactions": daily_result[0]["transaction_count"] if daily_result else 0
        },
        "weekly": {
            "tax_collected": weekly_result[0]["total_tax"] if weekly_result else 0,
            "total_sales": weekly_result[0]["total_sales"] if weekly_result else 0,
            "transactions": weekly_result[0]["transaction_count"] if weekly_result else 0
        },
        "monthly": {
            "tax_collected": monthly_result[0]["total_tax"] if monthly_result else 0,
            "total_sales": monthly_result[0]["total_sales"] if monthly_result else 0,
            "transactions": monthly_result[0]["transaction_count"] if monthly_result else 0,
            "month": today.strftime("%B %Y")
        },
        "category_breakdown": category_breakdown,
        "taxable_vs_exempt": {
            "taxable_sales": taxable_total,
            "exempt_sales": exempt_total,
            "effective_tax_collected": taxable_total * tax_rate if tax_enabled else 0
        }
    }

@api_router.get("/reports/tax-summary/pdf")
async def export_tax_report_pdf(current_user: dict = Depends(get_current_user)):
    """Generate PDF export of tax report"""
    # Get tax summary data (reuse the logic)
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_week = today - timedelta(days=today.weekday())
    start_of_month = today.replace(day=1)
    
    today_iso = today.isoformat()
    week_iso = start_of_week.isoformat()
    month_iso = start_of_month.isoformat()
    
    # Get settings
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    tax_enabled = settings.get('tax_enabled', False) if settings else False
    tax_rate = settings.get('tax_rate', 0) if settings else 0
    exempt_categories = settings.get('tax_exempt_categories', []) if settings else []
    
    # Get aggregated data
    daily_pipeline = [
        {"$match": {"created_at": {"$gte": today_iso}, "payment_status": "completed"}},
        {"$group": {"_id": None, "total_tax": {"$sum": "$tax"}, "total_sales": {"$sum": "$subtotal"}, "transaction_count": {"$sum": 1}}}
    ]
    weekly_pipeline = [
        {"$match": {"created_at": {"$gte": week_iso}, "payment_status": "completed"}},
        {"$group": {"_id": None, "total_tax": {"$sum": "$tax"}, "total_sales": {"$sum": "$subtotal"}, "transaction_count": {"$sum": 1}}}
    ]
    monthly_pipeline = [
        {"$match": {"created_at": {"$gte": month_iso}, "payment_status": "completed"}},
        {"$group": {"_id": None, "total_tax": {"$sum": "$tax"}, "total_sales": {"$sum": "$subtotal"}, "transaction_count": {"$sum": 1}}}
    ]
    
    daily_result = await db.sales.aggregate(daily_pipeline).to_list(1)
    weekly_result = await db.sales.aggregate(weekly_pipeline).to_list(1)
    monthly_result = await db.sales.aggregate(monthly_pipeline).to_list(1)
    
    # Get category breakdown
    all_sales = await db.sales.find(
        {"created_at": {"$gte": month_iso}, "payment_status": "completed"},
        {"_id": 0, "items": 1}
    ).to_list(1000)
    
    category_totals = {}
    taxable_total = 0
    exempt_total = 0
    total_tax_collected = monthly_result[0]["total_tax"] if monthly_result else 0
    
    for sale in all_sales:
        for item in sale.get('items', []):
            inv_item = await db.inventory.find_one({"id": item.get('item_id')}, {"_id": 0, "type": 1})
            item_type = inv_item.get('type', 'other') if inv_item else 'other'
            item_subtotal = item.get('subtotal', 0)
            
            if item_type not in category_totals:
                category_totals[item_type] = {"sales": 0, "is_exempt": False}
            category_totals[item_type]["sales"] += item_subtotal
            
            is_exempt = item_type.lower() in [c.lower() for c in exempt_categories]
            category_totals[item_type]["is_exempt"] = is_exempt
            
            if is_exempt:
                exempt_total += item_subtotal
            else:
                taxable_total += item_subtotal
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, alignment=TA_CENTER, spaceAfter=20, textColor=colors.HexColor('#1e3a8a'))
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=12, alignment=TA_CENTER, spaceAfter=30, textColor=colors.gray)
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14, spaceBefore=20, spaceAfter=10, textColor=colors.HexColor('#374151'))
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'], fontSize=11, spaceAfter=6)
    
    elements = []
    
    # Title
    elements.append(Paragraph("TECHZONE", title_style))
    elements.append(Paragraph("Tax Report", ParagraphStyle('ReportTitle', parent=styles['Heading2'], fontSize=18, alignment=TA_CENTER, spaceAfter=10)))
    elements.append(Paragraph(f"Generated: {today.strftime('%B %d, %Y at %I:%M %p')}", subtitle_style))
    
    # Tax Configuration
    elements.append(Paragraph("Tax Configuration", heading_style))
    config_data = [
        ["Status", "Enabled" if tax_enabled else "Disabled"],
        ["Tax Rate", f"{tax_rate * 100:.1f}%"],
        ["Exempt Categories", ", ".join(exempt_categories) if exempt_categories else "None"]
    ]
    config_table = Table(config_data, colWidths=[2*inch, 4*inch])
    config_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
    ]))
    elements.append(config_table)
    elements.append(Spacer(1, 20))
    
    # Tax Collection Summary
    elements.append(Paragraph("Tax Collection Summary", heading_style))
    summary_data = [
        ["Period", "Sales", "Tax Collected", "Transactions"],
        ["Today", f"${daily_result[0]['total_sales']:.2f}" if daily_result else "$0.00", 
         f"${daily_result[0]['total_tax']:.2f}" if daily_result else "$0.00",
         str(daily_result[0]['transaction_count']) if daily_result else "0"],
        ["This Week", f"${weekly_result[0]['total_sales']:.2f}" if weekly_result else "$0.00",
         f"${weekly_result[0]['total_tax']:.2f}" if weekly_result else "$0.00",
         str(weekly_result[0]['transaction_count']) if weekly_result else "0"],
        [today.strftime("%B %Y"), f"${monthly_result[0]['total_sales']:.2f}" if monthly_result else "$0.00",
         f"${monthly_result[0]['total_tax']:.2f}" if monthly_result else "$0.00",
         str(monthly_result[0]['transaction_count']) if monthly_result else "0"],
    ]
    summary_table = Table(summary_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))
    
    # Taxable vs Exempt
    elements.append(Paragraph("Taxable vs Exempt Sales (This Month)", heading_style))
    total_sales = taxable_total + exempt_total
    taxable_pct = (taxable_total / total_sales * 100) if total_sales > 0 else 0
    exempt_pct = (exempt_total / total_sales * 100) if total_sales > 0 else 0
    
    taxable_exempt_data = [
        ["Type", "Amount", "Percentage"],
        ["Taxable Sales", f"${taxable_total:.2f}", f"{taxable_pct:.1f}%"],
        ["Exempt Sales", f"${exempt_total:.2f}", f"{exempt_pct:.1f}%"],
        ["Total", f"${total_sales:.2f}", "100%"],
    ]
    te_table = Table(taxable_exempt_data, colWidths=[2*inch, 2*inch, 2*inch])
    te_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f0fdf4')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
    ]))
    elements.append(te_table)
    elements.append(Spacer(1, 20))
    
    # Category Breakdown
    if category_totals:
        elements.append(Paragraph("Sales by Category (This Month)", heading_style))
        cat_data = [["Category", "Status", "Sales", "Tax Collected"]]
        
        for cat, data in sorted(category_totals.items(), key=lambda x: x[1]["sales"], reverse=True):
            status = "EXEMPT" if data["is_exempt"] else "TAXABLE"
            tax_for_cat = 0 if data["is_exempt"] else (data["sales"] / taxable_total * total_tax_collected if taxable_total > 0 else 0)
            cat_data.append([
                cat.capitalize(),
                status,
                f"${data['sales']:.2f}",
                f"${tax_for_cat:.2f}" if not data["is_exempt"] else "-"
            ])
        
        # Total row
        cat_data.append(["Total", "", f"${total_sales:.2f}", f"${total_tax_collected:.2f}"])
        
        cat_table = Table(cat_data, colWidths=[1.5*inch, 1.2*inch, 1.5*inch, 1.5*inch])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#eff6ff')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ]))
        elements.append(cat_table)
    
    # Footer
    elements.append(Spacer(1, 40))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.gray, alignment=TA_CENTER)
    elements.append(Paragraph("30 Giltress Street, Kingston 2, JA | 876-633-9251 / 876-843-2416", footer_style))
    elements.append(Paragraph("This report is for internal accounting purposes.", footer_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"tax_report_{today.strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()