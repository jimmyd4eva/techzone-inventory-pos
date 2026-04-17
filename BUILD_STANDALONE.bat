@echo off
title TechZone POS - Build Standalone Package
color 0B

echo.
echo ========================================================
echo   TechZone POS - Standalone Package Builder
echo ========================================================
echo.
echo This will create a fully portable package with:
echo   - Embedded Python (no install needed)
echo   - Embedded MongoDB (no install needed)
echo   - Pre-built Frontend (no Node.js needed)
echo   - All dependencies included
echo.
echo ========================================================
echo.
pause

cd /d "%~dp0"

set PKG=TechZone-POS-Standalone
set PYTHON_VERSION=3.11.9
set MONGO_VERSION=7.0.5

echo.
echo [1/8] Creating package folder...
if exist %PKG% rmdir /s /q %PKG%
mkdir %PKG%
mkdir %PKG%\python
mkdir %PKG%\mongodb
mkdir %PKG%\mongodb\data
mkdir %PKG%\backend
mkdir %PKG%\frontend

echo.
echo [2/8] Downloading Embedded Python...
echo       (This may take a few minutes)
curl -L -o python.zip "https://www.python.org/ftp/python/%PYTHON_VERSION%/python-%PYTHON_VERSION%-embed-amd64.zip"
tar -xf python.zip -C %PKG%\python
del python.zip

echo.
echo [3/8] Downloading get-pip...
curl -L -o %PKG%\python\get-pip.py "https://bootstrap.pypa.io/get-pip.py"

echo.
echo [4/8] Configuring Python for pip...
echo import site >> %PKG%\python\python311._pth
%PKG%\python\python.exe %PKG%\python\get-pip.py --no-warn-script-location
del %PKG%\python\get-pip.py

echo.
echo [5/8] Installing Python packages...
%PKG%\python\python.exe -m pip install --no-warn-script-location fastapi uvicorn motor pymongo python-dotenv pydantic bcrypt python-jose python-multipart aiosqlite reportlab PyJWT pillow aiofiles

echo.
echo [6/8] Downloading MongoDB...
echo       (This may take a few minutes)
curl -L -o mongodb.zip "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-%MONGO_VERSION%.zip"
tar -xf mongodb.zip
move mongodb-win32-x86_64-windows-%MONGO_VERSION%\bin\* %PKG%\mongodb\
rmdir /s /q mongodb-win32-x86_64-windows-%MONGO_VERSION%
del mongodb.zip

echo.
echo [7/8] Copying application files...
xcopy /E /I /Y backend %PKG%\backend
xcopy /E /I /Y frontend\build %PKG%\frontend\build

REM Copy icon
copy SalesTax.ico %PKG%\ 2>nul

echo.
echo [8/8] Creating startup scripts...

REM Create backend .env
(
echo MONGO_URL=mongodb://localhost:27017
echo DB_NAME=salestax
echo JWT_SECRET=techzone-standalone-2024
echo EMAIL_ADDRESS=
echo EMAIL_PASSWORD=
) > %PKG%\backend\.env

REM Create START.bat
(
echo @echo off
echo title TechZone POS
echo cd /d "%%~dp0"
echo.
echo echo Starting MongoDB...
echo start /B "" mongodb\mongod.exe --dbpath mongodb\data --port 27017
echo timeout /t 3 /nobreak ^>nul
echo.
echo echo Starting Backend...
echo start "TechZone Backend" cmd /k "cd backend && ..\python\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8001"
echo timeout /t 3 /nobreak ^>nul
echo.
echo echo Starting Frontend...
echo start http://127.0.0.1:8001
echo.
echo echo.
echo echo ========================================
echo echo   TechZone POS is running!
echo echo   URL: http://127.0.0.1:8001
echo echo   Login: admin / admin123
echo echo ========================================
echo pause
) > %PKG%\START.bat

REM Create STOP.bat
(
echo @echo off
echo echo Stopping TechZone POS...
echo taskkill /F /IM mongod.exe 2^>nul
echo taskkill /F /IM python.exe 2^>nul
echo echo Done.
echo timeout /t 2 ^>nul
) > %PKG%\STOP.bat

REM Create README
(
echo ========================================
echo   TechZone POS - Standalone Edition
echo ========================================
echo.
echo NO INSTALLATION REQUIRED!
echo.
echo To Start: Double-click START.bat
echo To Stop:  Double-click STOP.bat
echo.
echo URL: http://127.0.0.1:8001
echo Login: admin / admin123
echo.
echo ========================================
) > %PKG%\README.txt

echo.
echo ========================================================
echo   BUILD COMPLETE!
echo ========================================================
echo.
echo Your standalone package is in: %PKG%\
echo.
echo To distribute:
echo   1. Zip the %PKG% folder
echo   2. Share the zip file
echo   3. Users just extract and run START.bat
echo.
echo ========================================================
echo.
pause
