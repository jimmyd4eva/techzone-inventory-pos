@echo off
title TechZone POS - Stop
color 0C

echo.
echo ========================================
echo   Stopping TechZone POS...
echo ========================================
echo.

taskkill /F /FI "WINDOWTITLE eq TechZone Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq TechZone Frontend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Frontend*" >nul 2>&1

echo Done! All services stopped.
echo.
timeout /t 2 >nul
