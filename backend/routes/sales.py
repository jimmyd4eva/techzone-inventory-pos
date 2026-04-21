"""Route module extracted from server.py."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from core.config import db, logger
import uuid
from core.security import get_current_user, check_not_readonly
from models import Sale, SaleCreate, SaleItem, PaymentTransaction, CheckoutRequest

router = APIRouter(tags=["Sales"])

@router.post("/sales", response_model=Sale)
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
            # Personalized coupon: must match the customer on this sale
            if coupon.get('customer_id') and coupon.get('customer_id') != sale_data.customer_id:
                pass  # Skip - coupon locked to another customer
            # Validate coupon
            elif coupon.get('usage_limit') and coupon.get('usage_count', 0) >= coupon.get('usage_limit'):
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
    
    # Handle points redemption
    points_used = 0
    points_discount = 0
    points_earned = 0
    customer = None
    
    if sale_data.customer_id:
        customer = await db.customers.find_one({"id": sale_data.customer_id})
    
    # Check points settings
    points_enabled = settings.get('points_enabled', False) if settings else False
    points_per_dollar = settings.get('points_per_dollar', 0.002) if settings else 0.002  # 1 point per $500
    points_threshold = settings.get('points_redemption_threshold', 3500) if settings else 3500
    points_value = settings.get('points_value', 1) if settings else 1
    
    if points_enabled and customer:
        customer_total_spent = customer.get('total_spent', 0)
        customer_points = customer.get('points_balance', 0)
        
        # Handle points redemption if requested and eligible
        if sale_data.points_to_use > 0 and customer_total_spent >= points_threshold:
            # Use up to available points, but not more than sale total after other discounts
            max_points_can_use = min(sale_data.points_to_use, customer_points)
            max_discount_from_points = subtotal + tax - discount  # Can't discount more than remaining
            points_discount = min(max_points_can_use * points_value, max_discount_from_points)
            points_used = points_discount / points_value  # Actual points used
    
    total = subtotal + tax - discount - points_discount
    
    # Calculate points earned from this purchase (after all discounts applied)
    if points_enabled and customer:
        points_earned = total * points_per_dollar
    
    # Get customer name - prioritize the direct customer_name field over customer_id lookup
    customer_name = sale_data.customer_name
    if not customer_name and customer:
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
        points_used=points_used,
        points_discount=points_discount,
        points_earned=points_earned,
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
        
        # Update customer points if applicable
        if points_enabled and customer and sale_data.customer_id:
            await db.customers.update_one(
                {"id": sale_data.customer_id},
                {
                    "$inc": {
                        "total_spent": total,
                        "points_balance": points_earned - points_used,
                        "points_earned": points_earned,
                        "points_redeemed": points_used
                    }
                }
            )

            # Send loyalty points email if enabled + customer has email + they earned points
            if (
                settings.get("loyalty_emails_enabled")
                and customer.get("email")
                and points_earned > 0
            ):
                new_balance = int(customer.get("points_balance", 0)) + int(points_earned) - int(points_used)
                # Milestone detection: crossed 100 / 500 / 1000 with this sale
                prev_balance = int(customer.get("points_balance", 0))
                milestone = None
                for m in (100, 500, 1000):
                    if prev_balance < m <= new_balance:
                        milestone = m  # take the highest crossed
                try:
                    from core.security import strip_html as _strip
                    from services.email_service import send_loyalty_points_email
                    business_name = _strip(settings.get("business_name", "TECHZONE"))
                    review_url = (settings.get("google_review_url") or "").strip() or None
                    send_loyalty_points_email(
                        to_email=customer["email"],
                        customer_name=customer.get("name", "Valued Customer"),
                        points_earned=int(points_earned),
                        points_balance=new_balance,
                        sale_total=float(total),
                        business_name=business_name,
                        milestone=milestone,
                        review_url=review_url,
                    )
                except Exception as _e:
                    logger.warning(f"Loyalty email failed (non-fatal): {_e}")

        # Schedule follow-up email if enabled + customer has email
        if (
            settings.get("followup_emails_enabled")
            and customer
            and customer.get("email")
        ):
            try:
                days = int(settings.get("followup_days") or 14)
                if days < 1:
                    days = 14
                send_at = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
                items_summary = ", ".join(i.item_name for i in sale_data.items[:3])
                if len(sale_data.items) > 3:
                    items_summary += f" and {len(sale_data.items) - 3} more"
                await db.followups.insert_one({
                    "id": str(uuid.uuid4()),
                    "sale_id": sale.id,
                    "customer_id": sale_data.customer_id,
                    "customer_name": customer.get("name", "Valued Customer"),
                    "customer_email": customer["email"],
                    "items_summary": items_summary or "your order",
                    "days": days,
                    "send_at": send_at,
                    "status": "pending",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
            except Exception as _e:
                logger.warning(f"Failed to schedule follow-up (non-fatal): {_e}")
        
        # Record cash sale in cash register if shift is open
        if sale_data.payment_method == "cash":
            open_shift = await db.cash_register_shifts.find_one({"status": "open"})
            if open_shift:
                user_doc = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
                username = user_doc.get("username", "Unknown") if user_doc else current_user.get("username", "Unknown")
                
                cash_transaction = {
                    "id": str(uuid.uuid4()),
                    "shift_id": open_shift["id"],
                    "transaction_type": "cash_sale",
                    "amount": total,  # Positive amount for cash coming in
                    "description": f"Sale #{sale.id[:8]}",
                    "sale_id": sale.id,
                    "created_by": current_user["user_id"],
                    "created_by_name": username,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.cash_register_transactions.insert_one(cash_transaction)
    
    return sale

@router.get("/sales", response_model=List[Sale])
async def get_sales(current_user: dict = Depends(get_current_user)):
    sales = await db.sales.find({}, {"_id": 0}).to_list(1000)
    for sale in sales:
        if isinstance(sale['created_at'], str):
            sale['created_at'] = datetime.fromisoformat(sale['created_at'])
    return sales

@router.get("/sales/{sale_id}", response_model=Sale)
async def get_sale(sale_id: str, current_user: dict = Depends(get_current_user)):
    sale = await db.sales.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@router.delete("/sales/{sale_id}")
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
