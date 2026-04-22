# Test Credentials

## Admin Login
- **Username:** `admin`
- **Password:** `admin123`

## Auth migration (Feb 21, 2026)
- `/api/auth/login` now sets an **httpOnly cookie** `techzone_token` (Secure; SameSite=lax; Max-Age=86400s) AND returns the legacy `{user, token}` JSON body.
- `get_current_user` accepts **either** the cookie OR `Authorization: Bearer <jwt>` header (backward compat during rollout).
- Frontend axios sends `withCredentials: true` globally, so cookies flow automatically.
- `/api/auth/logout` clears the cookie (returns 200 with `{"message":"Logged out"}`).
- For automated tests: either pass `-H "Authorization: Bearer $TOKEN"` (existing pattern) OR use a cookie jar (`curl -c /tmp/cj` then `-b /tmp/cj`).

## Device Activation Bypass (for automated testing)
Before loading the app, set:
```js
localStorage.setItem('device_id', 'TEST-DEVICE');
localStorage.setItem('device_activated', 'true');
```
The device `TEST-DEVICE` is seeded in `db.activated_devices`.
