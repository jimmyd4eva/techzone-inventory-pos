"""Route module extracted from server.py."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from core.config import db, logger
from core.security import get_current_user, check_not_readonly, strip_html
from services.email_service import send_coupon_email
from models import Coupon, CouponCreate, CouponUpdate

router = APIRouter(tags=["Coupons"])

@router.get("/coupons")
async def get_coupons(current_user: dict = Depends(get_current_user)):
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return coupons

@router.get("/coupons/{coupon_id}")
async def get_coupon(coupon_id: str, current_user: dict = Depends(get_current_user)):
    coupon = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return coupon

@router.post("/coupons")
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
        customer_id=coupon_data.customer_id,
        customer_name=coupon_data.customer_name,
        created_by=current_user.get('username')
    )
    
    doc = coupon.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.coupons.insert_one(doc)
    
    return {k: v for k, v in doc.items() if k != '_id'}

@router.put("/coupons/{coupon_id}")
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

@router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can delete coupons")
    
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"message": "Coupon deleted successfully"}

@router.post("/coupons/validate")
async def validate_coupon(data: dict, current_user: dict = Depends(get_current_user)):
    """Validate a coupon code and calculate discount"""
    code = data.get('code', '').upper()
    subtotal = data.get('subtotal', 0)
    customer_id = data.get('customer_id')

    coupon = await db.coupons.find_one({"code": code}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    if not coupon.get('is_active', False):
        raise HTTPException(status_code=400, detail="This coupon is no longer active")

    # Personalized coupon: locked to a specific customer
    if coupon.get('customer_id'):
        if not customer_id:
            raise HTTPException(
                status_code=400,
                detail="This coupon is personalized and requires a customer at checkout",
            )
        if customer_id != coupon.get('customer_id'):
            raise HTTPException(
                status_code=400,
                detail="This coupon is not valid for this customer",
            )

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

@router.post("/coupons/{coupon_id}/increment-usage")
async def increment_coupon_usage(coupon_id: str, current_user: dict = Depends(get_current_user)):
    """Increment usage count when a coupon is used in a sale"""
    result = await db.coupons.update_one(
        {"id": coupon_id},
        {"$inc": {"usage_count": 1}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"message": "Usage count incremented"}


@router.post("/coupons/{coupon_id}/email-to-customer")
async def email_coupon_to_customer(coupon_id: str, current_user: dict = Depends(get_current_user)):
    """Email a personalized coupon to its assigned customer's email on file."""
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can send coupon emails")

    coupon = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    customer_id = coupon.get("customer_id")
    if not customer_id:
        raise HTTPException(
            status_code=400,
            detail="This coupon is not personalized — emailing requires a linked customer.",
        )

    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Linked customer not found")

    email = (customer.get("email") or "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="Customer has no email on file")

    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0}) or {}
    business_name = strip_html(settings.get("business_name", "TECHZONE"))

    sent = send_coupon_email(email, customer.get("name", "Valued Customer"), coupon, business_name)
    if not sent:
        raise HTTPException(
            status_code=500,
            detail="Failed to send email. Check SMTP settings / server logs.",
        )
    return {"sent": True, "recipient": email}
