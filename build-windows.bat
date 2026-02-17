@echo off
echo ==========================================
echo   SalesTax POS - Windows Installer Builder
echo ==========================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check for Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found. Please install Python from https://python.org/
    pause
    exit /b 1
)

echo [1/5] Installing backend dependencies...
cd backend
pip install -r requirements-desktop.txt -q
pip install aiosqlite -q
cd ..

echo [2/5] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo [3/5] Building frontend...
cd frontend
call node_modules\.bin\craco build
cd ..

echo [4/5] Copying frontend build to desktop...
if exist desktop\frontend-build rmdir /S /Q desktop\frontend-build
xcopy /E /I /Q frontend\build desktop\frontend-build

echo [5/5] Building Windows installer...
cd desktop
call npm install
call node_modules\.bin\electron-builder --win
cd ..

echo.
echo ==========================================
echo   BUILD COMPLETE!
echo ==========================================
echo.
echo Your installer is ready at:
echo   desktop\dist\SalesTax POS Setup*.exe
echo.
pause
