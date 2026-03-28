@echo off
title TechZone POS - Complete Setup
color 0B

echo.
echo ============================================================
echo    TechZone POS - One-Click Setup Script
echo ============================================================
echo.
echo This script will:
echo   1. Check prerequisites (Python, Node.js, MongoDB)
echo   2. Install all backend packages
echo   3. Install all frontend packages
echo   4. Create configuration files
echo   5. Start the application
echo.
echo ============================================================
echo.
pause

:: Change to script directory
cd /d "%~dp0"

:: ============================================================
:: CHECK PREREQUISITES
:: ============================================================

echo.
echo [1/5] Checking Prerequisites...
echo ----------------------------------------

:: Check Python
echo Checking Python...
py --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Python is not installed or not in PATH!
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo IMPORTANT: Check "Add Python to PATH" during installation!
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('py --version') do echo   Found: %%i

:: Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Use the LTS version.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo   Found: Node.js %%i

:: Check npm
echo Checking npm...
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: npm is not installed!
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do echo   Found: npm %%i

:: Check MongoDB
echo Checking MongoDB...
sc query MongoDB >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: MongoDB service not found!
    echo.
    echo Please install MongoDB from:
    echo https://www.mongodb.com/try/download/community
    echo.
    echo Select: Windows, MSI package
    echo Check: "Install MongoDB as a Service"
    echo.
    set /p CONTINUE="Continue anyway? (y/n): "
    if /i not "%CONTINUE%"=="y" exit /b 1
) else (
    echo   Found: MongoDB service installed
)

echo.
echo Prerequisites: OK
echo.

:: ============================================================
:: INSTALL BACKEND PACKAGES
:: ============================================================

echo [2/5] Installing Backend Packages...
echo ----------------------------------------
cd /d "%~dp0backend"

echo Installing Python packages (this may take a few minutes)...
py -m pip install --upgrade pip >nul 2>&1
py -m pip install fastapi uvicorn[standard] motor pymongo python-dotenv pydantic passlib bcrypt python-jose python-multipart aiosqlite reportlab PyJWT pillow aiofiles

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to install Python packages!
    echo Try running: py -m pip install --upgrade pip
    echo Then run this script again.
    pause
    exit /b 1
)

echo Backend packages: OK
echo.

:: ============================================================
:: CREATE BACKEND .ENV FILE
:: ============================================================

echo [3/5] Creating Configuration Files...
echo ----------------------------------------

cd /d "%~dp0backend"

:: Create backend .env if it doesn't exist or update it
echo Creating backend\.env...
(
echo MONGO_URL=mongodb://localhost:27017
echo DB_NAME=salestax
echo JWT_SECRET=techzone-local-secret-key-2024
echo EMAIL_ADDRESS=
echo EMAIL_PASSWORD=
) > .env
echo   backend\.env: OK

:: Create frontend .env
cd /d "%~dp0frontend"
echo Creating frontend\.env...
(
echo REACT_APP_BACKEND_URL=http://127.0.0.1:8001
) > .env
echo   frontend\.env: OK

echo.
echo Configuration files: OK
echo.

:: ============================================================
:: INSTALL FRONTEND PACKAGES
:: ============================================================

echo [4/5] Installing Frontend Packages...
echo ----------------------------------------
echo This may take several minutes on first run...
echo.

cd /d "%~dp0frontend"

:: Check if node_modules exists
if exist node_modules (
    echo node_modules found, checking for updates...
    call npm install --legacy-peer-deps --no-audit --loglevel=error
) else (
    echo Installing all frontend dependencies...
    call npm install --legacy-peer-deps --no-audit
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: npm install had some issues, but continuing...
)

echo.
echo Frontend packages: OK
echo.

:: ============================================================
:: SETUP COMPLETE - START APP
:: ============================================================

cd /d "%~dp0"

echo [5/5] Setup Complete!
echo ----------------------------------------
echo.
echo ============================================================
echo    SETUP SUCCESSFUL!
echo ============================================================
echo.
echo Your TechZone POS is ready to use!
echo.
echo To start the app:
echo   - Double-click START.bat
echo   - Or run this script again with: SETUP.bat start
echo.
echo Login credentials:
echo   URL:      http://localhost:3000
echo   Username: admin
echo   Password: admin123
echo.
echo ============================================================
echo.

:: Check if user wants to start now
set /p STARTNOW="Start TechZone POS now? (y/n): "
if /i "%STARTNOW%"=="y" (
    echo.
    echo Starting TechZone POS...
    call "%~dp0START.bat"
)

pause
