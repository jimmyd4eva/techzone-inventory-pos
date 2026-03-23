@echo off
echo ================================================
echo TechZone POS - Desktop Package Creator
echo ================================================
echo.
echo This script will create a complete desktop package
echo that you can run on any Windows computer.
echo.

:: Create the package directory
set PACKAGE_DIR=TechZone-POS-Desktop
if exist %PACKAGE_DIR% rmdir /s /q %PACKAGE_DIR%
mkdir %PACKAGE_DIR%
mkdir %PACKAGE_DIR%\backend
mkdir %PACKAGE_DIR%\frontend
mkdir %PACKAGE_DIR%\data

:: Copy backend files
echo [1/6] Copying backend files...
copy /Y ..\backend\server.py %PACKAGE_DIR%\backend\
copy /Y ..\backend\database.py %PACKAGE_DIR%\backend\
copy /Y ..\backend\requirements-desktop.txt %PACKAGE_DIR%\backend\requirements.txt

:: Create backend .env for desktop
echo [2/6] Creating configuration...
(
echo DB_TYPE=mongodb
echo MONGO_URL=mongodb://localhost:27017
echo DB_NAME=techzone_desktop
echo EMAIL_ADDRESS=zonetech4eva@gmail.com
echo EMAIL_PASSWORD=
) > %PACKAGE_DIR%\backend\.env

:: Build frontend
echo [3/6] Building frontend (this may take a few minutes)...
cd ..\frontend
call yarn build
cd ..\desktop_build

:: Copy frontend build
echo [4/6] Copying frontend build...
xcopy /E /I /Y ..\frontend\build %PACKAGE_DIR%\frontend

:: Update frontend env for desktop
echo REACT_APP_BACKEND_URL=http://localhost:8001> %PACKAGE_DIR%\frontend\.env

:: Create start script
echo [5/6] Creating start scripts...
(
echo @echo off
echo echo ================================================
echo echo TechZone POS - Starting...
echo echo ================================================
echo echo.
echo echo Make sure MongoDB is running first!
echo echo.
echo echo Starting Backend...
echo cd backend
echo start "TechZone Backend" cmd /k "python -m uvicorn server:app --host 0.0.0.0 --port 8001"
echo cd ..
echo.
echo timeout /t 3 /nobreak ^> nul
echo.
echo echo Starting Frontend...
echo cd frontend
echo start "TechZone Frontend" cmd /k "npx serve -s . -l 3000"
echo cd ..
echo.
echo timeout /t 3 /nobreak ^> nul
echo.
echo echo.
echo echo ================================================
echo echo TechZone POS is running!
echo echo ================================================
echo echo.
echo echo Open your browser to: http://localhost:3000
echo echo.
echo echo Press any key to open the browser...
echo pause ^> nul
echo start http://localhost:3000
) > %PACKAGE_DIR%\START.bat

:: Create setup script
(
echo @echo off
echo echo ================================================
echo echo TechZone POS - First Time Setup
echo echo ================================================
echo echo.
echo echo This will install all required dependencies.
echo echo.
echo echo [1/3] Installing backend dependencies...
echo cd backend
echo pip install -r requirements.txt
echo cd ..
echo echo.
echo echo [2/3] Installing frontend server...
echo npm install -g serve
echo echo.
echo echo [3/3] Setup complete!
echo echo.
echo echo You can now run START.bat to launch the application.
echo echo.
echo pause
) > %PACKAGE_DIR%\SETUP.bat

:: Create README
echo [6/6] Creating README...
(
echo ================================================
echo TechZone POS - Desktop Edition
echo ================================================
echo.
echo REQUIREMENTS:
echo - Python 3.10+ (python.org^)
echo - Node.js 18+ (nodejs.org^)
echo - MongoDB Community Server (mongodb.com^)
echo.
echo FIRST TIME SETUP:
echo 1. Install Python, Node.js, and MongoDB
echo 2. Start MongoDB service
echo 3. Run SETUP.bat to install dependencies
echo 4. Run START.bat to launch the application
echo.
echo DAILY USE:
echo 1. Make sure MongoDB is running
echo 2. Run START.bat
echo 3. Browser opens to http://localhost:3000
echo.
echo LOGIN:
echo Username: admin
echo Password: admin123
echo.
echo DATA:
echo All data is stored in MongoDB database 'techzone_desktop'
echo.
echo SUPPORT:
echo For help, contact support@techzone.com
) > %PACKAGE_DIR%\README.txt

echo.
echo ================================================
echo Package Created Successfully!
echo ================================================
echo.
echo The package is in: %PACKAGE_DIR%
echo.
echo To use:
echo 1. Copy the %PACKAGE_DIR% folder to the target computer
echo 2. Install Python, Node.js, and MongoDB
echo 3. Run SETUP.bat (first time only)
echo 4. Run START.bat to launch
echo.
pause
