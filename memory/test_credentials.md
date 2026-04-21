# Test Credentials

## Admin Login
- **Username:** `admin`
- **Password:** `admin123`

## Device Activation Bypass (for automated testing)
Before loading the app, set:
```js
localStorage.setItem('device_id', 'TEST-DEVICE');
localStorage.setItem('device_activated', 'true');
```
The device `TEST-DEVICE` is seeded in `db.activated_devices`.
