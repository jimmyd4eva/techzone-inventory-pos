@echo off
title TechZone POS
color 0A

:: Change to script directory
cd /d "%~dp0"

echo.
echo ============================================================
echo    TechZone POS - Starting Services
echo ============================================================
echo.

:: Check if MongoDB is running
echo Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting MongoDB service...
    net start MongoDB >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo WARNING: Could not start MongoDB service.
        echo Make sure MongoDB is installed as a service.
        echo.
        echo Trying to continue anyway...
    )
)
echo MongoDB: OK
echo.

:: Set environment variables
set MONGO_URL=mongodb://localhost:27017
set DB_NAME=salestax
set JWT_SECRET=techzone-local-secret-key-2024
set EMAIL_ADDRESS=
set EMAIL_PASSWORD=

:: Start Backend
echo Starting Backend Server...
cd /d "%~dp0backend"
start "TechZone Backend" cmd /k "title TechZone Backend && color 0E && py -m uvicorn server:app --host 127.0.0.1 --port 8001 --reload"
cd /d "%~dp0"

:: Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: Verify backend is running
curl -s http://127.0.0.1:8001/api/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Backend may still be starting, waiting a bit more...
    timeout /t 5 /nobreak >nul
)

:: Start Frontend
echo Starting Frontend...
cd /d "%~dp0frontend"
start "TechZone Frontend" cmd /k "title TechZone Frontend && color 0B && npm start"
cd /d "%~dp0"

:: Wait for frontend
echo Waiting for frontend to compile...
timeout /t 10 /nobreak >nul

echo.
echo ============================================================
echo    TechZone POS is RUNNING!
echo ============================================================
echo.
echo    URL:      http://localhost:3000
echo    Login:    admin / admin123
echo.
echo    Backend:  http://localhost:8001 (API)
echo    Frontend: http://localhost:3000 (App)
echo.
echo    Keep both command windows open!
echo    Close them to stop the application.
echo.
echo ============================================================
echo.
echo Features Available:
echo   - Inventory Management
echo   - Customer Management
echo   - Sales ^& Checkout
echo   - Cash Register (Settings tab)
echo   - Dual Pricing (Retail/Wholesale)
echo   - PDF Reports
echo   - Loyalty Points
echo   - Coupons
echo.
echo ============================================================
echo.

:: Try to open browser
echo Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo Press any key to close this window (app will keep running)...
pause >nul
