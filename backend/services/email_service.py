"""Email delivery: activation codes and shift reports via SMTP."""
import os
import smtplib
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from core.config import logger


def send_activation_email(to_email: str, activation_code: str) -> bool:
    """Send activation code via Gmail SMTP"""
    sender_email = os.environ.get('EMAIL_ADDRESS', 'zonetech4eva@gmail.com')
    sender_password = os.environ.get('EMAIL_PASSWORD', '')
    
    if not sender_password:
        logger.warning("EMAIL_PASSWORD not set, cannot send activation email")
        return False
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Your TechZone POS Activation Code: {activation_code}'
    msg['From'] = sender_email
    msg['To'] = to_email
    
    # Plain text version
    text = f"""
Your TechZone POS Activation Code

Your activation code is: {activation_code}

This code is valid for 12 hours and can only be used once.
Enter this code in the activation screen to unlock your device.

If you didn't request this code, please ignore this email.

- TechZone Team
    """
    
    # HTML version
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">TechZone POS</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Device Activation</p>
        </div>
        
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <p style="color: #374151; font-size: 16px;">Your activation code is:</p>
            
            <div style="background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea;">{activation_code}</span>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
                <strong>Important:</strong>
                <ul style="margin: 10px 0;">
                    <li>This code is valid for <strong>12 hours</strong></li>
                    <li>Can only be used <strong>once</strong></li>
                    <li>Activates only <strong>this device</strong></li>
                </ul>
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
                If you didn't request this code, please ignore this email.
            </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">
            © 2024 TechZone POS - All rights reserved
        </p>
    </body>
    </html>
    """
    
    part1 = MIMEText(text, 'plain')
    part2 = MIMEText(html, 'html')
    msg.attach(part1)
    msg.attach(part2)
    
    try:
        # Gmail SMTP
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        logger.info(f"Activation email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send activation email: {e}")
        return False

def send_shift_report_email(to_email: str, shift_data: dict, pdf_bytes: bytes, business_name: str) -> bool:
    """Send shift report PDF via Gmail SMTP"""
    from email.mime.base import MIMEBase
    from email import encoders
    
    sender_email = os.environ.get('EMAIL_ADDRESS', 'zonetech4eva@gmail.com')
    sender_password = os.environ.get('EMAIL_PASSWORD', '')
    
    if not sender_password:
        logger.warning("EMAIL_PASSWORD not set, cannot send shift report email")
        return False
    
    # Parse dates
    opened_at = shift_data.get("opened_at", "")
    if isinstance(opened_at, str):
        try:
            opened_at = datetime.fromisoformat(opened_at.replace("Z", "+00:00"))
        except ValueError:
            opened_at = datetime.now(timezone.utc)
    
    date_str = opened_at.strftime("%Y-%m-%d")
    diff = shift_data.get("difference", 0)
    status = "BALANCED" if diff == 0 else ("OVER" if diff > 0 else "SHORT")
    
    # Create message
    msg = MIMEMultipart('mixed')
    msg['Subject'] = f'{business_name} - Shift Report {date_str} ({status})'
    msg['From'] = sender_email
    msg['To'] = to_email
    
    # Email body
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">{business_name}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Shift Report - {date_str}</p>
        </div>
        
        <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; font-size: 18px;">Shift Summary</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr style="background: #f3f4f6;">
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Opened By</strong></td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">{shift_data.get('opened_by_name', 'Unknown')}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Closed By</strong></td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">{shift_data.get('closed_by_name', 'Unknown')}</td>
                </tr>
                <tr style="background: #f3f4f6;">
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Opening Float</strong></td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">${shift_data.get('opening_amount', 0):.2f}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Expected Cash</strong></td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">${shift_data.get('expected_amount', 0):.2f}</td>
                </tr>
                <tr style="background: #f3f4f6;">
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Actual Cash</strong></td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">${shift_data.get('closing_amount', 0):.2f}</td>
                </tr>
                <tr style="background: {'#d1fae5' if diff == 0 else '#dbeafe' if diff > 0 else '#fee2e2'};">
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Variance</strong></td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; color: {'#059669' if diff >= 0 else '#dc2626'}; font-weight: bold;">
                        ${diff:.2f} ({status})
                    </td>
                </tr>
            </table>
            
            <p style="color: #6b7280; font-size: 14px;">
                The full shift report is attached as a PDF.
            </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">
            This is an automated message from {business_name} POS System.
        </p>
    </body>
    </html>
    """
    
    html_part = MIMEText(html, 'html')
    msg.attach(html_part)
    
    # Attach PDF
    pdf_attachment = MIMEBase('application', 'pdf')
    pdf_attachment.set_payload(pdf_bytes)
    encoders.encode_base64(pdf_attachment)
    pdf_attachment.add_header('Content-Disposition', f'attachment; filename="shift_report_{date_str}.pdf"')
    msg.attach(pdf_attachment)
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        logger.info(f"Shift report email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send shift report email: {e}")
        return False


def send_coupon_email(to_email: str, customer_name: str, coupon: dict, business_name: str = "TECHZONE") -> bool:
    """Email a personalized coupon code to a customer."""
    sender_email = os.environ.get("EMAIL_ADDRESS", "")
    sender_password = os.environ.get("EMAIL_PASSWORD", "")

    if not sender_password:
        logger.warning("EMAIL_PASSWORD not set; cannot send coupon email")
        return False

    code = coupon.get("code", "")
    description = coupon.get("description", "Your exclusive discount")
    discount_type = coupon.get("discount_type", "percentage")
    discount_value = coupon.get("discount_value", 0)
    min_purchase = coupon.get("min_purchase", 0)
    valid_until = coupon.get("valid_until")

    discount_display = (
        f"{discount_value:.0f}% OFF"
        if discount_type == "percentage"
        else f"${discount_value:.2f} OFF"
    )
    min_purchase_html = (
        f"<p style='margin:4px 0;color:#6b7280;font-size:13px;'>Minimum purchase: ${min_purchase:.2f}</p>"
        if min_purchase and min_purchase > 0
        else ""
    )
    expiry_html = ""
    if valid_until:
        try:
            dt = datetime.fromisoformat(str(valid_until).replace("Z", "+00:00"))
            expiry_html = (
                f"<p style='margin:4px 0;color:#6b7280;font-size:13px;'>"
                f"Valid until {dt.strftime('%B %d, %Y')}</p>"
            )
        except Exception:
            pass

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"A personalized coupon just for you — {code}"
    msg["From"] = sender_email
    msg["To"] = to_email

    html = f"""
    <html>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;">
      <div style="background:linear-gradient(135deg,#8b5cf6 0%,#ec4899 100%);padding:28px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:26px;">{business_name}</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0 0;font-size:14px;">A gift for you, {customer_name}!</p>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;text-align:center;">
        <p style="color:#374151;font-size:15px;margin:0 0 8px 0;">{description}</p>
        <div style="margin:24px 0;padding:20px;background:#faf5ff;border:2px dashed #8b5cf6;border-radius:10px;">
          <div style="color:#7c3aed;font-size:32px;font-weight:700;letter-spacing:2px;font-family:monospace;">{code}</div>
          <div style="color:#111827;font-size:20px;font-weight:700;margin-top:6px;">{discount_display}</div>
        </div>
        {min_purchase_html}
        {expiry_html}
        <p style="color:#374151;font-size:14px;margin-top:20px;">
          Show this email or mention the code at checkout — it's reserved just for you.
        </p>
      </div>
      <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:20px;">
        Sent from {business_name} POS.
      </p>
    </body>
    </html>
    """
    text = (
        f"Hi {customer_name},\n\n"
        f"Here is your personalized coupon from {business_name}:\n\n"
        f"  CODE: {code}\n"
        f"  {discount_display}\n"
        f"  {description}\n\n"
        f"Show this email or mention the code at checkout.\n"
    )
    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        logger.info(f"Coupon email sent to {to_email} (code={code})")
        return True
    except Exception as e:
        logger.error(f"Failed to send coupon email: {e}")
        return False


def send_purchase_order_email(to_email: str, supplier_name: str, items: list, business_name: str = "TECHZONE", note: str = "") -> bool:
    """Email a low-stock purchase-order draft to a supplier.

    `items` is a list of dicts with keys: name, sku, quantity, low_stock_threshold, suggested_order_qty.
    """
    sender_email = os.environ.get("EMAIL_ADDRESS", "")
    sender_password = os.environ.get("EMAIL_PASSWORD", "")

    if not sender_password:
        logger.warning("EMAIL_PASSWORD not set; cannot send PO email")
        return False

    rows_html = "".join(
        f"""
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;">{(it.get('name') or '-')}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-family:monospace;font-size:12px;">{(it.get('sku') or '-')}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">{int(it.get('quantity', 0))}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">{int(it.get('low_stock_threshold', 0))}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#059669;">{int(it.get('suggested_order_qty', 0))}</td>
        </tr>
        """
        for it in items
    )

    rows_text = "\n".join(
        f"- {it.get('name','-')} (SKU {it.get('sku','-')}): current {int(it.get('quantity', 0))}, threshold {int(it.get('low_stock_threshold', 0))}, suggested order qty {int(it.get('suggested_order_qty', 0))}"
        for it in items
    )

    note_html = (
        f"<p style='margin:12px 0 0 0;color:#374151;font-size:14px;padding:12px;background:#f9fafb;border-radius:6px;'><strong>Note:</strong> {note}</p>"
        if note else ""
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{business_name} — Purchase Order Request ({len(items)} items)"
    msg["From"] = sender_email
    msg["To"] = to_email

    html = f"""
    <html>
    <body style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;padding:20px;">
      <div style="background:linear-gradient(135deg,#8b5cf6 0%,#6366f1 100%);padding:20px;border-radius:10px;text-align:center;">
        <h1 style="color:#fff;margin:0;">{business_name}</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0 0;">Purchase Order Request</p>
      </div>
      <div style="padding:20px;background:#fff;">
        <p style="color:#374151;">Hello{(' ' + supplier_name) if supplier_name else ''},</p>
        <p style="color:#374151;">
          The items below have fallen at or below their low-stock threshold.
          Please confirm availability and pricing for the suggested quantities so we can issue a formal purchase order.
        </p>
        {note_html}
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:10px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">Item</th>
              <th style="padding:10px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">SKU</th>
              <th style="padding:10px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase;">On Hand</th>
              <th style="padding:10px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase;">Threshold</th>
              <th style="padding:10px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase;">Suggested Qty</th>
            </tr>
          </thead>
          <tbody>{rows_html}</tbody>
        </table>
        <p style="color:#6b7280;font-size:13px;margin-top:20px;">
          Thank you,<br/>{business_name}
        </p>
      </div>
      <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px;">
        Automated purchase-order draft from {business_name} POS.
      </p>
    </body>
    </html>
    """
    text = (
        f"{business_name} — Purchase Order Request\n\n"
        f"Hello{' ' + supplier_name if supplier_name else ''},\n\n"
        f"The items below have fallen at or below their low-stock threshold. "
        f"Please confirm availability and pricing for the suggested quantities.\n\n"
        f"{rows_text}\n"
    )
    if note:
        text += f"\nNote: {note}\n"
    text += f"\nThank you,\n{business_name}\n"

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        logger.info(f"PO email sent to {to_email} ({len(items)} items)")
        return True
    except Exception as e:
        logger.error(f"Failed to send PO email: {e}")
        return False


def send_loyalty_points_email(
    to_email: str,
    customer_name: str,
    points_earned: int,
    points_balance: int,
    sale_total: float,
    business_name: str = "TECHZONE",
    milestone: int = None,
) -> bool:
    """Email the customer after a sale: points earned + optional milestone celebration."""
    sender_email = os.environ.get("EMAIL_ADDRESS", "")
    sender_password = os.environ.get("EMAIL_PASSWORD", "")

    if not sender_password:
        logger.warning("EMAIL_PASSWORD not set; cannot send loyalty email")
        return False

    subject = (
        f"🎉 Milestone! You've reached {milestone} points at {business_name}"
        if milestone
        else f"Thanks for your purchase — you earned {points_earned} points"
    )

    milestone_html = (
        f"""
        <div style="margin:20px 0;padding:18px;background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);
                    border-radius:10px;border:2px dashed #d97706;text-align:center;">
          <div style="font-size:32px;">🎉</div>
          <div style="font-size:20px;font-weight:700;color:#92400e;margin-top:4px;">
            Milestone unlocked: {milestone} points!
          </div>
          <div style="font-size:13px;color:#78350f;margin-top:6px;">
            You're one of our most valued customers. Keep it up!
          </div>
        </div>
        """
        if milestone
        else ""
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = to_email

    html = f"""
    <html>
    <body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#f9fafb;">
      <div style="background:linear-gradient(135deg,#8b5cf6 0%,#6366f1 100%);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">{business_name}</h1>
        <p style="color:rgba(255,255,255,0.9);margin:6px 0 0 0;">Thanks for shopping with us, {customer_name}!</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
        {milestone_html}
        <p style="color:#374151;font-size:15px;margin:0 0 12px 0;">
          Your purchase of <strong>${sale_total:.2f}</strong> just earned you
          <strong style="color:#7c3aed;">{points_earned} points</strong>.
        </p>
        <div style="padding:16px;background:#faf5ff;border:1px solid #ede9fe;border-radius:8px;text-align:center;">
          <div style="font-size:13px;color:#6b7280;">Your current balance</div>
          <div style="font-size:28px;font-weight:700;color:#7c3aed;">{points_balance} points</div>
        </div>
        <p style="color:#6b7280;font-size:13px;margin-top:16px;">
          Points can be redeemed for discounts on your next visit.
        </p>
      </div>
      <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px;">
        You received this because you're part of our loyalty program at {business_name}.
      </p>
    </body>
    </html>
    """
    text = (
        f"Hi {customer_name},\n\n"
        f"Thanks for your purchase of ${sale_total:.2f} at {business_name}.\n"
        f"You earned {points_earned} points. Your current balance is {points_balance} points.\n"
    )
    if milestone:
        text += f"\n🎉 Milestone: you've reached {milestone} points!\n"
    text += "\nPoints can be redeemed for discounts on your next visit.\n"

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        logger.info(f"Loyalty email sent to {to_email} (+{points_earned} pts, balance {points_balance}, milestone={milestone})")
        return True
    except Exception as e:
        logger.error(f"Failed to send loyalty email: {e}")
        return False


def send_followup_email(to_email: str, customer_name: str, items_summary: str, business_name: str = "TECHZONE", days_ago: int = 14) -> bool:
    """Friendly check-in email to a customer N days after a sale."""
    sender_email = os.environ.get("EMAIL_ADDRESS", "")
    sender_password = os.environ.get("EMAIL_PASSWORD", "")
    if not sender_password:
        logger.warning("EMAIL_PASSWORD not set; cannot send followup email")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"How's it going with your purchase from {business_name}?"
    msg["From"] = sender_email
    msg["To"] = to_email

    html = f"""
    <html>
    <body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#f9fafb;">
      <div style="background:linear-gradient(135deg,#8b5cf6 0%,#6366f1 100%);padding:22px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">{business_name}</h1>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
        <p style="color:#111827;font-size:16px;margin:0 0 12px 0;">Hi {customer_name},</p>
        <p style="color:#374151;font-size:14px;line-height:1.5;">
          It's been about {days_ago} days since your purchase of <strong>{items_summary}</strong>. We just wanted to check in — is everything working perfectly?
        </p>
        <p style="color:#374151;font-size:14px;line-height:1.5;">
          If anything isn't quite right, just reply to this email and we'll sort it out right away. If all is good and you have a moment, we'd love a quick review — it genuinely helps a small business like ours.
        </p>
        <p style="color:#374151;font-size:14px;line-height:1.5;">
          Thanks again for trusting {business_name}.
        </p>
      </div>
      <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:14px;">
        You're receiving this because you made a recent purchase. Reply anytime to reach us.
      </p>
    </body>
    </html>
    """
    text = (
        f"Hi {customer_name},\n\n"
        f"It's been about {days_ago} days since your purchase of {items_summary}. "
        f"Just checking in — is everything working?\n\n"
        f"If anything isn't right, reply to this email and we'll sort it out. "
        f"If all is good and you have a moment, a quick review helps us a lot.\n\n"
        f"Thanks again,\n{business_name}\n"
    )
    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        logger.info(f"Follow-up email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send follow-up email: {e}")
        return False
