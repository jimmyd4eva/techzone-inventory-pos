@echo off
title TechZone POS
color 0A

echo.
echo ========================================
echo   TechZone POS - Starting...
echo ========================================
echo.

REM Go to script folder
cd /d "%~dp0"

REM Set environment variables
set MONGO_URL=mongodb://localhost:27017
set DB_NAME=salestax
set JWT_SECRET=techzone-local-secret-2024

echo Starting Backend Server...
cd /d "%~dp0backend"
start "Backend" cmd /k "color 0E && title TechZone Backend && py -m uvicorn server:app --host 127.0.0.1 --port 8001"

echo Waiting 5 seconds...
timeout /t 5 /nobreak >nul

echo Starting Frontend...
cd /d "%~dp0frontend"
start "Frontend" cmd /k "color 0B && title TechZone Frontend && npm start"

cd /d "%~dp0"

echo.
echo ========================================
echo   TechZone POS is STARTING!
echo ========================================
echo.
echo   URL: http://localhost:3000
echo   Login: admin / admin123
echo.
echo   Keep BOTH windows open!
echo ========================================
echo.

echo Waiting for app to load...
timeout /t 10 /nobreak >nul

echo Opening browser...
start http://localhost:3000

echo.
echo Press any key to close this window...
pause >nul
