# SalesTax POS - Local Setup Guide

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
cd "C:\Users\Unlocker\Documents\GitHub\Techzone inventory\techzone-inventory-pos\backend"
py -m pip install fastapi uvicorn motor pymongo python-dotenv pydantic passlib bcrypt python-jose python-multipart aiosqlite reportlab PyJWT
```

### 5. Install Frontend Packages (run once in Command Prompt)
```bash
cd "C:\Users\Unlocker\Documents\GitHub\Techzone inventory\techzone-inventory-pos\frontend"
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
cd "C:\Users\Unlocker\Documents\GitHub\Techzone inventory\techzone-inventory-pos\backend"
set MONGO_URL=mongodb://localhost:27017
set DB_NAME=salestax
set JWT_SECRET=secret123
py -m uvicorn server:app --host 127.0.0.1 --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd "C:\Users\Unlocker\Documents\GitHub\Techzone inventory\techzone-inventory-pos\frontend"
npm start
```

---

## Access the App

- **URL:** http://localhost:3000
- **Login:** admin / admin123

---

## Create Desktop Shortcut with Icon

1. Right-click `START.bat` → **Create shortcut**
2. Right-click shortcut → **Properties**
3. Click **Change Icon** → Browse to `SalesTax.ico`
4. Click **OK**
5. Rename shortcut to "SalesTax POS"
6. Move to Desktop

---

## Troubleshooting

### "Port already in use" error
- Close all Command Prompt windows and try again

### "Module not found" error
- Run the pip install command again (Step 4)

### Can't login
- Make sure MongoDB is running (check Services)
- Make sure backend shows "Uvicorn running on http://127.0.0.1:8001"

### Frontend not connecting
- Check `frontend\.env` has: `REACT_APP_BACKEND_URL=http://127.0.0.1:8001`
- Restart frontend after changing .env

---

## File Locations

- **Project:** `C:\Users\Unlocker\Documents\GitHub\Techzone inventory\techzone-inventory-pos`
- **Launcher:** `START.bat`
- **Icon:** `SalesTax.ico`
- **Backend:** `backend\`
- **Frontend:** `frontend\`

---

## Cloud Version

The cloud version is still available at:
- **URL:** https://salestax.preview.emergentagent.com
- **Login:** admin / admin123
