# TechZone POS - Local Setup Guide

## Prerequisites (One-time Install)

### 1. Install Python
- Download from: https://www.python.org/downloads/
- **Important:** Check "Add Python to PATH" during install

### 2. Install Node.js
- Download from: https://nodejs.org/
- Use the LTS version

### 3. Install MongoDB
- Download from: https://www.mongodb.com/try/download/community
- Select: Windows, MSI package
- During install: Check "Install MongoDB as a Service"
- MongoDB will start automatically

### 4. Install Python Packages (run once in Command Prompt)
```bash
cd "C:\path\to\techzone-inventory-pos\backend"
py -m pip install fastapi uvicorn motor pymongo python-dotenv pydantic passlib bcrypt python-jose python-multipart aiosqlite reportlab PyJWT pillow
```

### 5. Install Frontend Packages (run once in Command Prompt)
```bash
cd "C:\path\to\techzone-inventory-pos\frontend"
npm install --legacy-peer-deps --no-audit
```

### 6. Create Frontend .env File
Create file: `frontend\.env` with content:
```
REACT_APP_BACKEND_URL=http://127.0.0.1:8001
```

---

## Running the App (Every Time)

### Option 1: Double-click START.bat
Just double-click `START.bat` in the project folder. Done!

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd "C:\path\to\techzone-inventory-pos\backend"
set MONGO_URL=mongodb://localhost:27017
set DB_NAME=salestax
set JWT_SECRET=techzone-local-secret-key-2024
py -m uvicorn server:app --host 127.0.0.1 --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd "C:\path\to\techzone-inventory-pos\frontend"
npm start
```

---

## Access the App

- **URL:** http://localhost:3000
- **Login:** admin / admin123

---

## Features Available

### Core Features
- Inventory Management
- Customer Management  
- Sales & Checkout
- Coupons & Discounts
- Loyalty Points System

### Cash Register (NEW)
- Open/Close shifts from Settings → Cash Register tab
- Track cash sales automatically
- Record payouts, drops, and refunds
- View shift history with variance reports
- Export PDF reports for any shift
- **Quick Access:** Can also open register from Sales page

### Dual Pricing (NEW)
- Set retail vs wholesale prices
- Cash discount / Card surcharge
- Auto-applies based on customer type

### Device Activation
- First-time activation required (cloud version)
- Local version works without activation

---

## Enable Email Reports (Optional)

To receive shift reports via email when closing shifts:

1. Create a Gmail App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Generate a new app password for "Mail"

2. Add to `START.bat`:
```batch
set EMAIL_ADDRESS=your-email@gmail.com
set EMAIL_PASSWORD=your-app-password
```

3. In the app: Settings → Cash Register → Enable "Auto-Email Reports"

---

## Create Desktop Shortcut with Icon

1. Right-click `START.bat` → **Create shortcut**
2. Right-click shortcut → **Properties**
3. Click **Change Icon** → Browse to `SalesTax.ico`
4. Click **OK**
5. Rename shortcut to "TechZone POS"
6. Move to Desktop

---

## Troubleshooting

### "Port already in use" error
- Close all Command Prompt windows and try again
- Or run: `netstat -ano | findstr :8001` to find the process
- Then: `taskkill /PID <process_id> /F`

### "Module not found" error
- Run the pip install command again (Step 4)
- Make sure you're using `py` not `python`

### Can't login
- Make sure MongoDB is running (check Windows Services)
- Make sure backend shows "Uvicorn running on http://127.0.0.1:8001"
- Default credentials: admin / admin123

### Frontend not connecting
- Check `frontend\.env` has: `REACT_APP_BACKEND_URL=http://127.0.0.1:8001`
- Restart frontend after changing .env

### Cash Register not working
- Make sure to open a shift first (Settings → Cash Register)
- Or use the "Open Register" button on the Sales page

---

## File Locations

- **Launcher:** `START.bat`
- **Icon:** `SalesTax.ico`
- **Backend:** `backend\`
- **Frontend:** `frontend\`

---

## Cloud Version

The cloud version is available at:
- **URL:** https://device-lock-1.preview.emergentagent.com
- **Login:** admin / admin123

Note: Cloud version requires device activation on first use.
