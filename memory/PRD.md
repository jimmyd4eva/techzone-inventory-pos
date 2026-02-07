# SmartRepair POS - PRD

## Original Problem Statement
1. Remove the 10% tax from the SmartRepair POS application
2. Add a configurable tax rate in settings
3. Add category-based tax exemptions
4. Add tax reporting
5. Add PDF export for tax reports
6. Add coupon/discount feature
7. Add coupon usage analytics
8. Make coupons selectable at checkout

## Architecture
- **Backend**: FastAPI (Python)
- **Frontend**: React.js
- **Database**: MongoDB
- **PDF Generation**: ReportLab

## What's Been Implemented

### Tax Features
- Configurable tax rate in Settings (0-100%)
- Category-based tax exemptions
- Tax reporting with visual charts
- PDF export for tax reports

### Coupon Feature
- Coupon management (CRUD operations)
- Discount types: percentage and fixed amount
- Min purchase, max discount, usage limit, validity dates
- Coupon usage tracking and analytics

### Coupon Selection at Checkout (NEW)
- **"View Available Coupons" button** on Sales page
- Expandable list showing all active coupons
- Each coupon shows: code, discount badge, description, min purchase
- Coupons not meeting minimum are grayed out
- **Click to apply** - no need to type code manually
- Applied coupon shows with X button to remove

## Test Results
- Backend: 100% success
- Frontend: 95% (minor toggle UI note)

## User Personas
- **Admin**: Full access - manage coupons, configure settings
- **Cashier**: Select coupons from list during checkout

## Backlog
- None

## Next Tasks
- Deploy to production
