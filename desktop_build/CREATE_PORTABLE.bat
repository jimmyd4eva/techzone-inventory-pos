@echo off
echo ================================================
echo TechZone POS - Portable Package Creator
echo ================================================
echo.
echo This will create a portable package with:
echo - Embedded Python (portable)
echo - Embedded MongoDB (portable)
echo - Pre-built Frontend
echo - All dependencies included
echo.
echo The final package can be copied to any Windows PC
echo and run without installing anything.
echo.
pause

:: Create package directory
set PKG=TechZone-POS-Portable
if exist %PKG% rmdir /s /q %PKG%
mkdir %PKG%
mkdir %PKG%\python
mkdir %PKG%\mongodb
mkdir %PKG%\mongodb\data
mkdir %PKG%\backend
mkdir %PKG%\frontend
mkdir %PKG%\data

echo.
echo [1/7] Downloading Python Embedded...
echo Downloading from python.org...
curl -L -o python.zip "https://www.python.org/ftp/python/3.11.7/python-3.11.7-embed-amd64.zip"
tar -xf python.zip -C %PKG%\python
del python.zip

:: Get pip for embedded python
echo.
echo [2/7] Installing pip...
curl -L -o %PKG%\python\get-pip.py "https://bootstrap.pypa.io/get-pip.py"
%PKG%\python\python.exe %PKG%\python\get-pip.py --no-warn-script-location
del %PKG%\python\get-pip.py

:: Fix python path for imports
echo import site>> %PKG%\python\python311._pth

echo.
echo [3/7] Installing Python packages...
%PKG%\python\python.exe -m pip install --target=%PKG%\python\Lib\site-packages fastapi uvicorn pydantic aiosqlite python-multipart --no-warn-script-location

echo.
echo [4/7] Downloading MongoDB...
echo Downloading MongoDB Community Server (portable)...
curl -L -o mongodb.zip "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.5.zip"
tar -xf mongodb.zip
move mongodb-win32-x86_64-windows-7.0.5\bin %PKG%\mongodb\bin
rmdir /s /q mongodb-win32-x86_64-windows-7.0.5
del mongodb.zip

echo.
echo [5/7] Copying backend...
copy /Y ..\backend\server.py %PKG%\backend\
copy /Y ..\backend\database.py %PKG%\backend\

:: Create backend .env
(
echo DB_TYPE=mongodb
echo MONGO_URL=mongodb://localhost:27017
echo DB_NAME=techzone_pos
echo EMAIL_ADDRESS=zonetech4eva@gmail.com
echo EMAIL_PASSWORD=
) > %PKG%\backend\.env

echo.
echo [6/7] Building and copying frontend...
cd ..\frontend
call yarn build
cd ..\desktop_build
xcopy /E /I /Y ..\frontend\build %PKG%\frontend

:: Create .env for frontend (empty = relative URLs)
echo REACT_APP_BACKEND_URL=http://localhost:8001> %PKG%\frontend\.env

echo.
echo [7/7] Creating launcher scripts...

:: Create START.bat
(
echo @echo off
echo title TechZone POS
echo echo ================================================
echo echo TechZone POS - Starting...
echo echo ================================================
echo echo.
echo.
echo :: Set paths
echo set ROOT=%%~dp0
echo set PATH=%%ROOT%%python;%%ROOT%%mongodb\bin;%%PATH%%
echo.
echo :: Start MongoDB
echo echo Starting MongoDB...
echo if not exist "%%ROOT%%mongodb\data" mkdir "%%ROOT%%mongodb\data"
echo start /B "" "%%ROOT%%mongodb\bin\mongod.exe" --dbpath "%%ROOT%%mongodb\data" --port 27017
echo.
echo :: Wait for MongoDB
echo timeout /t 3 /nobreak ^> nul
echo.
echo :: Start Backend
echo echo Starting Backend Server...
echo cd /d "%%ROOT%%backend"
echo start /B "" "%%ROOT%%python\python.exe" -m uvicorn server:app --host 127.0.0.1 --port 8001
echo.
echo :: Wait for Backend
echo timeout /t 3 /nobreak ^> nul
echo.
echo :: Open Browser
echo echo.
echo echo ================================================
echo echo TechZone POS is running!
echo echo ================================================
echo echo.
echo echo Opening browser to http://localhost:8001
echo echo.
echo echo Login: admin / admin123
echo echo.
echo echo DO NOT CLOSE THIS WINDOW while using the app.
echo echo Close this window to stop all services.
echo echo ================================================
echo.
echo start http://localhost:8001
echo.
echo :: Keep window open
echo pause ^> nul
) > %PKG%\START.bat

:: Create STOP.bat
(
echo @echo off
echo echo Stopping TechZone POS...
echo taskkill /F /IM mongod.exe 2^>nul
echo taskkill /F /IM python.exe 2^>nul
echo echo Done.
echo timeout /t 2
) > %PKG%\STOP.bat

:: Create README
(
echo ================================================
echo TechZone POS - Portable Edition
echo ================================================
echo.
echo HOW TO USE:
echo -----------
echo 1. Double-click START.bat
echo 2. Wait for browser to open
echo 3. Login with: admin / admin123
echo.
echo TO STOP:
echo --------
echo Close the black command window, or run STOP.bat
echo.
echo DATA LOCATION:
echo --------------
echo - Database: mongodb\data\
echo - Uploads: data\uploads\
echo.
echo REQUIREMENTS:
echo -------------
echo - Windows 10 or later
echo - No installation needed!
echo.
echo TROUBLESHOOTING:
echo ----------------
echo If the app doesn't start:
echo 1. Make sure no other app is using port 8001 or 27017
echo 2. Try running START.bat as Administrator
echo 3. Check if Windows Firewall is blocking
echo.
echo SUPPORT:
echo --------
echo Contact: support@techzone.com
) > %PKG%\README.txt

echo.
echo ================================================
echo Portable Package Created Successfully!
echo ================================================
echo.
echo Location: %PKG%\
echo.
echo To use:
echo 1. Copy the entire '%PKG%' folder anywhere
echo 2. Double-click START.bat
echo 3. Login: admin / admin123
echo.
echo Package size: 
dir /s %PKG% | find "File(s)"
echo.
pause
