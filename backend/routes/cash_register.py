"""Route module extracted from server.py."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from core.config import db, logger
import io
import uuid
from fastapi.responses import StreamingResponse
from core.security import get_current_user, check_not_readonly, strip_html
from services.email_service import send_shift_report_email
from services.shift_report_service import (
    calculate_transaction_totals,
    calculate_expected_cash,
    fetch_business_info,
    build_shift_report_pdf,
    build_close_shift_email_pdf,
)
from models import CashRegisterShift, CashRegisterTransaction, OpenShiftRequest, CloseShiftRequest, CashTransactionRequest

router = APIRouter(tags=["Cash Register"])

@router.get("/cash-register/current")
async def get_current_shift(current_user: dict = Depends(get_current_user)):
    """Get the current open shift, if any"""
    shift = await db.cash_register_shifts.find_one(
        {"status": "open"},
        {"_id": 0}
    )
    if not shift:
        return {"shift": None, "transactions": [], "totals": {}}
    
    # Get all transactions for this shift
    transactions = await db.cash_register_transactions.find(
        {"shift_id": shift["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Calculate totals
    cash_sales = sum(t["amount"] for t in transactions if t["transaction_type"] == "cash_sale")
    payouts = sum(abs(t["amount"]) for t in transactions if t["transaction_type"] == "payout")
    drops = sum(abs(t["amount"]) for t in transactions if t["transaction_type"] == "drop")
    refunds = sum(abs(t["amount"]) for t in transactions if t["transaction_type"] == "refund")
    
    expected = shift["opening_amount"] + cash_sales - payouts - drops - refunds
    
    totals = {
        "opening_amount": shift["opening_amount"],
        "cash_sales": cash_sales,
        "payouts": payouts,
        "drops": drops,
        "refunds": refunds,
        "expected_amount": expected
    }
    
    return {"shift": shift, "transactions": transactions, "totals": totals}

@router.post("/cash-register/open")
async def open_shift(request: OpenShiftRequest, current_user: dict = Depends(get_current_user)):
    """Open a new cash register shift"""
    check_not_readonly(current_user)
    
    # Check if there's already an open shift
    existing = await db.cash_register_shifts.find_one({"status": "open"})
    if existing:
        raise HTTPException(status_code=400, detail="A shift is already open. Please close it first.")
    
    # Get user info
    user_doc = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    username = user_doc.get("username", "Unknown") if user_doc else current_user.get("username", "Unknown")
    
    shift = CashRegisterShift(
        opened_by=current_user["user_id"],
        opened_by_name=username,
        opening_amount=request.opening_amount
    )
    
    doc = shift.model_dump()
    doc["opened_at"] = doc["opened_at"].isoformat()
    
    await db.cash_register_shifts.insert_one(doc)
    
    # Remove MongoDB's _id before returning
    doc.pop("_id", None)
    
    return {"message": "Shift opened successfully", "shift": doc}

@router.post("/cash-register/close")
async def close_shift(request: CloseShiftRequest, current_user: dict = Depends(get_current_user)):
    """Close the current cash register shift"""
    check_not_readonly(current_user)

    shift = await db.cash_register_shifts.find_one({"status": "open"})
    if not shift:
        raise HTTPException(status_code=400, detail="No open shift found")

    # Recompute totals at close
    transactions = await db.cash_register_transactions.find({"shift_id": shift["id"]}).to_list(1000)
    totals = calculate_transaction_totals(transactions)
    expected = calculate_expected_cash(shift["opening_amount"], totals)
    difference = request.closing_amount - expected

    user_doc = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    username = user_doc.get("username", "Unknown") if user_doc else current_user.get("username", "Unknown")
    closed_at = datetime.now(timezone.utc)

    await db.cash_register_shifts.update_one(
        {"id": shift["id"]},
        {"$set": {
            "status": "closed",
            "closing_amount": request.closing_amount,
            "expected_amount": expected,
            "difference": difference,
            "notes": request.notes,
            "closed_at": closed_at.isoformat(),
            "closed_by": current_user["user_id"],
            "closed_by_name": username,
        }},
    )

    email_sent = await _maybe_send_close_shift_email(shift, totals, expected, request.closing_amount, difference, username)

    return {
        "message": "Shift closed successfully",
        "email_sent": email_sent,
        "summary": {
            "opening_amount": shift["opening_amount"],
            "cash_sales": totals["cash_sales"],
            "payouts": totals["payouts"],
            "drops": totals["drops"],
            "refunds": totals["refunds"],
            "expected_amount": expected,
            "closing_amount": request.closing_amount,
            "difference": difference,
            "status": "over" if difference > 0 else "short" if difference < 0 else "balanced",
        },
    }


async def _maybe_send_close_shift_email(shift, totals, expected, closing_amount, difference, closed_by_name):
    """Auto-email the shift close report if enabled in settings. Returns True on success."""
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0}) or {}
    if not (settings.get("shift_report_email_enabled") and settings.get("shift_report_email")):
        return False

    business_name = strip_html(settings.get("business_name", "TECHZONE"))
    try:
        pdf_bytes = build_close_shift_email_pdf(business_name, shift, totals, expected, closing_amount, difference)
        shift_data = {
            "opened_at": shift["opened_at"],
            "opened_by_name": shift.get("opened_by_name", "Unknown"),
            "closed_by_name": closed_by_name,
            "opening_amount": shift["opening_amount"],
            "expected_amount": expected,
            "closing_amount": closing_amount,
            "difference": difference,
        }
        return send_shift_report_email(settings["shift_report_email"], shift_data, pdf_bytes, business_name)
    except Exception as e:
        logger.error(f"Failed to send shift report email: {e}")
        return False

@router.post("/cash-register/transaction")
async def add_cash_transaction(request: CashTransactionRequest, current_user: dict = Depends(get_current_user)):
    """Add a cash register transaction (payout, drop, refund)"""
    check_not_readonly(current_user)
    
    # Find open shift
    shift = await db.cash_register_shifts.find_one({"status": "open"})
    if not shift:
        raise HTTPException(status_code=400, detail="No open shift. Please open a shift first.")
    
    if request.transaction_type not in ["payout", "drop", "refund"]:
        raise HTTPException(status_code=400, detail="Invalid transaction type. Use: payout, drop, refund")
    
    # Get user info
    user_doc = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    username = user_doc.get("username", "Unknown") if user_doc else current_user.get("username", "Unknown")
    
    # Amount should be negative for payouts/drops/refunds (money going out)
    amount = -abs(request.amount)
    
    transaction = CashRegisterTransaction(
        shift_id=shift["id"],
        transaction_type=request.transaction_type,
        amount=amount,
        description=request.description,
        created_by=current_user["user_id"],
        created_by_name=username
    )
    
    doc = transaction.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.cash_register_transactions.insert_one(doc)
    
    # Remove MongoDB's _id before returning
    doc.pop("_id", None)
    
    return {"message": "Transaction recorded", "transaction": doc}

@router.get("/cash-register/history")
async def get_shift_history(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get recent closed shifts for history/reporting"""
    shifts = await db.cash_register_shifts.find(
        {"status": "closed"},
        {"_id": 0}
    ).sort("closed_at", -1).limit(limit).to_list(limit)
    
    return shifts

@router.get("/cash-register/shift/{shift_id}")
async def get_shift_details(shift_id: str, current_user: dict = Depends(get_current_user)):
    """Get details of a specific shift including all transactions"""
    shift = await db.cash_register_shifts.find_one({"id": shift_id}, {"_id": 0})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    transactions = await db.cash_register_transactions.find(
        {"shift_id": shift_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    return {"shift": shift, "transactions": transactions}

@router.get("/cash-register/daily-summary")
async def get_daily_summary(
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get daily summary of all shifts and transactions"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can view daily summary")
    
    # Parse date or use today
    if date:
        try:
            target_date = datetime.fromisoformat(date)
        except ValueError:
            target_date = datetime.now(timezone.utc)
    else:
        target_date = datetime.now(timezone.utc)
    
    start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    # Get all shifts that were opened or closed on this day
    shifts = await db.cash_register_shifts.find({
        "$or": [
            {"opened_at": {"$gte": start_of_day.isoformat(), "$lt": end_of_day.isoformat()}},
            {"closed_at": {"$gte": start_of_day.isoformat(), "$lt": end_of_day.isoformat()}}
        ]
    }, {"_id": 0}).to_list(100)
    
    # Aggregate totals
    total_cash_sales = 0
    total_payouts = 0
    total_drops = 0
    total_refunds = 0
    total_difference = 0
    
    for shift in shifts:
        transactions = await db.cash_register_transactions.find(
            {"shift_id": shift["id"]},
            {"_id": 0}
        ).to_list(1000)
        
        for t in transactions:
            if t["transaction_type"] == "cash_sale":
                total_cash_sales += t["amount"]
            elif t["transaction_type"] == "payout":
                total_payouts += abs(t["amount"])
            elif t["transaction_type"] == "drop":
                total_drops += abs(t["amount"])
            elif t["transaction_type"] == "refund":
                total_refunds += abs(t["amount"])
        
        if shift.get("difference"):
            total_difference += shift["difference"]
    
    return {
        "date": start_of_day.strftime("%Y-%m-%d"),
        "shifts_count": len(shifts),
        "shifts": shifts,
        "totals": {
            "cash_sales": total_cash_sales,
            "payouts": total_payouts,
            "drops": total_drops,
            "refunds": total_refunds,
            "variance": total_difference
        }
    }

@router.get("/cash-register/report/{shift_id}")
async def generate_shift_report(shift_id: str, current_user: dict = Depends(get_current_user)):
    """Generate PDF report for a specific shift."""
    shift = await db.cash_register_shifts.find_one({"id": shift_id}, {"_id": 0})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    transactions = await db.cash_register_transactions.find(
        {"shift_id": shift_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(1000)

    pdf_bytes, filename = await build_shift_report_pdf(shift, transactions)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

