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

:: Check for Python (try both python and py)
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    where py >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Python not found. Please install Python from https://python.org/
        echo Make sure to check "Add Python to PATH" during installation!
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)

echo Using Python: %PYTHON_CMD%
%PYTHON_CMD% --version

echo.
echo [1/5] Installing backend dependencies...
cd backend
%PYTHON_CMD% -m pip install -r requirements.txt -q
%PYTHON_CMD% -m pip install aiosqlite -q
cd ..

echo [2/5] Installing frontend dependencies...
cd frontend
call npm install --silent
cd ..

echo [3/5] Building frontend...
cd frontend
call npm run build
cd ..

echo [4/5] Copying frontend build to desktop...
if exist desktop\frontend-build rmdir /S /Q desktop\frontend-build
xcopy /E /I /Q frontend\build desktop\frontend-build

echo [5/5] Building Windows installer...
cd desktop
call npm install --silent
call npm run build:win
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
