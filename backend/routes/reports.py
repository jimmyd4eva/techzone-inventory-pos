"""Route module extracted from server.py."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from core.config import db, logger
import io
from fastapi.responses import StreamingResponse
from core.security import get_current_user, strip_html
from services.summary_service import build_summary_pdf, send_summary_email
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_RIGHT

router = APIRouter(tags=["Reports"])

@router.get("/reports/daily-sales")
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

@router.get("/reports/weekly-sales")
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

@router.get("/reports/monthly-sales")
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

@router.get("/reports/dashboard-stats")
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
    
    # Total stock items (total inventory count)
    total_stock_items = await db.inventory.count_documents({})
    
    # Total customers
    total_customers = await db.customers.count_documents({})
    
    return {
        "today_sales": sales_total + repairs_total,
        "today_transactions": sales_count + repairs_count,
        "pending_repairs": pending_repairs,
        "low_stock_items": low_stock_count,
        "total_stock_items": total_stock_items,
        "total_customers": total_customers
    }

@router.get("/reports/coupon-analytics")
async def get_coupon_analytics(current_user: dict = Depends(get_current_user)):
    """Get coupon usage analytics including popularity, revenue impact, and trends"""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_month = today.replace(day=1)
    month_iso = start_of_month.isoformat()
    
    # Get all coupons
    all_coupons = await db.coupons.find({}, {"_id": 0}).to_list(1000)
    
    # Get sales with coupons this month
    sales_with_coupons = await db.sales.find(
        {"coupon_code": {"$ne": None}, "created_at": {"$gte": month_iso}, "payment_status": "completed"},
        {"_id": 0}
    ).to_list(1000)
    
    # Get all sales this month for comparison
    all_sales_month = await db.sales.find(
        {"created_at": {"$gte": month_iso}, "payment_status": "completed"},
        {"_id": 0, "total": 1, "discount": 1, "coupon_code": 1}
    ).to_list(1000)
    
    # Calculate overall stats
    total_sales_count = len(all_sales_month)
    sales_with_coupon_count = len([s for s in all_sales_month if s.get('coupon_code')])
    total_discount_given = sum(s.get('discount', 0) for s in all_sales_month)
    total_revenue = sum(s.get('total', 0) for s in all_sales_month)
    
    # Coupon usage breakdown
    coupon_stats = {}
    for sale in sales_with_coupons:
        code = sale.get('coupon_code')
        if code:
            if code not in coupon_stats:
                coupon_stats[code] = {
                    'code': code,
                    'usage_count': 0,
                    'total_discount': 0,
                    'total_revenue': 0,
                    'avg_order_value': 0
                }
            coupon_stats[code]['usage_count'] += 1
            coupon_stats[code]['total_discount'] += sale.get('discount', 0)
            coupon_stats[code]['total_revenue'] += sale.get('total', 0)
    
    # Calculate averages and sort by usage
    coupon_breakdown = []
    for code, stats in coupon_stats.items():
        if stats['usage_count'] > 0:
            stats['avg_order_value'] = stats['total_revenue'] / stats['usage_count']
        
        # Find coupon details
        coupon = next((c for c in all_coupons if c.get('code') == code), None)
        if coupon:
            stats['discount_type'] = coupon.get('discount_type')
            stats['discount_value'] = coupon.get('discount_value')
            stats['is_active'] = coupon.get('is_active', False)
        
        coupon_breakdown.append(stats)
    
    # Sort by usage count (most popular first)
    coupon_breakdown.sort(key=lambda x: x['usage_count'], reverse=True)
    
    # Top performing coupons (by revenue generated)
    top_by_revenue = sorted(coupon_breakdown, key=lambda x: x['total_revenue'], reverse=True)[:5]
    
    # Calculate conversion rate (sales with coupons vs without)
    conversion_rate = (sales_with_coupon_count / total_sales_count * 100) if total_sales_count > 0 else 0
    
    return {
        "summary": {
            "total_coupons": len(all_coupons),
            "active_coupons": len([c for c in all_coupons if c.get('is_active')]),
            "total_sales_this_month": total_sales_count,
            "sales_with_coupons": sales_with_coupon_count,
            "coupon_usage_rate": round(conversion_rate, 1),
            "total_discount_given": round(total_discount_given, 2),
            "total_revenue_with_coupons": round(sum(s.get('total', 0) for s in sales_with_coupons), 2),
            "avg_discount_per_sale": round(total_discount_given / sales_with_coupon_count, 2) if sales_with_coupon_count > 0 else 0,
            "month": today.strftime("%B %Y")
        },
        "coupon_breakdown": coupon_breakdown,
        "top_by_revenue": top_by_revenue,
        "all_coupons_status": [
            {
                "code": c.get('code'),
                "description": c.get('description'),
                "discount_type": c.get('discount_type'),
                "discount_value": c.get('discount_value'),
                "usage_count": c.get('usage_count', 0),
                "usage_limit": c.get('usage_limit'),
                "is_active": c.get('is_active'),
                "utilization": round((c.get('usage_count', 0) / c.get('usage_limit') * 100), 1) if c.get('usage_limit') else None
            }
            for c in all_coupons
        ]
    }

@router.get("/reports/tax-summary")
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

@router.get("/reports/tax-summary/pdf")
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

# ============ AUTO-EMAIL SUMMARY REPORTS ============

def _period_range(period: str, now: Optional[datetime] = None):
    """Return (start, end, label) for the 'previous' weekly or monthly period."""
    now = now or datetime.now(timezone.utc)
    if period == "weekly":
        # Previous Monday 00:00 UTC → last Sunday 23:59:59 UTC
        today = now.date()
        days_since_mon = today.weekday()
        this_mon = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc) - timedelta(days=days_since_mon)
        last_mon = this_mon - timedelta(days=7)
        start = last_mon
        end = this_mon
        label = "Weekly"
    elif period == "monthly":
        # Previous full calendar month
        first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = first_of_this_month
        prev_month_end = first_of_this_month - timedelta(days=1)
        start = prev_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        label = "Monthly"
    else:
        raise ValueError(f"Unknown period: {period}")
    return start, end, label


@router.post("/reports/send-summary-now")
async def send_summary_now(data: dict, current_user: dict = Depends(get_current_user)):
    """Generate and email a weekly or monthly sales+tax summary PDF immediately."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can send summary reports")

    period = (data.get("period") or "weekly").lower()
    if period not in ("weekly", "monthly"):
        raise HTTPException(status_code=400, detail="period must be 'weekly' or 'monthly'")

    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0}) or {}
    to_email = settings.get("shift_report_email")
    if not to_email:
        raise HTTPException(
            status_code=400,
            detail="No recipient configured. Set a Manager Email under Settings → Cash Register.",
        )

    start, end, label = _period_range(period)
    pdf_bytes = await build_summary_pdf(label, start, end)
    business_name = strip_html(settings.get("business_name", "TECHZONE"))

    sent = send_summary_email(to_email, pdf_bytes, label, start, end, business_name)

    # Record last-sent timestamp so scheduler doesn't double-send
    now_iso = datetime.now(timezone.utc).isoformat()
    field = "auto_summary_last_weekly_sent" if period == "weekly" else "auto_summary_last_monthly_sent"
    await db.settings.update_one(
        {"id": "app_settings"},
        {"$set": {field: now_iso}},
        upsert=True,
    )

    return {
        "sent": sent,
        "period": period,
        "range": {"start": start.isoformat(), "end": end.isoformat()},
        "recipient": to_email,
    }


@router.get("/reports/top-customers")
async def top_customers(limit: int = 10, current_user: dict = Depends(get_current_user)):
    """Return top N customers by completed-sale spend, each with an RFM-based retention score (0-100)."""
    if limit < 1 or limit > 100:
        limit = 10

    # Aggregate completed sales by customer_id
    pipeline = [
        {"$match": {"payment_status": "completed", "customer_id": {"$ne": None}}},
        {"$group": {
            "_id": "$customer_id",
            "total_spent": {"$sum": "$total"},
            "sales_count": {"$sum": 1},
            "last_sale_at": {"$max": "$created_at"},
        }},
        {"$sort": {"total_spent": -1}},
        {"$limit": limit},
    ]
    agg = await db.sales.aggregate(pipeline).to_list(limit)

    if not agg:
        return []

    customer_ids = [row["_id"] for row in agg]
    customers_cursor = db.customers.find({"id": {"$in": customer_ids}}, {"_id": 0})
    customer_map = {c["id"]: c async for c in customers_cursor}

    # Normalization references for the RFM score
    max_spent = max((float(r["total_spent"]) for r in agg), default=0) or 1
    max_count = max((int(r["sales_count"]) for r in agg), default=0) or 1
    now = datetime.now(timezone.utc)

    def _parse(dt):
        if isinstance(dt, datetime):
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        if isinstance(dt, str):
            try:
                return datetime.fromisoformat(dt.replace("Z", "+00:00"))
            except ValueError:
                return None
        return None

    results = []
    for idx, row in enumerate(agg, start=1):
        cust = customer_map.get(row["_id"])
        if not cust:
            continue

        total_spent = float(row["total_spent"])
        sales_count = int(row["sales_count"])
        last_sale = _parse(row["last_sale_at"])

        # Recency: 0-40 pts. 0 days = 40 pts. Linearly decays to 0 at 120 days away.
        if last_sale:
            days_since = max((now - last_sale).days, 0)
            recency_score = max(0.0, 40.0 * (1 - min(days_since, 120) / 120))
        else:
            recency_score = 0.0

        # Frequency: 0-30 pts relative to the top-frequency customer in this slice
        frequency_score = 30.0 * (sales_count / max_count)

        # Monetary: 0-30 pts relative to the top-spend customer in this slice
        monetary_score = 30.0 * (total_spent / max_spent)

        retention_score = round(recency_score + frequency_score + monetary_score)
        retention_score = max(0, min(100, retention_score))

        if retention_score >= 70:
            retention_tier = "high"
        elif retention_score >= 40:
            retention_tier = "medium"
        else:
            retention_tier = "low"

        results.append({
            "rank": idx,
            "customer_id": row["_id"],
            "name": cust.get("name", "Unknown"),
            "phone": cust.get("phone"),
            "email": cust.get("email"),
            "total_spent": total_spent,
            "sales_count": sales_count,
            "last_sale_at": row["last_sale_at"],
            "points_balance": cust.get("points_balance", 0),
            "retention_score": retention_score,
            "retention_tier": retention_tier,
        })
    return results


@router.get("/reports/lost-customers")
async def lost_customers(
    days: int = 60,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    """Return top-spending customers whose last completed sale is older than `days` days."""
    if days < 1:
        days = 60
    if limit < 1 or limit > 100:
        limit = 20

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    cutoff_iso = cutoff.isoformat()

    pipeline = [
        {"$match": {"payment_status": "completed", "customer_id": {"$ne": None}}},
        {"$group": {
            "_id": "$customer_id",
            "total_spent": {"$sum": "$total"},
            "sales_count": {"$sum": 1},
            "last_sale_at": {"$max": "$created_at"},
        }},
        {"$match": {"last_sale_at": {"$lt": cutoff_iso}}},
        {"$sort": {"total_spent": -1}},
        {"$limit": limit},
    ]
    agg = await db.sales.aggregate(pipeline).to_list(limit)
    if not agg:
        return []

    customer_ids = [row["_id"] for row in agg]
    customers_cursor = db.customers.find({"id": {"$in": customer_ids}}, {"_id": 0})
    customer_map = {c["id"]: c async for c in customers_cursor}

    now = datetime.now(timezone.utc)
    results = []
    for row in agg:
        cust = customer_map.get(row["_id"])
        if not cust:
            continue
        try:
            last_dt = datetime.fromisoformat(str(row["last_sale_at"]).replace("Z", "+00:00"))
            days_away = max(0, (now - last_dt).days)
        except Exception:
            days_away = None
        results.append({
            "customer_id": row["_id"],
            "name": cust.get("name", "Unknown"),
            "phone": cust.get("phone"),
            "email": cust.get("email"),
            "total_spent": float(row["total_spent"]),
            "sales_count": int(row["sales_count"]),
            "last_sale_at": row["last_sale_at"],
            "days_since_last_sale": days_away,
        })
    return results


@router.get("/reports/slow-moving-inventory")
async def slow_moving(
    days: int = 90,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    """Return in-stock inventory items whose most recent sale (if any) is older than `days` days."""
    if days < 1:
        days = 90
    if limit < 1 or limit > 200:
        limit = 20

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    cutoff_iso = cutoff.isoformat()

    # Aggregate last-sale-at per item_id from completed sales
    pipeline = [
        {"$match": {"payment_status": "completed"}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.item_id",
            "last_sale_at": {"$max": "$created_at"},
            "total_sold": {"$sum": "$items.quantity"},
        }},
    ]
    sold_rows = await db.sales.aggregate(pipeline).to_list(10000)
    sold_map = {row["_id"]: row for row in sold_rows}

    # Pull in-stock inventory (quantity > 0)
    inv_cursor = db.inventory.find({"quantity": {"$gt": 0}}, {"_id": 0})
    candidates = []
    now = datetime.now(timezone.utc)

    async for item in inv_cursor:
        item_id = item.get("id")
        sold = sold_map.get(item_id)
        if sold:
            last_sale = sold.get("last_sale_at")
            if not last_sale:
                continue
            # Skip items sold recently
            if last_sale >= cutoff_iso:
                continue
            try:
                last_dt = datetime.fromisoformat(str(last_sale).replace("Z", "+00:00"))
                days_stale = max(0, (now - last_dt).days)
            except Exception:
                days_stale = None
            total_sold = int(sold.get("total_sold") or 0)
            ever_sold = True
        else:
            # Never sold — use created_at if present
            created = item.get("created_at")
            if created:
                try:
                    c_dt = datetime.fromisoformat(str(created).replace("Z", "+00:00"))
                    if c_dt >= cutoff:
                        # Item is newer than the stale window; not "slow"
                        continue
                    days_stale = (now - c_dt).days
                except Exception:
                    days_stale = None
            else:
                days_stale = None
            last_sale = None
            total_sold = 0
            ever_sold = False

        price = float(item.get("price") or 0)
        qty = int(item.get("quantity") or 0)
        candidates.append({
            "id": item_id,
            "name": item.get("name"),
            "sku": item.get("sku"),
            "category": item.get("category"),
            "supplier": item.get("supplier"),
            "quantity": qty,
            "price": price,
            "stock_value": round(price * qty, 2),
            "last_sale_at": last_sale,
            "days_stale": days_stale,
            "total_sold": total_sold,
            "ever_sold": ever_sold,
        })

    # Sort: stock_value desc (higher-value dead stock first)
    candidates.sort(key=lambda c: (c["stock_value"], c["days_stale"] or 0), reverse=True)
    return candidates[:limit]


@router.get("/reports/coupon-performance")
async def coupon_performance(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    """Return per-coupon performance: redemptions, total discount given, revenue, ROI."""
    if limit < 1 or limit > 200:
        limit = 20

    # Aggregate completed sales per coupon_code
    pipeline = [
        {"$match": {"payment_status": "completed", "coupon_code": {"$ne": None, "$exists": True}}},
        {"$group": {
            "_id": "$coupon_code",
            "redemptions": {"$sum": 1},
            "total_discount": {"$sum": "$discount"},
            "total_revenue": {"$sum": "$total"},
            "total_subtotal": {"$sum": "$subtotal"},
            "last_used_at": {"$max": "$created_at"},
        }},
    ]
    sale_rows = await db.sales.aggregate(pipeline).to_list(10000)
    sale_map = {row["_id"]: row for row in sale_rows if row.get("_id")}

    # Fetch all coupons and merge
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(1000)
    results = []
    for cp in coupons:
        code = cp.get("code")
        if not code:
            continue
        sale_row = sale_map.get(code, {})
        redemptions = int(sale_row.get("redemptions", 0))
        total_discount = float(sale_row.get("total_discount", 0))
        total_revenue = float(sale_row.get("total_revenue", 0))
        total_subtotal = float(sale_row.get("total_subtotal", 0))
        # ROI: revenue per $1 of discount given (useful only when discount > 0)
        roi = round(total_revenue / total_discount, 2) if total_discount > 0 else None
        avg_order = round(total_revenue / redemptions, 2) if redemptions > 0 else 0

        results.append({
            "id": cp.get("id"),
            "code": code,
            "description": cp.get("description"),
            "discount_type": cp.get("discount_type"),
            "discount_value": cp.get("discount_value"),
            "is_active": cp.get("is_active", True),
            "customer_id": cp.get("customer_id"),
            "customer_name": cp.get("customer_name"),
            "usage_limit": cp.get("usage_limit"),
            "usage_count": cp.get("usage_count", 0),
            # Performance metrics
            "redemptions": redemptions,
            "total_discount_given": round(total_discount, 2),
            "total_revenue": round(total_revenue, 2),
            "total_subtotal": round(total_subtotal, 2),
            "avg_order_value": avg_order,
            "roi": roi,
            "last_used_at": sale_row.get("last_used_at"),
        })

    # Sort: redemptions desc, then revenue desc (most-impactful first); un-redeemed at the bottom
    results.sort(key=lambda r: (r["redemptions"], r["total_revenue"]), reverse=True)
    return results[:limit]


@router.get("/reports/staff-performance")
async def staff_performance(
    days: int = 30,
    current_user: dict = Depends(get_current_user),
):
    """Leaderboard of staff by sales volume + shift-close accuracy over the last `days` days."""
    if current_user.get("role") not in ("admin", "manager"):
        raise HTTPException(status_code=403, detail="Admin/manager only")
    if days < 1:
        days = 30
    if days > 365:
        days = 365

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    cutoff_iso = cutoff.isoformat()

    # Sales aggregation per cashier (created_by)
    sales_pipeline = [
        {"$match": {"payment_status": "completed", "created_at": {"$gte": cutoff_iso}}},
        {"$group": {
            "_id": "$created_by",
            "sales_count": {"$sum": 1},
            "total_revenue": {"$sum": "$total"},
            "total_subtotal": {"$sum": "$subtotal"},
            "last_sale_at": {"$max": "$created_at"},
        }},
    ]
    sales_rows = await db.sales.aggregate(sales_pipeline).to_list(10000)
    sales_map = {row["_id"]: row for row in sales_rows if row.get("_id")}

    # Shift aggregation per user (closed_by_name) — shift accuracy
    shift_pipeline = [
        {"$match": {"status": "closed", "closed_at": {"$gte": cutoff_iso}}},
        {"$group": {
            "_id": "$closed_by_name",
            "shifts_closed": {"$sum": 1},
            "sum_abs_variance": {"$sum": {"$abs": "$difference"}},
            "sum_variance": {"$sum": "$difference"},
        }},
    ]
    shift_rows = await db.cash_register_shifts.aggregate(shift_pipeline).to_list(1000)
    shift_map = {row["_id"]: row for row in shift_rows if row.get("_id")}

    # Union of all staff usernames appearing in either aggregation
    usernames = set(sales_map.keys()) | set(shift_map.keys())
    if not usernames:
        return []

    # Fetch user directory for role/display name
    users_cursor = db.users.find({"username": {"$in": list(usernames)}}, {"_id": 0})
    user_map = {u["username"]: u async for u in users_cursor}

    results = []
    for username in usernames:
        sr = sales_map.get(username) or {}
        sh = shift_map.get(username) or {}
        u = user_map.get(username) or {}

        sales_count = int(sr.get("sales_count", 0))
        revenue = float(sr.get("total_revenue", 0))
        avg_order = round(revenue / sales_count, 2) if sales_count > 0 else 0
        shifts_closed = int(sh.get("shifts_closed", 0))
        sum_abs_variance = float(sh.get("sum_abs_variance", 0))
        avg_variance = round(sum_abs_variance / shifts_closed, 2) if shifts_closed > 0 else 0

        results.append({
            "username": username,
            "role": u.get("role") or "cashier",
            "email": u.get("email"),
            "sales_count": sales_count,
            "total_revenue": round(revenue, 2),
            "avg_order_value": avg_order,
            "last_sale_at": sr.get("last_sale_at"),
            "shifts_closed": shifts_closed,
            "sum_abs_variance": round(sum_abs_variance, 2),
            "avg_shift_variance": avg_variance,
            "net_variance": round(float(sh.get("sum_variance", 0)), 2),
        })

    # Primary sort: revenue desc
    results.sort(key=lambda r: r["total_revenue"], reverse=True)
    return results



def _normalize_mmdd(raw):
    """Accept 'MM-DD', 'YYYY-MM-DD', or 'MM/DD' and return canonical 'MM-DD' or None."""
    if not raw:
        return None
    s = str(raw).strip().replace("/", "-")
    if len(s) == 10 and s[4] == "-":
        s = s[5:]
    if len(s) != 5 or s[2] != "-":
        return None
    try:
        m = int(s[:2])
        d = int(s[3:])
        if 1 <= m <= 12 and 1 <= d <= 31:
            return f"{m:02d}-{d:02d}"
    except ValueError:
        pass
    return None


@router.get("/reports/upcoming-birthdays")
async def upcoming_birthdays(days: int = 7, current_user: dict = Depends(get_current_user)):
    """Customers whose birthday falls in the next `days` days (inclusive of today).

    Handles year-wrap (e.g., today = Dec 28, days = 7 → includes next January).
    Returns a list sorted by days-until-birthday, then by name.
    """
    days = max(1, min(days, 60))
    today = datetime.now(timezone.utc).date()

    # Build the window of acceptable MM-DD strings, mapped to days-until.
    window = {}
    for offset in range(days + 1):  # inclusive
        d = today + timedelta(days=offset)
        window[f"{d.month:02d}-{d.day:02d}"] = offset

    customers = await db.customers.find(
        {"birthday": {"$exists": True, "$ne": None}},
        {"_id": 0},
    ).to_list(10000)

    current_year = today.year
    results = []
    for c in customers:
        mmdd = _normalize_mmdd(c.get("birthday"))
        if not mmdd or mmdd not in window:
            continue
        days_until = window[mmdd]
        # Check if they've already received a birthday coupon this year
        dedupe_key = f"{c['id']}:{current_year}"
        got_coupon = await db.birthday_coupons.find_one({"key": dedupe_key}, {"_id": 0})
        # Compute the actual date this year (for label)
        month, day = mmdd.split("-")
        try:
            birthday_date = (today + timedelta(days=days_until)).isoformat()
        except Exception:
            birthday_date = None
        results.append({
            "customer_id": c["id"],
            "name": c.get("name", ""),
            "email": c.get("email"),
            "phone": c.get("phone"),
            "birthday": mmdd,
            "days_until": days_until,
            "birthday_date": birthday_date,
            "total_spent": float(c.get("total_spent", 0) or 0),
            "coupon_already_sent": bool(got_coupon),
        })

    results.sort(key=lambda r: (r["days_until"], r["name"].lower()))
    return results
