# TechZone POS - Local Windows Setup Guide

## One-Click Setup (Recommended)

### Prerequisites
Install these first:

1. **Python 3.10+** - https://www.python.org/downloads/
   - ⚠️ **IMPORTANT:** Check ✅ "Add Python to PATH" during installation

2. **Node.js LTS** - https://nodejs.org/
   - Download and install the LTS version

3. **MongoDB Community** - https://www.mongodb.com/try/download/community
   - Select: Windows, MSI package
   - ✅ Check "Install MongoDB as a Service"

### Setup & Run

**Just double-click `SETUP.bat`** - it will:
- Check all prerequisites
- Install all packages
- Create configuration files
- Offer to start the app

After first setup, use **`START.bat`** to run the app.

---

## Manual Setup (If Needed)

### Install Backend Packages
```cmd
cd backend
py -m pip install fastapi uvicorn[standard] motor pymongo python-dotenv pydantic passlib bcrypt python-jose python-multipart aiosqlite reportlab PyJWT pillow aiofiles
```

### Install Frontend Packages
```cmd
cd frontend
npm install --legacy-peer-deps --no-audit
```

### Create frontend\.env
```
REACT_APP_BACKEND_URL=http://127.0.0.1:8001
```

### Run Manually
**Terminal 1 (Backend):**
```cmd
cd backend
set MONGO_URL=mongodb://localhost:27017
set DB_NAME=salestax
set JWT_SECRET=techzone-local-secret-key-2024
py -m uvicorn server:app --host 127.0.0.1 --port 8001
```

**Terminal 2 (Frontend):**
```cmd
cd frontend
npm start
```

---

## Access the App

| | |
|---|---|
| **URL** | http://localhost:3000 |
| **Username** | admin |
| **Password** | admin123 |

---

## Available Scripts

| Script | Purpose |
|--------|---------|
| `SETUP.bat` | First-time setup (installs everything) |
| `START.bat` | Start the application |
| `STOP.bat` | Stop all services |

---

## Features

- ✅ Inventory Management
- ✅ Customer Management  
- ✅ Sales & Checkout
- ✅ **Cash Register** - Open/close shifts, track cash
- ✅ **Dual Pricing** - Retail/Wholesale, Cash/Card
- ✅ PDF Reports
- ✅ Loyalty Points
- ✅ Coupons & Discounts
- ✅ Tax Configuration
- ✅ Multi-user Support

**Note:** Local version does NOT require device activation!

---

## Enable Email Reports (Optional)

To receive shift reports via email:

1. Get a Gmail App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Create app password for "Mail"

2. Edit `backend\.env`:
   ```
   EMAIL_ADDRESS=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

3. In app: Settings → Cash Register → Enable "Auto-Email Reports"

---

## Troubleshooting

### "Python not found"
- Reinstall Python and check ✅ "Add Python to PATH"
- Or use full path: `C:\Users\YOU\AppData\Local\Programs\Python\Python311\python.exe`

### "Port already in use"
```cmd
netstat -ano | findstr :8001
taskkill /PID <number> /F
```
Or just close all command windows and retry.

### "Module not found"
```cmd
cd backend
py -m pip install <module-name>
```

### MongoDB won't start
- Open Services (services.msc)
- Find "MongoDB" 
- Right-click → Start

### Can't login
- Verify backend shows "Uvicorn running on http://127.0.0.1:8001"
- Check MongoDB service is running
- Default: admin / admin123

### Blank page or errors
- Check frontend\.env has: `REACT_APP_BACKEND_URL=http://127.0.0.1:8001`
- Restart frontend after changing .env

---

## Create Desktop Shortcut

1. Right-click `START.bat` → Create shortcut
2. Right-click shortcut → Properties → Change Icon
3. Browse to `SalesTax.ico`
4. Rename to "TechZone POS"
5. Move to Desktop

---

## Cloud Version

The cloud version is also available:
- **URL:** https://zero-tax-pos.emergent.host
- Requires device activation on first use
