"""Route module extracted from server.py."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from core.config import db, logger
from core.security import get_current_user, check_not_readonly
from models import Customer, CustomerCreate

router = APIRouter(tags=["Customers"])

@router.post("/customers", response_model=Customer)
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

@router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: dict = Depends(get_current_user)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    for customer in customers:
        if isinstance(customer['created_at'], str):
            customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    return customers

@router.get("/customers/{customer_id}")
async def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get settings for points info
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    points_enabled = settings.get('points_enabled', False) if settings else False
    points_threshold = settings.get('points_redemption_threshold', 3500) if settings else 3500
    points_value = settings.get('points_value', 1) if settings else 1
    
    # Add points info
    customer['points_info'] = {
        'points_enabled': points_enabled,
        'can_redeem': customer.get('total_spent', 0) >= points_threshold,
        'threshold': points_threshold,
        'points_value': points_value,
        'spend_to_unlock': max(0, points_threshold - customer.get('total_spent', 0))
    }
    
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

@router.get("/customers/account/{account_number}")
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

@router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, customer_data: CustomerCreate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    result = await db.customers.update_one(
        {"id": customer_id},
        {"$set": customer_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer updated successfully"}

@router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

