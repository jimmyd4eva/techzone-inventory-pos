# TechZone POS - Installer Build Guide

## Step 1: Install Inno Setup

Download and install from: https://jrsoftware.org/isdl.php

## Step 2: Prepare Files

Make sure your project folder has:
```
📁 techzone-inventory-pos
├── backend\
│   └── server.py
│   └── (other backend files)
├── frontend\
│   └── src\
│   └── public\
│   └── package.json
├── START.bat
├── STOP.bat
├── SETUP.bat
├── SalesTax.ico
├── TechZone-POS-Installer.iss   ← Installer script
```

## Step 3: Build the Installer

1. Open **Inno Setup Compiler**
2. Click **File → Open**
3. Select `TechZone-POS-Installer.iss`
4. Click **Build → Compile** (or press F9)
5. Wait for compilation to complete

## Step 4: Find Your Installer

The installer will be created at:
```
📁 techzone-inventory-pos
└── installer_output\
    └── TechZone-POS-Setup-1.0.0.exe
```

## Step 5: Distribute

Share `TechZone-POS-Setup-1.0.0.exe` with users.

---

## What the Installer Does

1. ✅ Copies all application files to Program Files
2. ✅ Creates Start Menu shortcuts
3. ✅ Creates Desktop shortcut (optional)
4. ✅ Creates config files (.env)
5. ✅ Checks for Python and Node.js
6. ✅ Offers to run first-time setup
7. ✅ Provides uninstaller

---

## Prerequisites for End Users

Users must have these installed BEFORE running the installer:
- Python 3.10+ (with "Add to PATH" checked)
- Node.js LTS
- MongoDB Community Edition (as Windows service)

---

## Notes

- The installer creates a proper Windows uninstaller
- App installs to: `C:\Program Files\TechZone POS\`
- Shortcuts created in Start Menu and Desktop
- Config files are created automatically
