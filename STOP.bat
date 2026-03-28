@echo off
title TechZone POS - Stop Services
color 0C

echo.
echo ============================================================
echo    TechZone POS - Stopping Services
echo ============================================================
echo.

echo Stopping Backend (Python/Uvicorn)...
taskkill /F /FI "WINDOWTITLE eq TechZone Backend*" >nul 2>&1
taskkill /F /IM "python.exe" /FI "WINDOWTITLE eq TechZone*" >nul 2>&1

echo Stopping Frontend (Node/React)...
taskkill /F /FI "WINDOWTITLE eq TechZone Frontend*" >nul 2>&1
taskkill /F /IM "node.exe" /FI "WINDOWTITLE eq TechZone*" >nul 2>&1

echo.
echo ============================================================
echo    All TechZone POS services stopped.
echo ============================================================
echo.
echo Note: MongoDB service is still running (shared system service)
echo.

timeout /t 3 >nul
