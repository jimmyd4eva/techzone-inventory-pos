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
