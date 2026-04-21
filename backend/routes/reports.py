"""Route module extracted from server.py."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from core.config import db, logger
import io
from fastapi.responses import StreamingResponse
from core.security import get_current_user, strip_html
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
