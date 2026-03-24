@echo off
title TechZone POS - Portable Builder
echo ================================================
echo   TechZone POS - Portable Package Builder
echo ================================================
echo.

:: Check for required tools
echo Checking requirements...

where curl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: curl not found. Please use Windows 10 or later.
    pause
    exit /b 1
)

echo - curl: OK
echo.

:: Set package name
set PKG=TechZone-Portable

:: Clean old package
if exist %PKG% (
    echo Removing old package...
    rmdir /s /q %PKG%
)

:: Create directories
echo Creating directories...
mkdir %PKG%
mkdir %PKG%\python
mkdir %PKG%\mongodb
mkdir %PKG%\mongodb\data
mkdir %PKG%\backend
mkdir %PKG%\frontend
mkdir %PKG%\data

:: Download Python Embedded
echo.
echo [1/5] Downloading Python 3.11 (Embedded)...
curl -L -o python.zip "https://www.python.org/ftp/python/3.11.7/python-3.11.7-embed-amd64.zip"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to download Python
    pause
    exit /b 1
)
echo Extracting Python...
tar -xf python.zip -C %PKG%\python
del python.zip
echo Python: OK

:: Setup Python for pip
echo import site>> %PKG%\python\python311._pth

:: Download get-pip
echo.
echo [2/5] Setting up pip...
curl -L -o %PKG%\python\get-pip.py "https://bootstrap.pypa.io/get-pip.py"
%PKG%\python\python.exe %PKG%\python\get-pip.py --no-warn-script-location -q
del %PKG%\python\get-pip.py

:: Install Python packages
echo.
echo [3/5] Installing Python packages...
%PKG%\python\python.exe -m pip install -q --no-warn-script-location fastapi uvicorn[standard] pydantic motor python-dotenv python-multipart aiofiles bcrypt PyJWT passlib reportlab

:: Download MongoDB
echo.
echo [4/5] Downloading MongoDB 7.0...
curl -L -o mongodb.zip "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.5.zip"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to download MongoDB
    pause
    exit /b 1
)
echo Extracting MongoDB...
tar -xf mongodb.zip
xcopy /E /I /Y mongodb-win32-x86_64-windows-7.0.5\bin %PKG%\mongodb\bin >nul
rmdir /s /q mongodb-win32-x86_64-windows-7.0.5
del mongodb.zip
echo MongoDB: OK

:: Copy application files
echo.
echo [5/5] Copying application files...

:: Copy backend
if exist ..\backend\server.py (
    copy /Y ..\backend\server.py %PKG%\backend\ >nul
    echo - server.py: OK
)
if exist ..\backend\database.py (
    copy /Y ..\backend\database.py %PKG%\backend\ >nul
    echo - database.py: OK
)

:: Create backend .env
(
echo MONGO_URL=mongodb://localhost:27017
echo DB_NAME=techzone_pos
echo EMAIL_ADDRESS=zonetech4eva@gmail.com
echo EMAIL_PASSWORD=dkfwxlznsumfmgpw
) > %PKG%\backend\.env
echo - backend .env: OK

:: Copy frontend (if build exists)
if exist ..\frontend\build (
    xcopy /E /I /Y ..\frontend\build %PKG%\frontend >nul
    echo - frontend build: OK
) else (
    echo - frontend build: NOT FOUND
    echo   You need to build frontend first: cd frontend ^&^& yarn build
)

:: Create START.bat
(
echo @echo off
echo title TechZone POS
echo color 0A
echo.
echo ========================================
echo   TechZone POS - Starting Services
echo ========================================
echo.
echo.
echo SET ROOT=%%~dp0
echo SET PATH=%%ROOT%%python;%%ROOT%%python\Scripts;%%ROOT%%mongodb\bin;%%PATH%%
echo.
echo echo Starting MongoDB...
echo start "" /B "%%ROOT%%mongodb\bin\mongod.exe" --dbpath "%%ROOT%%mongodb\data" --port 27017
echo.
echo ping localhost -n 4 ^> nul
echo.
echo echo Starting Backend Server...
echo cd /d "%%ROOT%%backend"
echo start "" /B "%%ROOT%%python\python.exe" -m uvicorn server:app --host 0.0.0.0 --port 8001
echo.
echo ping localhost -n 3 ^> nul
echo.
echo echo.
echo echo ========================================
echo echo   TechZone POS is RUNNING
echo echo ========================================
echo echo.
echo echo   Open: http://localhost:8001
echo echo   Login: admin / admin123
echo echo.
echo echo   Keep this window open!
echo echo ========================================
echo.
echo start http://localhost:8001
echo.
echo pause ^>nul
) > %PKG%\START.bat

:: Create STOP.bat
(
echo @echo off
echo echo Stopping services...
echo taskkill /F /IM mongod.exe 2^>nul
echo taskkill /F /IM python.exe 2^>nul
echo echo Done.
echo pause
) > %PKG%\STOP.bat

:: Create README
(
echo ========================================
echo   TechZone POS - Portable Edition
echo ========================================
echo.
echo QUICK START:
echo   1. Double-click START.bat
echo   2. Browser opens automatically
echo   3. Login: admin / admin123
echo.
echo TO STOP:
echo   Run STOP.bat or close the black window
echo.
echo NO INSTALLATION REQUIRED!
echo Just copy this folder anywhere and run.
echo.
) > %PKG%\README.txt

echo.
echo ================================================
echo   BUILD COMPLETE!
echo ================================================
echo.
echo Package created: %PKG%\
echo.
echo To use:
echo   1. Copy '%PKG%' folder to any Windows PC
echo   2. Double-click START.bat
echo   3. Login: admin / admin123
echo.
pause
