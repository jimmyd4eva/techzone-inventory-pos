@echo off
echo ================================================
echo TechZone POS - Simple Standalone Builder
echo ================================================
echo.
echo This will create a standalone .exe that includes
echo everything (no MongoDB required).
echo.
echo Prerequisites:
echo - Python 3.10+ with pip
echo - Node.js 18+ with npm/yarn
echo.
pause

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Install from python.org
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Install from nodejs.org
    pause
    exit /b 1
)

echo.
echo [1/5] Installing Python packages...
pip install pyinstaller fastapi uvicorn pydantic

echo.
echo [2/5] Building frontend...
cd ..\frontend
call yarn install
call yarn build
cd ..\desktop_build

echo.
echo [3/5] Copying frontend build...
if exist frontend rmdir /s /q frontend
xcopy /E /I /Y ..\frontend\build frontend

echo.
echo [4/5] Building executable...
pyinstaller --onefile --name TechZone-POS ^
    --add-data "frontend;frontend" ^
    --hidden-import uvicorn.logging ^
    --hidden-import uvicorn.loops ^
    --hidden-import uvicorn.loops.auto ^
    --hidden-import uvicorn.protocols ^
    --hidden-import uvicorn.protocols.http ^
    --hidden-import uvicorn.protocols.http.auto ^
    --hidden-import uvicorn.protocols.websockets ^
    --hidden-import uvicorn.protocols.websockets.auto ^
    --hidden-import uvicorn.lifespan ^
    --hidden-import uvicorn.lifespan.on ^
    standalone_server.py

echo.
echo [5/5] Cleaning up...
if exist build rmdir /s /q build
if exist __pycache__ rmdir /s /q __pycache__

echo.
echo ================================================
echo BUILD COMPLETE!
echo ================================================
echo.
echo Your executable is at: dist\TechZone-POS.exe
echo.
echo To run:
echo   1. Copy dist\TechZone-POS.exe anywhere
echo   2. Double-click to run
echo   3. Browser opens automatically
echo.
echo Login: admin / admin123
echo.
pause
