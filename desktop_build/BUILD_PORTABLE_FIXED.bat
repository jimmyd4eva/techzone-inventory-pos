@echo off
title TechZone POS - Portable Builder

:: IMPORTANT: Change to the script's directory first
cd /d "%~dp0"

echo ================================================
echo   TechZone POS - Portable Package Builder
echo ================================================
echo.
echo Current directory: %CD%
echo.

:: Verify we're in the right place
if not exist "..\frontend" (
    echo ERROR: Cannot find frontend folder.
    echo Make sure this script is in the 'desktop_build' folder
    echo inside your TechZone project.
    echo.
    pause
    exit /b 1
)

if not exist "..\backend" (
    echo ERROR: Cannot find backend folder.
    echo Make sure this script is in the 'desktop_build' folder
    echo inside your TechZone project.
    echo.
    pause
    exit /b 1
)

echo Project structure: OK
echo.

:: Check for curl
where curl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: curl not found. Please use Windows 10 or later.
    pause
    exit /b 1
)

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
echo [1/6] Downloading Python 3.11 (Embedded)...
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
echo [2/6] Setting up pip...
curl -L -o %PKG%\python\get-pip.py "https://bootstrap.pypa.io/get-pip.py"
%PKG%\python\python.exe %PKG%\python\get-pip.py --no-warn-script-location -q
del %PKG%\python\get-pip.py

:: Install Python packages
echo.
echo [3/6] Installing Python packages (this takes a few minutes)...
%PKG%\python\python.exe -m pip install -q --no-warn-script-location fastapi uvicorn[standard] pydantic motor python-dotenv python-multipart aiofiles bcrypt PyJWT passlib reportlab

:: Download MongoDB
echo.
echo [4/6] Downloading MongoDB 7.0 (300MB, please wait)...
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

:: Copy backend files
echo.
echo [5/6] Copying backend files...
copy /Y ..\backend\server.py %PKG%\backend\ >nul
if exist ..\backend\database.py copy /Y ..\backend\database.py %PKG%\backend\ >nul
echo - Backend files: OK

:: Create backend .env
(
echo MONGO_URL=mongodb://localhost:27017
echo DB_NAME=techzone_pos
echo EMAIL_ADDRESS=zonetech4eva@gmail.com
echo EMAIL_PASSWORD=dkfwxlznsumfmgpw
) > %PKG%\backend\.env
echo - Backend .env: OK

:: Build frontend if needed
echo.
echo [6/6] Building frontend...
cd ..\frontend

:: Check if node_modules exists
if not exist node_modules (
    echo Installing frontend dependencies...
    call yarn install
)

:: Build frontend
echo Building React app...
call yarn build

:: Copy build to package
cd ..\desktop_build
if exist ..\frontend\build (
    xcopy /E /I /Y ..\frontend\build %PKG%\frontend >nul
    echo - Frontend: OK
) else (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)

:: Create START.bat
(
echo @echo off
echo cd /d "%%~dp0"
echo title TechZone POS
echo color 0A
echo.
echo echo ========================================
echo echo   TechZone POS - Starting Services
echo echo ========================================
echo echo.
echo.
echo set ROOT=%%~dp0
echo set PATH=%%ROOT%%python;%%ROOT%%python\Scripts;%%ROOT%%mongodb\bin;%%PATH%%
echo.
echo echo Starting MongoDB...
echo start "" /B "%%ROOT%%mongodb\bin\mongod.exe" --dbpath "%%ROOT%%mongodb\data" --port 27017
echo.
echo timeout /t 4 /nobreak ^>nul
echo.
echo echo Starting Backend Server...
echo cd /d "%%ROOT%%backend"
echo start "" /B "%%ROOT%%python\python.exe" -m uvicorn server:app --host 0.0.0.0 --port 8001
echo.
echo timeout /t 3 /nobreak ^>nul
echo.
echo echo.
echo echo ========================================
echo echo   TechZone POS is RUNNING!
echo echo ========================================
echo echo.
echo echo   URL: http://localhost:8001
echo echo   Login: admin / admin123
echo echo.
echo echo   Keep this window open!
echo echo ========================================
echo echo.
echo start http://localhost:8001
echo.
echo pause ^>nul
) > %PKG%\START.bat

:: Create STOP.bat
(
echo @echo off
echo echo Stopping TechZone POS services...
echo taskkill /F /IM mongod.exe 2^>nul
echo taskkill /F /IM python.exe 2^>nul
echo echo Done.
echo timeout /t 2 ^>nul
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
echo   Close the black window, or run STOP.bat
echo.
echo NO INSTALLATION REQUIRED!
echo Just copy this folder anywhere and run.
echo.
echo Data is stored in: mongodb\data\
echo.
) > %PKG%\README.txt

echo.
echo ================================================
echo   BUILD COMPLETE!
echo ================================================
echo.
echo Package location: %CD%\%PKG%
echo.
echo To use on ANY Windows PC:
echo   1. Copy the '%PKG%' folder
echo   2. Double-click START.bat
echo   3. Login: admin / admin123
echo.
echo Package size:
dir %PKG% /s | findstr "File(s)"
echo.
pause
