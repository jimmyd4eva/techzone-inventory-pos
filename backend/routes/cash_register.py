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
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from models import CashRegisterShift, CashRegisterTransaction, OpenShiftRequest, CloseShiftRequest, CashTransactionRequest

router = APIRouter()

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
    
    # Find open shift
    shift = await db.cash_register_shifts.find_one({"status": "open"})
    if not shift:
        raise HTTPException(status_code=400, detail="No open shift found")
    
    # Calculate expected amount
    transactions = await db.cash_register_transactions.find(
        {"shift_id": shift["id"]}
    ).to_list(1000)
    
    cash_sales = sum(t["amount"] for t in transactions if t["transaction_type"] == "cash_sale")
    payouts = sum(abs(t["amount"]) for t in transactions if t["transaction_type"] == "payout")
    drops = sum(abs(t["amount"]) for t in transactions if t["transaction_type"] == "drop")
    refunds = sum(abs(t["amount"]) for t in transactions if t["transaction_type"] == "refund")
    
    expected = shift["opening_amount"] + cash_sales - payouts - drops - refunds
    difference = request.closing_amount - expected
    
    # Get user info
    user_doc = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    username = user_doc.get("username", "Unknown") if user_doc else current_user.get("username", "Unknown")
    
    closed_at = datetime.now(timezone.utc)
    
    # Update shift
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
            "closed_by_name": username
        }}
    )
    
    # Check if auto-email is enabled and send report
    email_sent = False
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    if settings and settings.get("shift_report_email_enabled") and settings.get("shift_report_email"):
        try:
            # Generate PDF
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.enums import TA_CENTER
            
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
            elements = []
            styles = getSampleStyleSheet()
            
            business_name = strip_html(settings.get("business_name", "TECHZONE"))
            
            # Build simple PDF for email
            title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=20, textColor=colors.HexColor('#8b5cf6'), spaceAfter=6)
            subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=12, textColor=colors.gray, alignment=TA_CENTER)
            
            elements.append(Paragraph(business_name, title_style))
            elements.append(Paragraph("Cash Register Shift Report", subtitle_style))
            elements.append(Spacer(1, 20))
            
            # Summary
            summary_data = [
                ["Description", "Amount"],
                ["Opening Float", f"${shift['opening_amount']:.2f}"],
                ["+ Cash Sales", f"${cash_sales:.2f}"],
                ["- Payouts", f"${payouts:.2f}"],
                ["- Safe Drops", f"${drops:.2f}"],
                ["- Refunds", f"${refunds:.2f}"],
                ["= Expected Cash", f"${expected:.2f}"],
                ["Actual Cash Count", f"${request.closing_amount:.2f}"],
                ["Variance", f"${difference:.2f}"],
            ]
            
            summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('PADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ]))
            elements.append(summary_table)
            
            doc.build(elements)
            pdf_bytes = buffer.getvalue()
            
            # Send email
            shift_data = {
                "opened_at": shift["opened_at"],
                "opened_by_name": shift.get("opened_by_name", "Unknown"),
                "closed_by_name": username,
                "opening_amount": shift["opening_amount"],
                "expected_amount": expected,
                "closing_amount": request.closing_amount,
                "difference": difference
            }
            
            email_sent = send_shift_report_email(
                settings["shift_report_email"],
                shift_data,
                pdf_bytes,
                business_name
            )
        except Exception as e:
            logger.error(f"Failed to send shift report email: {e}")
    
    return {
        "message": "Shift closed successfully",
        "email_sent": email_sent,
        "summary": {
            "opening_amount": shift["opening_amount"],
            "cash_sales": cash_sales,
            "payouts": payouts,
            "drops": drops,
            "refunds": refunds,
            "expected_amount": expected,
            "closing_amount": request.closing_amount,
            "difference": difference,
            "status": "over" if difference > 0 else "short" if difference < 0 else "balanced"
        }
    }

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
        except:
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
    """Generate PDF report for a specific shift"""
    
    # Get shift details
    shift = await db.cash_register_shifts.find_one({"id": shift_id}, {"_id": 0})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    # Get transactions for this shift
    transactions = await db.cash_register_transactions.find(
        {"shift_id": shift_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    # Get business settings
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    business_name = strip_html(settings.get("business_name", "TECHZONE")) if settings else "TECHZONE"
    business_address = strip_html(settings.get("business_address", "")) if settings else ""
    business_phone = strip_html(settings.get("business_phone", "")) if settings else ""
    
    # Calculate totals
    cash_sales = sum(t["amount"] for t in transactions if t["transaction_type"] == "cash_sale")
    payouts = sum(abs(t["amount"]) for t in transactions if t["transaction_type"] == "payout")
    drops = sum(abs(t["amount"]) for t in transactions if t["transaction_type"] == "drop")
    refunds = sum(abs(t["amount"]) for t in transactions if t["transaction_type"] == "refund")
    expected = shift["opening_amount"] + cash_sales - payouts - drops - refunds
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=20, textColor=colors.HexColor('#8b5cf6'), spaceAfter=6)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=12, textColor=colors.gray, alignment=TA_CENTER)
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#374151'), spaceBefore=20, spaceAfter=10)
    
    # Header
    elements.append(Paragraph(business_name, title_style))
    elements.append(Paragraph("Cash Register Shift Report", subtitle_style))
    if business_address:
        elements.append(Paragraph(business_address, subtitle_style))
    if business_phone:
        elements.append(Paragraph(business_phone, subtitle_style))
    elements.append(Spacer(1, 20))
    
    # Shift Info
    opened_at = datetime.fromisoformat(shift["opened_at"].replace("Z", "+00:00")) if isinstance(shift["opened_at"], str) else shift["opened_at"]
    closed_at = None
    if shift.get("closed_at"):
        closed_at = datetime.fromisoformat(shift["closed_at"].replace("Z", "+00:00")) if isinstance(shift["closed_at"], str) else shift["closed_at"]
    
    status = "OPEN" if shift["status"] == "open" else "CLOSED"
    
    shift_info = [
        ["Shift ID:", shift["id"][:8] + "..."],
        ["Status:", status],
        ["Opened By:", shift.get("opened_by_name", "Unknown")],
        ["Opened At:", opened_at.strftime("%Y-%m-%d %H:%M:%S")],
    ]
    
    if closed_at:
        shift_info.append(["Closed By:", shift.get("closed_by_name", "Unknown")])
        shift_info.append(["Closed At:", closed_at.strftime("%Y-%m-%d %H:%M:%S")])
    
    info_table = Table(shift_info, colWidths=[1.5*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))
    
    # Summary Box
    elements.append(Paragraph("Cash Summary", heading_style))
    
    summary_data = [
        ["Description", "Amount"],
        ["Opening Float", f"${shift['opening_amount']:.2f}"],
        ["+ Cash Sales", f"${cash_sales:.2f}"],
        ["- Payouts", f"${payouts:.2f}"],
        ["- Safe Drops", f"${drops:.2f}"],
        ["- Refunds", f"${refunds:.2f}"],
        ["= Expected Cash", f"${expected:.2f}"],
    ]
    
    if shift["status"] == "closed":
        summary_data.append(["Actual Cash Count", f"${shift.get('closing_amount', 0):.2f}"])
        diff = shift.get("difference", 0)
        diff_status = "OVER" if diff > 0 else "SHORT" if diff < 0 else "BALANCED"
        summary_data.append(["Variance", f"${diff:.2f} ({diff_status})"])
    
    summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f3e8ff')),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))
    
    # Transactions
    if transactions:
        elements.append(Paragraph(f"Transactions ({len(transactions)})", heading_style))
        
        txn_data = [["Time", "Type", "Description", "Amount"]]
        for t in transactions:
            txn_time = datetime.fromisoformat(t["created_at"].replace("Z", "+00:00")) if isinstance(t["created_at"], str) else t["created_at"]
            txn_type = t["transaction_type"].replace("_", " ").upper()
            amount_str = f"${t['amount']:.2f}" if t["amount"] >= 0 else f"-${abs(t['amount']):.2f}"
            txn_data.append([
                txn_time.strftime("%H:%M:%S"),
                txn_type,
                t.get("description", "-")[:30],
                amount_str
            ])
        
        txn_table = Table(txn_data, colWidths=[1*inch, 1.2*inch, 2.5*inch, 1*inch])
        txn_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ]))
        elements.append(txn_table)
    
    # Notes
    if shift.get("notes"):
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Notes", heading_style))
        elements.append(Paragraph(shift["notes"], styles['Normal']))
    
    # Footer
    elements.append(Spacer(1, 40))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.gray, alignment=TA_CENTER)
    elements.append(Paragraph(f"Generated on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", footer_style))
    elements.append(Paragraph("This report is for internal record-keeping purposes.", footer_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    # Create filename
    date_str = opened_at.strftime('%Y%m%d')
    filename = f"cash_register_report_{date_str}_{shift['id'][:8]}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

