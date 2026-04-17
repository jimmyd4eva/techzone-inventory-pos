@echo off
title TechZone POS - Build Portable Package
color 0B

echo.
echo ========================================================
echo   TechZone POS - Portable Package Builder
echo ========================================================
echo.
echo This creates a portable package with:
echo   - Embedded Python
echo   - Embedded MongoDB  
echo   - Pre-built React Frontend
echo   - All dependencies included
echo.
echo PREREQUISITE: Run "npm run build" in frontend folder first!
echo.
echo ========================================================
pause

cd /d "%~dp0"

set PKG=TechZone-Portable

echo.
echo [1/7] Checking for frontend build...
if not exist "frontend\build\index.html" (
    echo.
    echo ERROR: Frontend not built!
    echo Please run these commands first:
    echo   cd frontend
    echo   npm run build
    echo.
    pause
    exit /b 1
)
echo Frontend build found!

echo.
echo [2/7] Creating package folder...
if exist %PKG% rmdir /s /q %PKG%
mkdir %PKG%
mkdir %PKG%\python
mkdir %PKG%\mongodb
mkdir %PKG%\mongodb\data
mkdir %PKG%\backend
mkdir %PKG%\frontend

echo.
echo [3/7] Downloading Embedded Python 3.11...
curl -L -o python.zip "https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to download Python
    pause
    exit /b 1
)
tar -xf python.zip -C %PKG%\python
del python.zip

echo.
echo [4/7] Setting up pip...
curl -L -o %PKG%\python\get-pip.py "https://bootstrap.pypa.io/get-pip.py"
echo import site >> %PKG%\python\python311._pth
%PKG%\python\python.exe %PKG%\python\get-pip.py --no-warn-script-location -q
del %PKG%\python\get-pip.py

echo.
echo [5/7] Installing Python packages...
%PKG%\python\python.exe -m pip install -q --no-warn-script-location fastapi uvicorn motor pymongo python-dotenv pydantic bcrypt python-jose python-multipart reportlab PyJWT pillow aiofiles

echo.
echo [6/7] Downloading MongoDB...
curl -L -o mongodb.zip "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.5.zip"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to download MongoDB
    pause
    exit /b 1
)
tar -xf mongodb.zip
for /d %%i in (mongodb-*) do move "%%i\bin\mongod.exe" %PKG%\mongodb\
for /d %%i in (mongodb-*) do rmdir /s /q "%%i"
del mongodb.zip

echo.
echo [7/7] Copying application files...
xcopy /E /I /Y /Q backend\*.py %PKG%\backend\
xcopy /E /I /Y /Q backend\uploads %PKG%\backend\uploads\ 2>nul
xcopy /E /I /Y /Q frontend\build %PKG%\frontend\build\
copy SalesTax.ico %PKG%\ 2>nul

REM Create .env files
(
echo MONGO_URL=mongodb://localhost:27017
echo DB_NAME=techzone
echo JWT_SECRET=techzone-standalone-secret-2024
echo EMAIL_ADDRESS=
echo EMAIL_PASSWORD=
) > %PKG%\backend\.env

REM Create START.bat
(
echo @echo off
echo title TechZone POS
echo cd /d "%%~dp0"
echo color 0A
echo.
echo echo ========================================
echo echo   TechZone POS - Starting...
echo echo ========================================
echo.
echo echo Starting MongoDB...
echo if not exist mongodb\data mkdir mongodb\data
echo start /B "" mongodb\mongod.exe --dbpath mongodb\data --port 27017 --quiet
echo timeout /t 3 /nobreak ^>nul
echo.
echo echo Starting Server...
echo cd backend
echo start "" ..\python\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8001
echo cd ..
echo timeout /t 4 /nobreak ^>nul
echo.
echo echo Opening browser...
echo start http://127.0.0.1:8001
echo.
echo echo.
echo echo ========================================
echo echo   TechZone POS is RUNNING!
echo echo.
echo echo   URL: http://127.0.0.1:8001
echo echo   Login: admin / admin123
echo echo.
echo echo   Close this window to stop.
echo echo ========================================
echo.
echo pause
echo taskkill /F /IM mongod.exe ^>nul 2^>^&1
echo taskkill /F /IM python.exe ^>nul 2^>^&1
) > %PKG%\START.bat

REM Create README
(
echo ================================================
echo   TechZone POS - Portable Edition
echo ================================================
echo.
echo NO INSTALLATION REQUIRED!
echo Just extract and run START.bat
echo.
echo REQUIREMENTS: None! Everything is included.
echo.
echo TO RUN:
echo   Double-click START.bat
echo.
echo LOGIN:
echo   URL: http://127.0.0.1:8001
echo   Username: admin
echo   Password: admin123
echo.
echo TO STOP:
echo   Close the command window
echo.
echo ================================================
) > %PKG%\README.txt

echo.
echo ========================================================
echo   BUILD COMPLETE!
echo ========================================================
echo.
echo Portable package created in: %PKG%\
echo.
echo To distribute:
echo   1. Right-click %PKG% folder
echo   2. Send to ^> Compressed (zipped) folder
echo   3. Share TechZone-Portable.zip
echo.
echo Users just extract and run START.bat - nothing to install!
echo.
echo ========================================================
pause
