"""Helpers for cash-register shift calculations and PDF/report generation.

Extracted from `routes/cash_register.py` to keep endpoint handlers slim and testable.
"""
from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from core.config import db
from core.security import strip_html


# ---------- Totals ----------

def calculate_transaction_totals(transactions: List[Dict[str, Any]]) -> Dict[str, float]:
    """Sum the four transaction classes that a shift tracks."""
    cash_sales = sum(t["amount"] for t in transactions if t["transaction_type"] == "cash_sale")
    payouts = sum(abs(t["amount"]) for t in transactions if t["transaction_type"] == "payout")
    drops = sum(abs(t["amount"]) for t in transactions if t["transaction_type"] == "drop")
    refunds = sum(abs(t["amount"]) for t in transactions if t["transaction_type"] == "refund")
    return {"cash_sales": cash_sales, "payouts": payouts, "drops": drops, "refunds": refunds}


def calculate_expected_cash(opening_amount: float, totals: Dict[str, float]) -> float:
    """Expected drawer cash at close time."""
    return (
        opening_amount
        + totals["cash_sales"]
        - totals["payouts"]
        - totals["drops"]
        - totals["refunds"]
    )


# ---------- Business info lookup ----------

async def fetch_business_info() -> Tuple[Dict[str, Any], str, str, str]:
    """Return (settings, business_name, address, phone) with plain-text strip."""
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0}) or {}
    name = strip_html(settings.get("business_name", "TECHZONE"))
    addr = strip_html(settings.get("business_address", ""))
    phone = strip_html(settings.get("business_phone", ""))
    return settings, name, addr, phone


# ---------- PDF building blocks ----------

def _pdf_styles():
    styles = getSampleStyleSheet()
    return {
        "styles": styles,
        "title": ParagraphStyle('Title', parent=styles['Title'], fontSize=20, textColor=colors.HexColor('#8b5cf6'), spaceAfter=6),
        "subtitle": ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=12, textColor=colors.gray, alignment=TA_CENTER),
        "heading": ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#374151'), spaceBefore=20, spaceAfter=10),
        "footer": ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.gray, alignment=TA_CENTER),
    }


def _format_summary_table(
    opening_amount: float,
    totals: Dict[str, float],
    expected: float,
    closing_amount: float = None,
    difference: float = None,
) -> Table:
    """Build the cash-summary table. If closing_amount is given, appends variance row."""
    data = [
        ["Description", "Amount"],
        ["Opening Float", f"${opening_amount:.2f}"],
        ["+ Cash Sales", f"${totals['cash_sales']:.2f}"],
        ["- Payouts", f"${totals['payouts']:.2f}"],
        ["- Safe Drops", f"${totals['drops']:.2f}"],
        ["- Refunds", f"${totals['refunds']:.2f}"],
        ["= Expected Cash", f"${expected:.2f}"],
    ]
    if closing_amount is not None:
        data.append(["Actual Cash Count", f"${closing_amount:.2f}"])
        diff = difference if difference is not None else closing_amount - expected
        diff_status = "OVER" if diff > 0 else "SHORT" if diff < 0 else "BALANCED"
        data.append(["Variance", f"${diff:.2f} ({diff_status})"])

    table = Table(data, colWidths=[3 * inch, 2 * inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f3e8ff')),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
    ]))
    return table


def _parse_iso(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return None


def _format_shift_info_table(shift: Dict[str, Any]) -> Tuple[Table, datetime]:
    """Return (table, opened_at_datetime) for the Shift Details section."""
    opened_at = _parse_iso(shift["opened_at"])
    closed_at = _parse_iso(shift.get("closed_at"))
    status = "OPEN" if shift["status"] == "open" else "CLOSED"

    rows = [
        ["Shift ID:", shift["id"][:8] + "..."],
        ["Status:", status],
        ["Opened By:", shift.get("opened_by_name", "Unknown")],
        ["Opened At:", opened_at.strftime("%Y-%m-%d %H:%M:%S") if opened_at else "—"],
    ]
    if closed_at:
        rows.append(["Closed By:", shift.get("closed_by_name", "Unknown")])
        rows.append(["Closed At:", closed_at.strftime("%Y-%m-%d %H:%M:%S")])

    table = Table(rows, colWidths=[1.5 * inch, 4 * inch])
    table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    return table, opened_at


def _format_transactions_table(transactions: List[Dict[str, Any]]) -> Table:
    data = [["Time", "Type", "Description", "Amount"]]
    for t in transactions:
        txn_time = _parse_iso(t["created_at"])
        txn_type = t["transaction_type"].replace("_", " ").upper()
        amount = t["amount"]
        amount_str = f"${amount:.2f}" if amount >= 0 else f"-${abs(amount):.2f}"
        data.append([
            txn_time.strftime("%H:%M:%S") if txn_time else "—",
            txn_type,
            (t.get("description") or "-")[:30],
            amount_str,
        ])

    table = Table(data, colWidths=[1 * inch, 1.2 * inch, 2.5 * inch, 1 * inch])
    table.setStyle(TableStyle([
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
    return table


# ---------- Full PDFs ----------

async def build_shift_report_pdf(shift: Dict[str, Any], transactions: List[Dict[str, Any]]) -> Tuple[bytes, str]:
    """Build a full PDF report for one shift. Returns (pdf_bytes, filename)."""
    _, business_name, business_address, business_phone = await fetch_business_info()

    totals = calculate_transaction_totals(transactions)
    expected = calculate_expected_cash(shift["opening_amount"], totals)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5 * inch, bottomMargin=0.5 * inch)
    s = _pdf_styles()
    elements: list = []

    # Header
    elements.append(Paragraph(business_name, s["title"]))
    elements.append(Paragraph("Cash Register Shift Report", s["subtitle"]))
    if business_address:
        elements.append(Paragraph(business_address, s["subtitle"]))
    if business_phone:
        elements.append(Paragraph(business_phone, s["subtitle"]))
    elements.append(Spacer(1, 20))

    # Shift info
    info_table, opened_at = _format_shift_info_table(shift)
    elements.append(info_table)
    elements.append(Spacer(1, 20))

    # Summary
    elements.append(Paragraph("Cash Summary", s["heading"]))
    closing = shift.get("closing_amount") if shift["status"] == "closed" else None
    diff = shift.get("difference") if shift["status"] == "closed" else None
    elements.append(_format_summary_table(shift["opening_amount"], totals, expected, closing, diff))
    elements.append(Spacer(1, 20))

    # Transactions
    if transactions:
        elements.append(Paragraph(f"Transactions ({len(transactions)})", s["heading"]))
        elements.append(_format_transactions_table(transactions))

    # Notes
    if shift.get("notes"):
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Notes", s["heading"]))
        elements.append(Paragraph(shift["notes"], s["styles"]["Normal"]))

    # Footer
    elements.append(Spacer(1, 40))
    elements.append(Paragraph(
        f"Generated on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        s["footer"],
    ))
    elements.append(Paragraph("This report is for internal record-keeping purposes.", s["footer"]))

    doc.build(elements)

    filename = f"cash_register_report_{opened_at.strftime('%Y%m%d') if opened_at else 'shift'}_{shift['id'][:8]}.pdf"
    return buffer.getvalue(), filename


def build_close_shift_email_pdf(
    business_name: str,
    shift: Dict[str, Any],
    totals: Dict[str, float],
    expected: float,
    closing_amount: float,
    difference: float,
) -> bytes:
    """Compact PDF attached to the auto-email when a shift is closed."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5 * inch, bottomMargin=0.5 * inch)
    s = _pdf_styles()
    elements = [
        Paragraph(business_name, s["title"]),
        Paragraph("Cash Register Shift Report", s["subtitle"]),
        Spacer(1, 20),
        _format_summary_table(shift["opening_amount"], totals, expected, closing_amount, difference),
    ]
    doc.build(elements)
    return buffer.getvalue()
