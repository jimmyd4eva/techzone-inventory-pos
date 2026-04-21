"""Route module extracted from server.py."""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from core.config import db, logger
import uuid
import os
from core.config import (
    STRIPE_AVAILABLE, StripeCheckout, CheckoutSessionRequest,
    PAYPAL_AVAILABLE, paypal_client, PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_MODE,
    STRIPE_API_KEY,
    OrdersCreateRequest, OrdersCaptureRequest, OrdersGetRequest,
)
from core.security import get_current_user
from models import Sale, PaymentTransaction, CheckoutRequest

router = APIRouter()

@router.post("/payments/checkout")
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

@router.get("/payments/status/{session_id}")
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

@router.post("/webhook/stripe")
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

@router.post("/payments/paypal/create-order")
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

@router.post("/payments/paypal/capture/{order_id}")
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

@router.get("/payments/paypal/status/{order_id}")
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
