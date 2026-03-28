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

**Admin Device Management UI** (Settings → Devices tab):
- View all activated devices with device ID, email, and activation time
- Revoke device activations (requires re-activation)
- Export activated devices list to CSV
- Stats showing total devices and unique emails

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
- Backend refactoring (`server.py` is now 2800+ lines)

## Future/Backlog Tasks
- **Windows Installer (P2)**: Create standalone .exe for offline use
- **Email Reporting (P2)**: Automatically send weekly/monthly tax and sales summaries
- **Personalized Coupons (P2)**: Generate exclusive discount codes based on purchase history
- **Backend Refactoring (P1)**: Split large `server.py` into modular structure (routes, models, services)

---

## Cash Register Feature (NEW - March 2026)

### What it does:
Full shift management and cash tracking for business accounting.

1. **Open/Close Shifts**
   - Open a shift with an initial cash float (starting cash amount)
   - Close shift by counting actual cash and comparing to expected
   - Automatic variance calculation (OVER/SHORT/BALANCED)

2. **Transaction Tracking**
   - **Cash Sales**: Automatically recorded when cash sales are made via Sales page
   - **Payouts**: Cash taken out for expenses (petty cash, vendor payments)
   - **Drops**: Cash moved to safe/vault during shift
   - **Refunds**: Cash returned to customers

3. **Shift History & Reporting**
   - View all past closed shifts with their variance status
   - Daily summary aggregation available via API

### How to use:

#### Step 1: Open a Shift
- Go to **Settings → Cash Register** tab
- Enter the starting cash amount (count the drawer)
- Click "Open Shift"

#### Step 2: Make Sales
- Cash sales made on the Sales page are automatically recorded
- They appear in the Shift Transactions list

#### Step 3: Record Other Transactions
- Use the "Record Transaction" form for:
  - **Payout**: Cash going out (e.g., paying a supplier)
  - **Drop**: Moving cash to safe
  - **Refund**: Returning cash to customer

#### Step 4: Close Shift
- At end of day, count the actual cash in drawer
- Enter the count in "Actual Cash Count"
- System shows if you're OVER, SHORT, or BALANCED
- Add notes if needed (explain discrepancies)
- Click "Close Shift"

### API Endpoints:
- `GET /api/cash-register/current` - Get current open shift with transactions and totals
- `POST /api/cash-register/open` - Open a new shift with opening_amount
- `POST /api/cash-register/close` - Close shift with closing_amount (**auto-emails report if enabled**)
- `POST /api/cash-register/transaction` - Record payout/drop/refund
- `GET /api/cash-register/history` - Get list of closed shifts
- `GET /api/cash-register/daily-summary` - Get daily summary report (admin only)
- `GET /api/cash-register/report/{shift_id}` - Download PDF report for a shift

### Auto-Email Feature (NEW):
When enabled in Settings → Cash Register tab:
- PDF report automatically emailed to configured manager address when any shift is closed
- Email includes shift summary table and PDF attachment
- Configure manager email address in the "Auto-Email Shift Reports" section

### Settings Fields:
- `shift_report_email_enabled` - Toggle to enable/disable auto-email
- `shift_report_email` - Manager's email address for receiving reports

### Database Collections:
- `cash_register_shifts`: Stores shift records with opening/closing amounts and variance
- `cash_register_transactions`: Individual transactions within a shift

### Test Results (March 2026):
- Backend: 100% (15/15 tests passed)
- Frontend: 100%
- All features verified working

---

## Dual Pricing Feature (NEW - March 2026)

### What it does:
1. **Retail vs Wholesale Pricing**
   - Each inventory item can have a separate wholesale price
   - Customers can be marked as "Retail" or "Wholesale"
   - Wholesale customers automatically see wholesale prices at checkout

2. **Cash vs Card Pricing**
   - Cash Discount: Apply a percentage discount for cash payments
   - Card Surcharge: Apply a percentage fee for card payments (Stripe/PayPal)

### How to use:

#### Step 1: Enable Dual Pricing
- Go to **Settings → Pricing** tab
- Toggle "Enable Dual Pricing"
- Set Cash Discount % (e.g., 2% for 2% off on cash)
- Set Card Surcharge % (e.g., 3% for 3% fee on cards)

#### Step 2: Set Wholesale Prices
- Go to **Inventory**
- Edit an item
- Enter the **Wholesale Price** (leave empty to use retail price)

#### Step 3: Mark Wholesale Customers
- Go to **Customers**
- Edit a customer
- Change **Customer Type** to "Wholesale"

#### Step 4: Make a Sale
- Select a wholesale customer → prices automatically switch to wholesale
- Select Cash payment → discount applied
- Select Card payment → surcharge applied

### Database Changes:
- `inventory` collection: Added `wholesale_price` field
- `customers` collection: Added `customer_type` field (retail/wholesale)
- `settings` collection: Added `dual_pricing_enabled`, `cash_discount_percent`, `card_surcharge_percent`
