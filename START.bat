@echo off
title TechZone POS Launcher
echo ==========================================
echo   TechZone POS - Starting...
echo ==========================================
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
start "TechZone Backend" cmd /k "py -m uvicorn server:app --host 127.0.0.1 --port 8001"
cd /d "%~dp0"

:: Wait for backend
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

:: Start Frontend
echo Starting Frontend...
cd /d "%~dp0frontend"
start "TechZone Frontend" cmd /k "npm start"
cd /d "%~dp0"

echo.
echo ==========================================
echo   TechZone POS is starting!
echo   
echo   App will open at: http://localhost:3000
echo   Login: admin / admin123
echo.
echo   Keep the command windows open!
echo   Close them to stop the app.
echo ==========================================
echo.
echo NEW FEATURES:
echo   - Cash Register (Settings tab)
echo   - Dual Pricing (Retail/Wholesale)
echo   - PDF Reports
echo.
pause
