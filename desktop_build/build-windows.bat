@echo off
echo ================================================
echo TechZone POS - Windows Build Script
echo ================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.10+ from python.org
    pause
    exit /b 1
)

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from nodejs.org
    pause
    exit /b 1
)

echo [1/5] Creating virtual environment...
python -m venv venv
call venv\Scripts\activate

echo [2/5] Installing Python dependencies...
pip install --upgrade pip
pip install -r requirements-build.txt

echo [3/5] Building React frontend...
cd ..\frontend
call npm install
call npm run build
cd ..\desktop_build

echo [4/5] Copying frontend build...
xcopy /E /I /Y ..\frontend\build frontend

echo [5/5] Building executable with PyInstaller...
pyinstaller --clean TechZone-POS.spec

echo.
echo ================================================
echo Build Complete!
echo ================================================
echo.
echo The executable is in: dist\TechZone-POS.exe
echo.
echo To run:
echo   1. Copy the 'dist' folder to your desired location
echo   2. Double-click TechZone-POS.exe
echo.
pause
