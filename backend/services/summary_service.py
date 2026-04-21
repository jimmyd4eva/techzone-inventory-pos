"""Sales + tax summary PDF generation and email delivery."""
import io
import os
import smtplib
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

from core.config import db, logger
from core.security import strip_html


async def _collect_sales(start: datetime, end: datetime) -> list:
    """Fetch completed sales between [start, end) as plain dicts."""
    start_iso = start.isoformat()
    end_iso = end.isoformat()
    cursor = db.sales.find(
        {
            "payment_status": "completed",
            "created_at": {"$gte": start_iso, "$lt": end_iso},
        },
        {"_id": 0},
    ).sort("created_at", 1)
    return await cursor.to_list(10000)


async def build_summary_pdf(period_label: str, start: datetime, end: datetime) -> bytes:
    """Build a combined sales + tax summary PDF for the given period."""
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    business_name = strip_html(settings.get("business_name", "TECHZONE")) if settings else "TECHZONE"

    sales = await _collect_sales(start, end)

    total_revenue = sum(s.get("total", 0) for s in sales)
    total_subtotal = sum(s.get("subtotal", 0) for s in sales)
    total_tax = sum(s.get("tax", 0) for s in sales)
    total_discount = sum(s.get("discount", 0) + s.get("points_discount", 0) for s in sales)
    cash_total = sum(s.get("total", 0) for s in sales if s.get("payment_method") == "cash")
    card_total = total_revenue - cash_total

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5 * inch, bottomMargin=0.5 * inch)
    elements = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "Title", parent=styles["Title"], fontSize=20,
        textColor=colors.HexColor("#8b5cf6"), spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"], fontSize=12,
        textColor=colors.gray, alignment=TA_CENTER,
    )
    heading_style = ParagraphStyle(
        "Heading", parent=styles["Heading2"], fontSize=14,
        textColor=colors.HexColor("#374151"), spaceBefore=20, spaceAfter=10,
    )
    footer_style = ParagraphStyle(
        "Footer", parent=styles["Normal"], fontSize=9,
        textColor=colors.gray, alignment=TA_CENTER, spaceBefore=20,
    )

    elements.append(Paragraph(business_name, title_style))
    elements.append(Paragraph(f"{period_label} Sales &amp; Tax Summary", subtitle_style))
    elements.append(
        Paragraph(
            f"{start.strftime('%Y-%m-%d')} &nbsp;&#8594;&nbsp; {end.strftime('%Y-%m-%d')}",
            subtitle_style,
        )
    )
    elements.append(Spacer(1, 18))

    elements.append(Paragraph("Financial Overview", heading_style))
    totals = [
        ["Metric", "Amount"],
        ["Total Sales (orders)", f"{len(sales)}"],
        ["Gross Subtotal", f"${total_subtotal:,.2f}"],
        ["Discounts (coupons + points)", f"${total_discount:,.2f}"],
        ["Tax Collected", f"${total_tax:,.2f}"],
        ["Gross Revenue", f"${total_revenue:,.2f}"],
        ["— Cash Revenue", f"${cash_total:,.2f}"],
        ["— Card / Other Revenue", f"${card_total:,.2f}"],
    ]
    t = Table(totals, colWidths=[3.5 * inch, 2.0 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#8b5cf6")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
    ]))
    elements.append(t)

    if sales:
        elements.append(Paragraph("Daily Breakdown", heading_style))
        by_day = {}
        for s in sales:
            try:
                d = datetime.fromisoformat(s["created_at"].replace("Z", "+00:00")).date()
            except Exception:
                continue
            row = by_day.setdefault(d, {"orders": 0, "revenue": 0.0, "tax": 0.0})
            row["orders"] += 1
            row["revenue"] += s.get("total", 0)
            row["tax"] += s.get("tax", 0)

        rows = [["Date", "Orders", "Revenue", "Tax"]]
        for d in sorted(by_day.keys()):
            r = by_day[d]
            rows.append([
                d.strftime("%Y-%m-%d"),
                str(r["orders"]),
                f"${r['revenue']:,.2f}",
                f"${r['tax']:,.2f}",
            ])
        daily_table = Table(rows, colWidths=[2.0 * inch, 1.0 * inch, 1.5 * inch, 1.0 * inch])
        daily_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#374151")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ]))
        elements.append(daily_table)

    elements.append(Paragraph(
        f"Generated on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        footer_style,
    ))

    doc.build(elements)
    return buffer.getvalue()


def send_summary_email(to_email: str, pdf_bytes: bytes, period_label: str,
                       start: datetime, end: datetime, business_name: str) -> bool:
    """Send a combined sales + tax summary PDF via SMTP."""
    sender_email = os.environ.get("EMAIL_ADDRESS", "")
    sender_password = os.environ.get("EMAIL_PASSWORD", "")

    if not sender_password:
        logger.warning("EMAIL_PASSWORD not set, cannot send summary email")
        return False

    date_range = f"{start.strftime('%Y-%m-%d')} → {end.strftime('%Y-%m-%d')}"
    msg = MIMEMultipart("mixed")
    msg["Subject"] = f"{business_name} — {period_label} Sales & Tax Summary ({date_range})"
    msg["From"] = sender_email
    msg["To"] = to_email

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                    padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">{business_name}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
                {period_label} Sales &amp; Tax Summary
            </p>
            <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 13px;">
                {date_range}
            </p>
        </div>
        <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <p style="color: #374151; font-size: 14px;">
                The attached PDF contains the full {period_label.lower()} sales and tax summary,
                including a daily breakdown of orders, revenue, and tax collected.
            </p>
        </div>
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">
            Automated report from {business_name} POS.
        </p>
    </body>
    </html>
    """
    msg.attach(MIMEText(html, "html"))

    pdf_attachment = MIMEBase("application", "pdf")
    pdf_attachment.set_payload(pdf_bytes)
    encoders.encode_base64(pdf_attachment)
    filename = f"{period_label.lower()}_summary_{start.strftime('%Y%m%d')}_{end.strftime('%Y%m%d')}.pdf"
    pdf_attachment.add_header("Content-Disposition", f'attachment; filename="{filename}"')
    msg.attach(pdf_attachment)

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        logger.info(f"Summary email sent to {to_email} for {period_label}")
        return True
    except Exception as e:
        logger.error(f"Failed to send summary email: {e}")
        return False
