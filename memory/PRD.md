# SmartRepair POS - PRD

## Original Problem Statement
1. Remove the 10% tax from the SmartRepair POS application
2. Add a configurable tax rate in settings
3. Add category-based tax exemptions
4. Add tax reporting
5. Add PDF export for tax reports
6. Add coupon/discount feature

## Architecture
- **Backend**: FastAPI (Python)
- **Frontend**: React.js
- **Database**: MongoDB
- **PDF Generation**: ReportLab

## What's Been Implemented

### Feb 7, 2026 - Tax Features
- Removed hardcoded 10% tax
- Configurable tax rate in Settings (0-100%)
- Category-based tax exemptions (Parts, Screens, etc.)
- Tax reporting with daily/weekly/monthly stats
- Taxable vs Exempt visual breakdown
- PDF export for tax reports

### Feb 7, 2026 - Coupon Feature
- **Backend Endpoints**:
  - GET /api/coupons - List all coupons
  - POST /api/coupons - Create coupon (admin)
  - PUT /api/coupons/{id} - Update coupon
  - DELETE /api/coupons/{id} - Delete coupon
  - POST /api/coupons/validate - Validate & calculate discount
  - POST /api/coupons/{id}/increment-usage - Track usage

- **Coupon Model**:
  - Code (unique, uppercase)
  - Discount type (percentage or fixed)
  - Discount value
  - Minimum purchase requirement
  - Maximum discount (for percentage)
  - Usage limit & tracking
  - Validity dates
  - Active/inactive status

- **Frontend**:
  - Coupons page with table view
  - Add/Edit coupon modal
  - Toggle active status
  - Sales page coupon input
  - Apply/remove coupon
  - Discount display in cart

## Test Results
- Backend: 100% success
- Frontend: 100% success

## User Personas
- **Admin**: Full access - manage coupons, tax settings, reports
- **Cashier/Technician**: Apply coupons during sales

## Backlog
- None

## Next Tasks
- Deploy to production
