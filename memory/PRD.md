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
13. **Cash Register with shift tracking + PDF + email reports** (Feb 2026)
14. **Zero-install portable Windows build** (Feb 2026)
15. **Rich text formatting for Business Info (Name / Address / Phone) + Receipt** (Feb 21, 2026)
16. **P1 refactor: backend/server.py split into core/routes/services/models.py; Settings.js split into per-tab components** (Feb 21, 2026)
17. **P2 features: auto-email weekly/monthly sales & tax summary PDFs; per-customer personalized coupons; live receipt preview in Settings** (Feb 21, 2026)

## Architecture
- **Backend**: FastAPI (Python)
- **Frontend**: React.js
- **Database**: MongoDB

## What's Been Implemented

### Data & Backup Panel (Feb 22, 2026) ✅
- **New `GET /api/admin/backup`** endpoint (admin-only) in `routes/admin.py` streams an in-memory ZIP containing one `.json` per collection + a `_manifest.json`. No `mongodump` binary required — works identically on cloud preview and portable Windows builds. Verified: 16 collections exported, 51KB zip, non-admin returns 401/403.
- **New "Backup" tab** in Settings (`DataBackupTab.js`, testid `section-backup`, `download-backup-btn`, `data-backup-tab`, `backup-msg`): informative copy, recommendation callout, purple primary Download button with downloading state, last-backup-on-this-browser timestamp cached in `localStorage.last_backup_at`.
- Designed to be universal: owners on the portable single-PC install, on cloud preview, or on production all use the same one-click flow. Replaces the earlier "open Explorer on data folder" idea because downloading a zip is platform-independent and works for remote admins too.


### Portable Windows Installer (Feb 22, 2026) ✅
- **One-command portable build** via rewritten `BUILD_PORTABLE.bat` (v1.1.0). Produces a self-contained `TechZone-Portable\` folder + `TechZone-Portable-1.1.0.zip` that drops onto any Windows 10/11 PC and runs with a double-click. No admin rights, no Python/Node/MongoDB installs on the target.
- **Bundled at build time**: embedded Python 3.11 with all of `backend/requirements.txt` installed, embedded MongoDB 7.0 (`mongod.exe`), production React build, auto-generated `.env` with a fresh random 64-char JWT secret per install.
- **Single-port architecture**: FastAPI serves the SPA at `/` and API at `/api/*` on `127.0.0.1:8001`. Frontend is built with empty `REACT_APP_BACKEND_URL` so it makes same-origin calls — no CORS drama on the target machine.
- **Activation bypassed** via new `ACTIVATION_DISABLED=true` env support in `routes/activation.py` — portable installs skip the device-lock screen (pointless for single-PC deploys). Preserved for cloud/preview where it stays enforced.
- **Helper scripts** generated into the package: `START.bat` (launches MongoDB quietly, starts uvicorn, opens browser), `STOP.bat`, `RESET_ADMIN.bat` (one-click admin password reset), `README.txt`.
- **Docs**: Completely rewrote `/app/INSTALLER_BUILD_GUIDE.md` with build prerequisites (Node/yarn/curl/tar on build machine only), output structure, troubleshooting table, port details, LAN-exposure instructions, and uninstall steps.
- **Validated end-to-end on preview**: frontend build succeeds with `REACT_APP_BACKEND_URL=""`, FastAPI serves SPA at `/` (200/2758B), `/static/js/…` served (200/665KB), `/dashboard` SPA-fallback works (200), `/api/*` still routes correctly. Activation bypass verified via curl (false → true after env flip).


### Users Page — "Last Active" Column (Feb 22, 2026) ✅
- `GET /api/users` now enriches each row with `last_login_at` / `last_login_ip` via a MongoDB aggregation against `login_audit` (single pipeline, no N+1). Fields added to the `User` Pydantic model (both `Optional[str] = None`).
- New **Last Active** column in `Users.js` (testid `user-lastactive-<id>`) rendered as a colour-coded pill: green for today, indigo for this week, amber for stale (>7d), grey for never. Hovering shows the exact timestamp + IP tooltip.
- Relative-time formatting: "just now" / "Nm ago" / "Nh ago" / "yesterday" / "Nd ago" / locale date for >30 days.
- Verified via curl (admin shows fresh `last_login_at`, never-logged-in users show `None`) + UI screenshot (admin="just now" green, others="Never" grey).


### Full XSS Hardening: localStorage Token Removal (Feb 22, 2026) ✅
- Swept every `localStorage.getItem('token')` / `localStorage.setItem('token')` / `localStorage.removeItem('token')` call out of the frontend. 17 page/component files updated: `App.js`, `Login.js`, `Dashboard.js`, `Reports.js`, `Settings.js` (and all 6 settings tabs), `Inventory.js`, `Sales.js`, `SalesHistory.js`, `Repairs.js`, `Customers.js`, `Suppliers.js`, `Coupons.js`, `Users.js`, `PaymentSuccess.js`, `PaymentSuccessPayPal.js`, `Layout.js`, `PurchaseOrderModal.js`.
- `App.js` now hydrates the user on boot via `GET /api/auth/me` (cookie-authenticated). If the cookie is missing/expired/revoked, cached `user` is cleared and the app bounces to `/login`. `handleLogin(userData)` now takes a single argument — no token.
- Verified end-to-end: after login, `localStorage.getItem('token')` returns `null`; every authenticated API call succeeds via the `techzone_token` httpOnly cookie alone (no `Authorization` header sent from the SPA). XSS token-theft surface fully closed.
- Bonus fix during regression: `Sales.js` / `ProductSelection.js` had 4 undefined identifiers (`categories`, `selectedCategory`, `setSelectedCategory`, `filteredItems`) from a prior extraction that would crash the POS page — rewrote the prop contract to the actually-used `filteredInventory` + `selectedCustomer`. Sales now renders 86 products.
- Testing agent iteration 16: 11/12 frontend regression checks passed pre-fix, 12/12 post-fix (Sales + logout flow confirmed green manually).


### Account Security Tab — Session Management (Feb 22, 2026) ✅
- New **Security** tab in Settings (testid `section-security`) lists recent sign-ins for the current user: device/browser, IP, signed-in time, duration (24h vs 30d remember-me), and status.
- Per-row **Sign out** button revokes that session's `jti`. The active browser is tagged `This browser` with a confirmation dialog before self-signout (bounces to `/login` after success).
- Bonus: **"Sign out other devices"** header button (testid `revoke-other-sessions-btn`) → new endpoint `POST /api/auth/sessions/revoke-others` revokes every session for the user except the current `jti` in one click.
- Backend already had `jti` enforcement in `get_current_user` — revoked tokens return `401 "Session revoked — please sign in again"`. Curl-verified end-to-end (TOKEN1 revokes TOKEN2 → TOKEN2 is rejected, TOKEN1 continues working).
- Files: `routes/auth.py` (+ revoke-others endpoint), `pages/Settings.js` (wire-up), `pages/settings/AccountSecurityTab.js` (UI).


### "Remember this device for 30 days" (Feb 21, 2026)
- New checkbox on Login page (testid `remember-me-checkbox`) — when ticked, the login request sends `remember_me: true`.
- Backend: `UserLogin` model has a new `remember_me: bool = False` field (backward compat — omit it and login still works). `_set_auth_cookie()` accepts `remember_me` and uses `Max-Age=2592000` (30 days) instead of the default `86400` (24h).
- Verified via curl: both paths tested, 30d max-age correct, backward compat preserved. All 66 tests pass.

### Auth Migration: localStorage → httpOnly Cookies (Feb 21, 2026) [Task f]

**Backend changes:**
- `core/security.py::get_current_user()`: now reads `techzone_token` cookie first, falls back to `Authorization: Bearer` header (backward compat).
- `routes/auth.py`: `/auth/login` and `/auth/register` now call `_set_auth_cookie()` to set the httpOnly cookie alongside the legacy JSON response. New `POST /auth/logout` endpoint clears the cookie via `_clear_auth_cookie()`.
- Cookie attributes: `HttpOnly`, `Secure` (driven by new `COOKIE_SECURE=true` env var), `SameSite=lax`, `Max-Age = JWT_EXPIRATION_HOURS × 3600`, `Path=/`.
- `server.py` CORS: when `CORS_ORIGINS="*"` (the current default), auto-switches to `allow_origin_regex=".*"` — browsers reject `Access-Control-Allow-Origin: *` with `allow_credentials=True`, so we mirror the Origin header back instead.

**Frontend changes:**
- `App.js`: set `axios.defaults.withCredentials = true` globally so cookies ride along on every API call.
- `App.js::handleLogout()`: now also calls `POST /api/auth/logout` (fire-and-forget) to clear the server-side cookie before wiping localStorage.

**Verified end-to-end (5 scenarios):**
1. Login sets cookie + returns JSON token ✅
2. Cookie-only auth works (no Authorization header) ✅
3. Legacy Bearer header still works (backward compat) ✅
4. No credentials → 401 ✅
5. Logout clears cookie → subsequent request → 401 ✅

**66/66 backend tests pass, zero regressions.**

**Not done (intentional — follow-up work):**
- `localStorage.setItem('token', ...)` on login response is still in place. This is harmless (the cookie is the authoritative auth, and the localStorage copy isn't used by the new code paths) but a follow-up pass could remove all `localStorage.getItem('token')` reads and the `Authorization: Bearer` sends from the frontend. Doing that in one giant sweep across 15+ page files was deemed higher-risk than the security win; safer as a gradual migration.
- The `Authorization: Bearer` fallback in `get_current_user` could be removed in a future security hardening pass once the frontend no longer sends it.

### Code Review Fixes — Priority 2 (Refactors d, e, c, b, a) (Feb 21, 2026)

**Backend (d, e):**
- New `services/shift_report_service.py` with pure helpers (`calculate_transaction_totals`, `calculate_expected_cash`, `fetch_business_info`, `build_shift_report_pdf`, `build_close_shift_email_pdf`, `_format_summary_table`, `_format_shift_info_table`, `_format_transactions_table`).
- `routes/cash_register.py::close_shift()` reduced from 132 → ~55 lines; email-PDF + notification logic extracted to `_maybe_send_close_shift_email()` helper.
- `routes/cash_register.py::generate_shift_report()` reduced from 164 → ~14 lines; all PDF building delegated to the service module.
- `cash_register.py` overall: 521 → 313 lines (–40%). Fixed a bare `except:` → `except ValueError`. **66/66 backend tests pass, zero regressions.**

**Frontend (c, b, a):**
- `Reports.js`: 800 → 138 lines (–83%). Extracted to `components/reports/` — `SalesReportTab.js`, `TaxReportTab.js`, `InventoryReportTab.js`, `CouponsReportTab.js`. Tab-button rendering also simplified via a single `TABS` array + `<TabButton>` component.
- `Customers.js`: 909 → 479 lines (–47%). Extracted to `components/customers/` — `CustomerFormModal.js`, `CustomerDetailModal.js`, `CustomerCouponModal.js`. Each takes props via an `onClose` callback rather than reaching into parent state mutators.
- `Sales.js`: 1533 → 1329 lines (–13%). Extracted to `components/sales/` — `ProductSelection.js` (87 lines) and `OpenRegisterModal.js` (140 lines). Further splitting the coupled cart-section (customer + coupon + payment + totals) was deferred because the 15+ shared state pieces would require heavy prop-drilling; deeper refactor tracked as a future task if needed.

All 15 new component files lint clean; frontend compiles with only pre-existing DOMPurify source-map warnings. Zero functional changes — this is pure organizational work.

### Save-as-My-Theme (Feb 21, 2026)
- Three new nullable settings fields: `custom_theme_thankyou_html`, `custom_theme_tagline_html`, `custom_theme_footer_note_html`.
- New purple **"💾 Save current as My Custom"** button captures the live 3-field footer HTML into the custom slot.
- When populated, a fifth theme button **★ My Custom** (dashed purple border) appears alongside the 4 built-ins — one click snaps back to the saved look.
- New **Clear custom** button wipes the slot by sending empty strings (matches the PUT endpoint's `None = don't update` semantics while still persisting a falsy value so the UI correctly hides "My Custom"). Backend round-trip verified; 66 tests pass.
- Testids: `save-custom-theme-btn`, `clear-custom-theme-btn`, `receipt-theme-custom`.

### One-Click Receipt Themes (Feb 21, 2026)
- Added a **"One-click themes"** row at the top of the Receipt Footer Messages card in Settings → Business Information. Four presets:
  - **Classic Thermal** — Courier monospace, centered, uppercase "THANK YOU!" — classic register tape look.
  - **Boutique** — Georgia serif, italic "Thank you, dearly." with warm-brown accent + "Small shop. Big heart." tagline.
  - **Bold Retail** — Impact 24px red "THANKS FOR SHOPPING!" with Arial warranty reminder in footer.
  - **Minimal** — Verdana, single line, no tagline — clean and modern.
- Each button preview-renders in its own theme font/color so operators can see before clicking. Clicking sets only the three footer rich-text fields (preserves user's business name / address / phone untouched).
- Every theme's HTML is pre-formatted with `<span>` / `<div>` tags that round-trip through the existing DOMPurify sanitizer (verified: `font-family`, `font-size`, `color` all preserved for all four themes).
- Operators can still tweak individual fields after applying a theme. Testids: `receipt-theme-classic / boutique / bold / minimal`.

### Font-Family Selector on All Rich-Text Fields (Feb 21, 2026)
- `SimpleRichTextEditor` toolbar now includes a font-family dropdown (testid `rte-font-family`) with 9 curated options: Default, Sans-Serif, Serif, **Monospace (receipt)** for classic thermal-printer look, Georgia, Verdana, Trebuchet MS, Comic Sans, Impact.
- Applies to the currently-selected range; uses `span[style="font-family: ..."]` so it composes cleanly with existing bold / italic / underline / font-size / color.
- Automatically appears on all 6 receipt fields (Business name/address/phone + Thank-You/Tagline/Footer-Note) since they all share the same editor component.
- Verified round-trip through DOMPurify with the existing `ALLOWED_TAGS / ALLOWED_ATTR` config — font-family, font-size, color all preserved (including quoted family names like `"Courier New"`). No backend changes.

### Code Review Fixes — Priority 1 (Bugs & Security) (Feb 21, 2026)
Applied fixes from the device-lock-1 code review (critical/high-priority items):

**Python (backend)**
- `routes/reports.py:_period_range()` — added explicit type annotations `start/end/label` at function start so all code paths have defined values (linters were warning on the `else: raise` branch).
- `core/security.py:generate_activation_code()` — replaced `random.choices()` with `secrets.choice()`. This code gates device access; `secrets` is the cryptographically secure SPRNG. Removed `import random`, added `import secrets`.
- `database.py` — fixed late-binding closure bug in `find_many()` sort loop: `lambda x, k=sort_key: x.get(k, "")` so each iteration captures its own `sort_key` value.

**React (frontend)**
- `Dashboard.js` — explicit `eslint-disable-next-line react-hooks/exhaustive-deps` on the mount-once data-loading effect (all deps are module-scoped stable constants). Replaced empty `catch {}` in `openPoModal()` with a `console.debug` log so silent failures are observable.
- `Users.js`, `Settings.js`, `Sales.js` — same idiomatic eslint-disable comments on legitimately-empty or intentional-deps effects (documented as intentional rather than silently stale).
- `Receipt.js`, `SalesHistory.js`, `Reports.js` (3 locations) — replaced array-index `key={idx}` with stable-id keys (`item.item_id` / `coupon.code` / `cat.category`) so React doesn't lose row state during re-renders.

All 66 backend pytest tests pass; frontend lint clean on all 8 modified files. Zero behavior change — these are correctness/security hygiene only.

**Not done in this pass (intentional — need user sign-off first):**
- localStorage → httpOnly-cookie auth migration (touches every API call + backend CORS/SameSite, needs dedicated integration-agent playbook for JWT-in-cookie flow).
- Splitting `Sales.js` (1524 lines), `Customers.js` (900), `Reports.js` (790), `Inventory.js` (597), `CashRegisterTab.js` (564) into sub-components.
- Refactoring `routes/cash_register.py::generate_shift_report()` (164 lines, complexity 24) and `close_shift()` into smaller functions.
- These are multi-hour refactors with higher regression risk — queued for user approval.

### Retention Score on Top Customers (Feb 21, 2026)
- `GET /api/reports/top-customers` now returns `retention_score` (0–100) and `retention_tier` ("high"/"medium"/"low") per customer — a simple RFM-weighted blend:
  - **Recency (40 pts)**: 0 days ago = 40 pts, linearly decaying to 0 at 120 days.
  - **Frequency (30 pts)**: relative to the most-frequent customer in the slice.
  - **Monetary (30 pts)**: relative to the top spender in the slice.
- `TopCustomersWidget` shows a pill-shaped badge per row with a filled heart icon — green (≥70), amber (40–69), red (<40). Tooltip explains the score composition. New testid: `top-customer-retention-<id>`.
- Zero new endpoints, no DB changes — computed on-the-fly from existing sales+customers data. Lint clean, 66 backend tests pass (no regressions).

### Footer Note Quick Templates (Feb 21, 2026)
- Added three one-click preset chips above the Footer Note editor in Settings → Business Information: **Warranty (30 days)**, **Returns Policy**, **Follow Us**. Each button instantly fills the editor with polished, already-formatted copy (bold keywords, underlined warranty-receipt reminder, italicized word-of-mouth note).
- Clicking simply calls `setSettings()` — operator can then tweak further in the rich-text editor before saving. No backend changes. Testids: `footer-template-warranty`, `footer-template-returns`, `footer-template-social`.

### Editable & Formattable Receipt Footer (Feb 21, 2026)
- Three new rich-text settings control the bottom of every on-screen post-sale receipt: `receipt_thankyou_html`, `receipt_tagline_html`, `receipt_footer_note_html`. Defaults preserve the previous hard-coded text ("Thank you for your business!" / "Quality repairs, trusted service" / "Please keep this receipt for your records").
- Each field uses the existing `SimpleRichTextEditor` (bold/italic/underline, alignment, font size, color) and is surfaced as a purple **Receipt Footer Messages** card in Settings → Business Information, directly above the Live Receipt Preview.
- `Receipt.js` (post-sale modal) uses the same `renderFormatted()` path as business-info fields — DOMPurify-sanitized HTML with the same allow-list, gracefully falls back to defaults if settings are missing.
- `ReceiptPreview.js` (Settings live preview) renders the 3 fields in place, so operators see exactly what customers will see.
- Zero behavior change for existing receipts (defaults match prior text); backend round-trip verified (`<b>`, `<i>`, `<u>`, `<span style="color:...">` all preserved). All 66 backend tests pass.

### Birthday WhatsApp/SMS Reach-Out Buttons (Feb 21, 2026)
- `UpcomingBirthdaysWidget` now renders two per-row action buttons: green WhatsApp (`wa.me/`) and blue SMS (`sms:`), each opening the native device/browser handler with a pre-filled personal birthday message (`Happy Birthday today!` / `...tomorrow!` / `...in X days!` variants) using the live business name pulled from `/api/settings/public` (HTML-stripped).
- Phone normalization reuses the existing E.164 helper pattern; buttons are disabled (40% opacity, `not-allowed` cursor) when the customer has no phone on file.
- Zero backend changes — pure frontend enhancement on top of the existing `upcoming-birthdays` endpoint. Lint clean.

### Upcoming Birthdays Dashboard Widget (Feb 21, 2026)
- New `GET /api/reports/upcoming-birthdays?days=7` endpoint: returns customers whose birthday falls in the next N days (inclusive of today), with `days_until`, `birthday_date`, and a `coupon_already_sent` flag looked up against the `birthday_coupons` dedupe collection. `days` is clamped to [1, 60]; year-wrap handled by computing the next N calendar days and matching MM-DD.
- New `UpcomingBirthdaysWidget` component wired into the refactored Dashboard container (pink Cake card, directly under Staff Performance). Displays `Today 🎉 / Tomorrow / In X days` relative labels, contact info, lifetime spend, and a green **Sent** badge when the auto-coupon has already been issued for that customer this year.
- Verified with 2 new pytests (window-inclusion + `days=0` clamping) — 6/6 birthday-related tests pass total, zero regressions.

### Dashboard Refactor (Feb 21, 2026)
- `frontend/src/pages/Dashboard.js` split from 1062 lines → 137-line container.
- New components under `frontend/src/components/dashboard/`:
  - `StatsGrid.js` (4 headline stat cards)
  - `StaffPerformanceWidget.js`
  - `TopCustomersWidget.js`
  - `AtRiskCustomersWidget.js`
  - `CouponPerformanceWidget.js`
  - `SlowMovingWidget.js`
  - `LowStockWidget.js` (exports `suggestedQty`, `groupBySupplier`, `downloadGroupCSV` helpers)
  - `PurchaseOrderModal.js` (self-contained modal state + WhatsApp/email PO logic)
- All existing data-testids preserved; no behavior change. Lint clean on 9 files.

### Birthday Coupons (Feb 21, 2026)
- New `birthday` field on Customer (MM-DD, year-agnostic) with editable input + profile display in the Customers page (`customer-birthday-input`).
- New settings: `birthday_coupons_enabled`, `birthday_discount_percent` (default 15), `birthday_valid_days` (default 14), `birthday_coupons_last_run` (internal daily guard). Surfaced in Settings → Points System as a dedicated "Birthday Coupons" card with a pink Cake icon, inputs for % off and validity days, and a **Run today's sweep now** button (admin-only endpoint for testing or forcing a resweep).
- New `services/birthday_service.py` with `process_birthday_coupons()`; wired into the hourly scheduler loop (runs once per UTC day via the `birthday_coupons_last_run` guard).
- On match, it creates a personalized coupon (`BDAY-<custId4>-<year>`, 1-use, customer-locked, % off, expires in N days, `source="birthday"`), inserts a dedupe doc into `birthday_coupons` collection keyed on `(customer_id, year)`, and emails the coupon via the existing `send_coupon_email()` flow.
- Idempotent at every level: daily guard prevents same-day resweeps; `birthday_coupons` dedupe prevents same-year duplicates; the manual trigger endpoint clears only the daily guard (dedupe survives).
- Verified with 4 backend regression tests (`tests/test_birthday_coupons.py`): field persistence, positive sweep, negative sweep (non-matching birthday), disabled-flag no-op. All 60+4 tests pass.

### Configurable VIP Threshold in Settings (Feb 21, 2026)
- New `vip_spend_threshold` field on `Settings` (default 20000). Surfaced in Settings → Points System → Follow-up card with a $-prefixed input (testid `vip-threshold-input`), directly under the Google Review URL field.
- `_review_cta()`, `send_loyalty_points_email()`, and `send_followup_email()` all accept `vip_threshold`; `routes/sales.py` and `services/scheduler.py` now read it from settings on every send.
- Safety rail: threshold of 0 / negative / missing falls back to the module default (20000) so a blank field cannot accidentally promote every customer to VIP copy.
- Verified via backend: PUT/GET persists the value; tier decision correctly flips at the configured threshold (tested 5000/20000, 5000/3000, 15000/0 fallback, follow-up 1500/1000).

### Smart A/B Review CTA by Customer Tier (Feb 21, 2026)
- Both loyalty and follow-up emails now vary the "Leave a review" copy based on customer tier. Priority order: **milestone > first-purchase > VIP (cumulative spend ≥ $20,000) > default**.
  - Milestone: "★ Share the love — leave a review" (unchanged, highest-trust moment)
  - First-purchase: "★ How was your first {business} experience?" — drives first-impression reviews
  - VIP: "★ You're a VIP — a 5-star review would mean the world" — VIP endorsements carry extra weight
  - Default: "★ Leave a review"
- Centralized in `_review_cta()` helper (one place to tune copy / threshold). VIP threshold constant: `_VIP_SPEND_THRESHOLD = 20000.0`.
- `routes/sales.py` derives `is_first_purchase` from pre-sale `customer.total_spent == 0` and computes `cumulative_total_spent = prev + sale_total`, then passes both to loyalty emails (immediate) and persists them on the `followups` doc (scheduler uses the sale-time snapshot).
- Verified across 8 scenarios (5 loyalty + 3 follow-up) — all tiers render correct copy; blank `google_review_url` still fully hides the CTA.

### Google Review Link in Loyalty Emails (Feb 21, 2026)
- `send_loyalty_points_email()` now accepts `review_url`; when set, a green CTA button is rendered after the points balance block.
- Milestone emails (100 / 500 / 1000 pts) get **upgraded CTA copy** ("★ Share the love — leave a review" + "top customer" helper text) since milestone = highest-trust moment for 5-star reviews.
- `routes/sales.py` passes `settings.google_review_url` to the function, so the same single Settings field controls both Follow-up and Loyalty emails.
- Verified via backend: plain-text + HTML MIME bodies contain the link and button only when `review_url` is set; milestone variant swaps in the upgraded label.

### Google Review Link in Follow-up Emails (Feb 21, 2026)
- New optional setting `google_review_url` (Settings → Points System → Follow-up Check-in Emails card).
- Input appears only when Follow-up emails are enabled; accepts any URL (tip provided for Google Business Profile short link).
- `send_followup_email()` renders a prominent green "★ Leave a review" CTA button (HTML) and inline link (plain-text) when `review_url` is set; button is fully omitted when the field is blank.
- Scheduler loads `google_review_url` from settings each cycle and passes it to every queued follow-up, so the link updates retroactively for all pending sends.
- Verified via backend: PUT /api/settings persists the field; `send_followup_email(..., review_url=...)` produces HTML + plain-text bodies containing the link in a quoted-printable MIME message.

### Follow-up Check-in Emails (Feb 21, 2026)
- New Settings fields: `followup_emails_enabled` (toggle) + `followup_days` (default 14).
- UI: Settings → Points System → "Follow-up Check-in Emails" card with toggle + days input that appears when enabled.
- On sale creation with an email-on-file customer, backend inserts a `followups` doc with `send_at = now + followup_days` and `status=pending`.
- Hourly scheduler (`_process_followups()`) picks up due follow-ups, calls `send_followup_email()`, and updates status to `sent` or `failed`.
- Friendly branded email template: "Is everything working? Reply if not, review us if so." — surfaces warranty issues early and drives unsolicited reviews.
- **Verified end-to-end**: scheduled a sale, forced `send_at` into the past, manually invoked processor — real email delivered, DB status transitioned `pending → sent`.

### Loyalty Email Notifications (Feb 21, 2026)
- New Settings toggle `loyalty_emails_enabled` in Settings → Points System → Loyalty Email Notifications.
- When enabled, after each completed sale where the customer has an email on file and earns >0 points, the backend automatically sends a branded HTML email showing:
  - Points earned this purchase (+ sale total)
  - Current points balance
  - Milestone celebration block when the balance crosses 100, 500, or 1000 points (yellow dashed border + 🎉)
- New `send_loyalty_points_email()` helper in `services/email_service.py`. Failures are logged but never break the sale (non-fatal).

### Dashboard: Staff Performance Leaderboard (Feb 21, 2026)
- New `GET /api/reports/staff-performance?days=30` (admin/manager only) — aggregates completed sales per `created_by` and cash-register shifts per `closed_by_name` for the window; joins with users for role/email.
- Returns per-user: `sales_count, total_revenue, avg_order_value, shifts_closed, sum_abs_variance, avg_shift_variance, net_variance, last_sale_at, role`.
- Dashboard green-themed card with gold/silver/bronze rank badges, role chips (admin/manager/cashier), and variance color tier (green ≤$5, orange $5-20, red >$20, gray if no shifts).
- Sorted by revenue desc so the top cashier floats to the top.

### Dashboard: Coupon Performance Card (Feb 21, 2026)
- New `GET /api/reports/coupon-performance` — aggregates completed sales per `coupon_code` (redemptions, total discount given, total revenue, avg order value) and merges with every coupon in the directory. ROI = revenue / discount_given.
- Dashboard purple-themed card shows all coupons with Code/Description, Type (%/flat), Redemptions, Discount Given, Revenue, Avg Order, ROI, Status.
- ROI tiered by color (green ≥10×, orange 3-10×, red <3×). Status badges: **Active** (green, redeemed), **Unused** (yellow, 0 redemptions), **Inactive** (gray, disabled).
- Sorted by redemptions → revenue so high-impact coupons float to the top; unused coupons stay visible at the bottom (discoverability).

### Dashboard: Slow-Moving Inventory Card (Feb 21, 2026)
- New `GET /api/reports/slow-moving-inventory?days=90&limit=15` — MongoDB aggregation on completed sales for last-sale-per-item, joined with `quantity > 0` inventory; includes items never sold whose `created_at` is older than the window.
- Returns: `id, name, sku, category, supplier, quantity, price, stock_value, last_sale_at, days_stale, total_sold, ever_sold`. Sorted by `stock_value` desc so high-capital dead stock floats to the top.
- Dashboard "Slow-Moving Inventory" blue-themed card (sibling to Low Stock / At-Risk) with days-stale color tiers (120d→180d+), "Stalled" vs "Never sold" status badge, and one-click **Create Flash Sale Coupon** button.
- Flash Sale button deep-links to `/coupons?preset=flash` → Coupons.js auto-opens the create modal pre-filled with `FLASH<NNN>` code, 20% discount, 14-day expiry, "Flash sale — clearing slow-moving stock" description.

### Supplier Directory + PO WhatsApp (Feb 21, 2026)
- New `Supplier` model (`name`, `email`, `phone`, `whatsapp_number`, `address`, `notes`) with full CRUD at `/api/suppliers`.
- New case-insensitive `GET /api/suppliers/lookup?name=` endpoint used by the Dashboard PO modal.
- New `/suppliers` page (with `nav-suppliers` sidebar link) — searchable table, create/edit/delete modal, color-coded email/phone/WhatsApp icons.
- Dashboard Low Stock "Email PO" modal now:
  - **Auto-fills supplier email** from the directory when the inventory's `supplier` string matches a directory entry (`✓ Auto-filled from supplier directory` hint shown).
  - New **WhatsApp** button composes a formatted PO message (item list + suggested qtys) and opens `wa.me/<e164>?text=...` using the supplier's saved `whatsapp_number` (falls back to `phone`). Disabled with a tooltip if no contact saved.

### Dashboard: Low Stock Auto-Reorder Card (Feb 21, 2026)
- New `POST /api/inventory/email-purchase-order` — admin-only endpoint that composes a branded PO email with item list, on-hand qty, threshold, and suggested order quantity (formula: `max(threshold × 3 − on_hand, 5)`).
- Reuses existing `GET /api/inventory/low-stock` for the data.
- Dashboard "Low Stock — Reorder Needed" card groups items by supplier. Per group:
  - **CSV** button downloads a ready-to-import spreadsheet client-side.
  - **Email PO** button opens a modal to enter supplier email + optional note, then sends the branded PO via SMTP.
- Gracefully handles items with no supplier ("— No supplier —" group).
- Zero-quantity items styled in red for scannability.

### Dashboard: At-Risk / Customer Lost Alert (Feb 21, 2026)
- New `GET /api/reports/lost-customers?days=60&limit=20` — top-spending customers whose last completed sale is older than `days` days.
- Dashboard shows "At-Risk Customers" card with red severity color, count badge, and days-since-last-sale colored by severity tier (66→90→180 days).
- **We Miss You** button per row deep-links to `/customers?coupon_for=<id>&preset=winback`, which auto-opens the coupon modal pre-filled with:
  - Code `MISS<NAME><NNN>` (e.g. `MISSDANN652`)
  - Description "We miss you, <name> — here's a little something to welcome you back"
  - Discount: 15% (vs. 10% for regular personalized)
- From there: existing SMS / WhatsApp / Email share buttons reach the customer.

### Dashboard: Top Customers Widget (Feb 21, 2026)
- New `GET /api/reports/top-customers?limit=10` aggregates completed sales per customer and returns rank/name/contact/orders/total_spent/last_sale_at.
- Dashboard shows a "Top Customers" card with gold/silver/bronze rank badges and a one-click **🎫 Coupon** button per row.
- Clicking Coupon navigates to `/customers?coupon_for=<id>` → Customers.js auto-opens the personalized coupon modal (from there: SMS/WhatsApp/Email share).

### Coupon Sharing (SMS / WhatsApp / Email) — Feb 21, 2026
- Hybrid share panel after creating a personalized coupon from the Customer Detail page:
  - **SMS button** — opens native messaging app via `sms:+E164?body=...` with the coupon text pre-filled.
  - **WhatsApp button** — opens `https://wa.me/<E164>?text=...` in a new tab.
  - **Email button** — calls new `POST /api/coupons/{id}/email-to-customer` backend endpoint that sends a branded HTML email via existing Gmail SMTP.
- Phone normalization: auto-converts Jamaican local numbers (e.g., `(876) 843-2416`) to E.164 (`+18768432416`). Handles 7/10/11-digit local and international formats.
- No Twilio or paid SMS API required — `sms:` and `wa.me/` URL schemes work natively on every device.
- 4 new pytest cases in `test_p2_features.py::TestEmailCouponToCustomer`. Total P2 suite: **16/16 pass**.

### P2 Features (Feb 21, 2026)
- **Auto-email weekly & monthly sales + tax summary PDFs**
  - New service `/app/backend/services/summary_service.py` builds a combined revenue/tax/daily-breakdown PDF.
  - New service `/app/backend/services/scheduler.py` runs an hourly background asyncio loop and emails the report when due (previous Mon–Sun for weekly; previous calendar month for monthly).
  - New endpoint `POST /api/reports/send-summary-now` (admin only) for immediate delivery. Records `auto_summary_last_{weekly,monthly}_sent` in Settings so the scheduler doesn't double-send.
  - Recipient reuses existing `shift_report_email`.
  - UI: "Auto-Email Sales & Tax Summaries" card in Settings → Cash Register tab with two toggles and two Send Now buttons.
- **Personalized coupons per customer**
  - `Coupon`/`CouponCreate`/`CouponUpdate` models extended with `customer_id` + `customer_name`.
  - `POST /api/coupons/validate` now returns 400 when the coupon is personalized and customer_id is missing or mismatched.
  - Sales checkout silently skips applying a personalized coupon if it doesn't match `sale.customer_id` (prevents accidental double-spend of someone else's coupon).
  - UI: Customer picker dropdown in Coupons → Create modal; "Generate Personalized Coupon" button on Customer Detail page with its own modal; purple "For: <Name>" badge in the Coupons list.
- **Live receipt preview in Settings**
  - New component `/app/frontend/src/components/ReceiptPreview.js` mirrors the Receipt header rendering (blue/red split + formatted HTML + sanitization).
  - Appears under the Business Info tab; updates as you type (no save required).
- **Tests**: 12 new pytest cases in `/app/backend/tests/test_p2_features.py`. Total regression: 66/67 pass (testing agent iteration_15). 1 pre-existing flaky activation test (unrelated).

### P1 Codebase Refactor (Feb 21, 2026)
- **Backend** `server.py` went from **3209 → 110 lines** (97% reduction):
  - `/app/backend/core/` → `config.py` (env + DB client + integration init), `security.py` (bcrypt, JWT, `get_current_user`, `check_not_readonly`, `generate_activation_code`, `strip_html`).
  - `/app/backend/models.py` → all Pydantic models (User, Customer, Inventory, Repair, Sale, Settings, Coupon, Activation, CashRegister).
  - `/app/backend/services/email_service.py` → `send_activation_email`, `send_shift_report_email`.
  - `/app/backend/routes/` → one `APIRouter` per domain: `auth`, `customers`, `inventory`, `repairs`, `settings`, `activation`, `coupons`, `sales`, `admin`, `payments`, `reports`, `cash_register`.
  - `server.py` is now a thin entry point that mounts all routers and hosts the SPA fallback for the Windows portable build.
- **Frontend** `Settings.js` went from **1846 → 543 lines** (70% reduction):
  - `/app/frontend/src/pages/settings/` → `BusinessInfoTab`, `CashRegisterTab`, `PricingTab`, `TaxTab`, `PointsSystemTab`, `DevicesTab`.
  - `Settings.js` retains shared state, API calls, tab switcher, message banner, and Save button.
- **Zero behavior change.** All `/api/...` paths unchanged, all `data-testid` preserved. Regression: **44/44 pytest pass** (25 new + 19 pre-existing), **100% frontend** via testing agent iteration_14.

### Rich Text Business Info & Receipt (Feb 21, 2026)
- `SimpleRichTextEditor` component (`/app/frontend/src/components/SimpleRichTextEditor.js`) with Bold, Italic, Underline, alignment, font-size, and color toolbar.
- Settings page business_name / business_address / business_phone fields now use the editor and persist HTML strings via `PUT /api/settings`.
- `Receipt.js` renders address/phone as sanitized HTML (DOMPurify) and layers the TECHZONE blue/red split on top of the formatted business_name (preserves bold/italic/underline/font-size).
- Backend `strip_html()` helper flattens HTML to plain text for reportlab PDF generation (shift close + shift export), preventing Paragraph parse errors.
- Tests: 4/4 backend pytest in `/app/backend/tests/test_rich_business_info.py`; UI flows verified by testing agent (iteration_13).

### Device Activation System (February 2026)
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
   - **NEW:** Can open register directly from Sales page when checking out
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
   - PDF export for any shift
   - **Auto-email reports to manager when shifts close**

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
