# SmartRepair POS - PRD

## Original Problem Statement
1. Remove the 10% tax
2. Add configurable tax rate in settings
3. Add category-based tax exemptions
4. Add tax reporting
5. Add PDF export for tax reports
6. Add coupon/discount feature
7. Add coupon usage analytics
8. Make coupons selectable at checkout
9. Make address, phone, logo editable
10. Show coupon used in sales history
11. Add customer points system
12. **Add per-device activation code system** (NEW - Feb 2026)

## Architecture
- **Backend**: FastAPI (Python)
- **Frontend**: React.js
- **Database**: MongoDB

## What's Been Implemented

### Device Activation System (NEW - February 2026)
- **Per-device activation** - Each device requires a unique activation code
- **12-hour code expiry** - Activation codes are valid for 12 hours only
- **One-time use codes** - Each code can only activate one device
- **Email delivery** - Codes sent via Gmail SMTP (zonetech4eva@gmail.com)
- **Device fingerprinting** - Unique device ID generated from browser fingerprint
- **Activation screen** - Blocks app access until device is activated

**Endpoints:**
- `POST /api/activation/check` - Check if device is activated (PUBLIC)
- `POST /api/activation/request-code` - Generate and email activation code (PUBLIC)
- `POST /api/activation/activate` - Verify code and activate device (PUBLIC)
- `GET /api/activation/list` - List all activated devices (ADMIN)
- `DELETE /api/activation/revoke/{device_id}` - Revoke device activation (ADMIN)

**Models:**
- `ActivationCode` - stores code, email, expiry, is_used
- `ActivatedDevice` - stores device_id, activation_code, email, timestamp

**Frontend:**
- `/app/frontend/src/pages/Activation.js` - Activation screen with OTP input
- App.js modified to check activation status on load

### Tax Features
- Configurable tax rate (0-100%)
- Category-based exemptions
- Tax reporting with PDF export

### Coupon Feature
- CRUD for coupons (percentage/fixed)
- Selectable coupons at checkout
- Coupon column in Sales History
- Coupon usage analytics

### Business Info (Settings)
- Business Name (editable) - displays across Login, Sidebar, Receipts
- Address (editable textarea) - displays across Login, Sidebar, Receipts
- Phone Number (editable) - displays across Login, Sidebar, Receipts
- Logo - **Two options**:
  1. **Upload from Computer** - Upload JPG, PNG, GIF, WebP, or SVG (max 5MB)
  2. **Enter URL** - Use an external image URL
- Logo preview with "Remove" button
- **Dynamic display**: All business info is pulled from Settings API and displayed in real-time
- **Public endpoint**: `/api/settings/public` for unauthenticated pages (Login)
- **Upload endpoint**: `/api/upload/logo` for file uploads

### Customer Points System
- Enable/disable toggle in Settings
- Earn rate: 1 point per $500 spent (0.002 per $1)
- Redemption threshold: configurable minimum total spend to redeem
- Point value: configurable dollar value per point
- **Customer tracking**: total_spent, points_balance, points_earned, points_redeemed
- **Sale tracking**: points_used, points_discount, points_earned
- **Automatic points update on completed sales**
- **UI Integration**:
  - **Customers page**: Shows Points and Total Spent columns
  - **Sales page**: Loyalty Points section appears when customer is selected

## Test Results
- Backend: 86% (minor validation issues fixed)
- Frontend: 100%
- Overall: 100% (activation system fully tested)

## User Flow - Activation
1. User opens the app on a new device
2. Activation screen appears with email input
3. User enters registered email (e.g., jimmyd4eva@hotmail.com)
4. 6-digit code sent to email (or displayed if email unavailable)
5. User enters code within 12 hours
6. Device activated, redirected to login
7. Subsequent visits skip activation (device remembered)

## Configuration Required
To enable email sending, set in `/app/backend/.env`:
```
EMAIL_ADDRESS=zonetech4eva@gmail.com
EMAIL_PASSWORD=<gmail_app_password>
```
Note: Gmail requires an "App Password" for SMTP access.

## Next Tasks
- Configure Gmail app password for email delivery
- Backend refactoring (server.py is 2200+ lines)

## Future/Backlog Tasks
- **Windows Installer (P2)**: Create standalone .exe for offline use
- **Email Reporting (P2)**: Automatically send weekly/monthly tax and sales summaries
- **Personalized Coupons (P2)**: Generate exclusive discount codes based on purchase history
- **Backend Refactoring (P1)**: Split large `server.py` into modular structure (routes, models, services)
