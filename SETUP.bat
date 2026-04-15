@echo off
title TechZone POS - Setup
color 0A

echo.
echo ========================================
echo   TechZone POS - SETUP
echo ========================================
echo.
echo This will install all required packages.
echo.
echo Prerequisites needed:
echo   - Python (with PATH checked)
echo   - Node.js
echo   - MongoDB (as Windows service)
echo.
pause

REM Go to script folder
cd /d "%~dp0"

echo.
echo ----------------------------------------
echo Step 1: Checking Python...
echo ----------------------------------------
py --version
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Python not found!
    echo Download from: https://www.python.org/downloads/
    echo CHECK "Add Python to PATH" during install!
    echo.
    pause
    exit /b 1
)
echo Python OK!
echo.

echo ----------------------------------------
echo Step 2: Checking Node.js...
echo ----------------------------------------
node --version
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Node.js not found!
    echo Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo Node.js OK!
echo.

echo ----------------------------------------
echo Step 3: Installing Backend Packages...
echo ----------------------------------------
cd /d "%~dp0backend"
py -m pip install fastapi uvicorn motor pymongo python-dotenv pydantic passlib bcrypt python-jose python-multipart aiosqlite reportlab PyJWT pillow aiofiles
echo.
echo Backend packages installed!
echo.

echo ----------------------------------------
echo Step 4: Email Configuration (for Device Activation)
echo ----------------------------------------
echo.
echo To send activation codes, you need a Gmail account with App Password.
echo.
echo How to get Gmail App Password:
echo   1. Go to https://myaccount.google.com/apppasswords
echo   2. Select "Mail" and "Windows Computer"
echo   3. Copy the 16-character password
echo.
set /p USER_EMAIL="Enter your Gmail address (or press Enter to skip): "
if "%USER_EMAIL%"=="" (
    set USER_EMAIL=
    set USER_PASSWORD=
    echo Skipping email setup. You can configure later in backend\.env
) else (
    set /p USER_PASSWORD="Enter your Gmail App Password: "
)
echo.

echo ----------------------------------------
echo Step 5: Creating Backend Config...
echo ----------------------------------------
cd /d "%~dp0backend"
(
echo MONGO_URL=mongodb://localhost:27017
echo DB_NAME=salestax
echo JWT_SECRET=techzone-local-secret-2024
echo EMAIL_ADDRESS=%USER_EMAIL%
echo EMAIL_PASSWORD=%USER_PASSWORD%
) > .env
echo Created backend\.env
echo.

echo ----------------------------------------
echo Step 6: Creating Frontend Config...
echo ----------------------------------------
cd /d "%~dp0frontend"
(
echo REACT_APP_BACKEND_URL=http://127.0.0.1:8001
) > .env
echo Created frontend\.env
echo.

echo ----------------------------------------
echo Step 7: Installing Frontend Packages...
echo ----------------------------------------
echo This may take a few minutes...
cd /d "%~dp0frontend"
call npm install --legacy-peer-deps --no-audit
echo.
echo Frontend packages installed!
echo.

cd /d "%~dp0"

echo.
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo To start the app: Double-click START.bat
echo.
echo   URL: http://localhost:3000
echo.
echo   Device activation will be required on first use.
echo   An activation code will be sent to your email.
echo.
echo ========================================
echo.
pause
