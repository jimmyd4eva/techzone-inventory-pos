@echo off
REM ============================================================
REM  TechZone POS - Portable Windows Build Script (v2)
REM ------------------------------------------------------------
REM  Produces:  TechZone-Portable\                (ready-to-run)
REM             TechZone-Portable-<version>.zip   (distributable)
REM
REM  The output folder is ZERO-INSTALL. Users extract and
REM  double-click START.bat — no admin rights required.
REM
REM  Bundled at build time:
REM    - Embedded Python 3.11 + all backend deps
REM    - Embedded MongoDB 7.0
REM    - Production React build (served by FastAPI on 127.0.0.1:8001)
REM    - Randomly-generated JWT secret (per-install)
REM    - Activation screen disabled (single-PC deployment)
REM
REM  Requires (on the BUILD machine only): Node 18+, yarn, curl, tar
REM ============================================================

setlocal enableextensions enabledelayedexpansion
title TechZone POS - Portable Build
color 0B
cd /d "%~dp0"

set VERSION=1.1.0
set PKG=TechZone-Portable
set PYVER=3.11.9
set MONGOVER=7.0.14

echo.
echo ========================================================
echo   TechZone POS - Portable Build v%VERSION%
echo ========================================================
echo   Embedded Python %PYVER% + MongoDB %MONGOVER%
echo ========================================================
echo.

REM ---------- Sanity checks ------------------------------------
where curl >nul 2>&1 || (echo [X] curl not found on PATH. Install curl or use Windows 10+. & exit /b 1)
where tar  >nul 2>&1 || (echo [X] tar not found on PATH.  Install tar or use Windows 10+.  & exit /b 1)
where yarn >nul 2>&1 || (echo [X] yarn not found on PATH. Run: npm install -g yarn        & exit /b 1)
if not exist "backend\server.py"   (echo [X] backend\server.py missing. Run from the repo root. & exit /b 1)
if not exist "frontend\package.json" (echo [X] frontend\package.json missing.                 & exit /b 1)

REM ---------- 1/8  Build the production React bundle -----------
echo [1/8] Building production frontend bundle...
pushd frontend
REM Empty backend URL -> SPA calls /api/... on same origin as the FastAPI server.
echo REACT_APP_BACKEND_URL=> .env.production
echo GENERATE_SOURCEMAP=false>> .env.production
call yarn install --frozen-lockfile || (echo [X] yarn install failed & popd & exit /b 1)
call yarn build || (echo [X] yarn build failed & popd & exit /b 1)
popd
if not exist "frontend\build\index.html" (
    echo [X] Frontend build missing frontend\build\index.html
    exit /b 1
)

REM ---------- 2/8  Clean / recreate package folder -------------
echo [2/8] Creating fresh package folder...
if exist "%PKG%" rmdir /s /q "%PKG%"
mkdir "%PKG%"
mkdir "%PKG%\python"
mkdir "%PKG%\mongodb"
mkdir "%PKG%\mongodb\data"
mkdir "%PKG%\mongodb\logs"
mkdir "%PKG%\backend"
mkdir "%PKG%\frontend\build"
mkdir "%PKG%\logs"

REM ---------- 3/8  Embedded Python ----------------------------
echo [3/8] Downloading embedded Python %PYVER%...
curl -sSL -o python.zip "https://www.python.org/ftp/python/%PYVER%/python-%PYVER%-embed-amd64.zip" || exit /b 1
tar -xf python.zip -C "%PKG%\python" || exit /b 1
del python.zip

REM Enable `import site` so pip-installed packages are discoverable.
REM (The embedded distribution disables site-packages by default.)
>  "%PKG%\python\python311._pth" echo python311.zip
>> "%PKG%\python\python311._pth" echo .
>> "%PKG%\python\python311._pth" echo Lib\site-packages
>> "%PKG%\python\python311._pth" echo import site

REM ---------- 4/8  pip + backend deps -------------------------
echo [4/8] Bootstrapping pip...
curl -sSL -o "%PKG%\python\get-pip.py" "https://bootstrap.pypa.io/get-pip.py" || exit /b 1
"%PKG%\python\python.exe" "%PKG%\python\get-pip.py" --no-warn-script-location -q || exit /b 1
del "%PKG%\python\get-pip.py"

echo      Installing backend requirements (this can take 3-5 minutes)...
"%PKG%\python\python.exe" -m pip install -q --no-warn-script-location ^
    -r backend\requirements.txt ^
    --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ ^
    || (echo [X] pip install failed & exit /b 1)

REM ---------- 5/8  Embedded MongoDB ---------------------------
echo [5/8] Downloading MongoDB %MONGOVER%...
curl -sSL -o mongodb.zip "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-%MONGOVER%.zip" || exit /b 1
tar -xf mongodb.zip || exit /b 1
for /d %%i in (mongodb-win*) do (
    move "%%i\bin\mongod.exe" "%PKG%\mongodb\" >nul
    rmdir /s /q "%%i"
)
del mongodb.zip

REM ---------- 6/8  Copy application payload -------------------
echo [6/8] Copying application files...
xcopy /E /I /Y /Q backend            "%PKG%\backend\"            >nul
xcopy /E /I /Y /Q frontend\build     "%PKG%\frontend\build\"     >nul
if exist SalesTax.ico copy /Y SalesTax.ico "%PKG%\" >nul

REM Strip dev-only junk the user doesn't need.
rmdir /s /q "%PKG%\backend\__pycache__"   2>nul
rmdir /s /q "%PKG%\backend\tests"         2>nul
rmdir /s /q "%PKG%\backend\migration_data" 2>nul
del /q "%PKG%\backend\.env"               2>nul

REM ---------- 7/8  Generate per-install config ----------------
echo [7/8] Generating fresh .env with random JWT secret...
REM Random 32-char hex secret. Uses embedded python (no external deps).
for /f "delims=" %%S in ('%PKG%\python\python.exe -c "import secrets;print(secrets.token_hex(32))"') do set JWT=%%S

> "%PKG%\backend\.env"  echo MONGO_URL=mongodb://127.0.0.1:27017
>>"%PKG%\backend\.env"  echo DB_NAME=techzone_pos
>>"%PKG%\backend\.env"  echo JWT_SECRET=!JWT!
>>"%PKG%\backend\.env"  echo COOKIE_SECURE=false
>>"%PKG%\backend\.env"  echo CORS_ORIGINS=*
>>"%PKG%\backend\.env"  echo ACTIVATION_DISABLED=true
>>"%PKG%\backend\.env"  echo EMAIL_ADDRESS=
>>"%PKG%\backend\.env"  echo EMAIL_PASSWORD=
>>"%PKG%\backend\.env"  echo SMTP_SERVER=smtp.gmail.com
>>"%PKG%\backend\.env"  echo SMTP_PORT=587
>>"%PKG%\backend\.env"  echo STRIPE_API_KEY=
>>"%PKG%\backend\.env"  echo PAYPAL_CLIENT_ID=
>>"%PKG%\backend\.env"  echo PAYPAL_SECRET=
>>"%PKG%\backend\.env"  echo PAYPAL_MODE=sandbox

REM ---------- 8/8  Generate launcher / helper scripts ----------
echo [8/8] Writing launcher scripts...
call :write_start_bat
call :write_stop_bat
call :write_readme
call :write_reset_admin

echo.
echo ========================================================
echo   BUILD COMPLETE
echo ========================================================
echo   Output: %PKG%\
echo   Test:   %PKG%\START.bat
echo.
echo   Zipping for distribution...
REM Windows 10+ has tar which supports zip format.
tar -a -c -f "%PKG%-%VERSION%.zip" "%PKG%" 2>nul
if exist "%PKG%-%VERSION%.zip" (
    echo   Distribution: %PKG%-%VERSION%.zip
) else (
    echo   [!] Zip step skipped ^(tar couldn't create zip^). Compress %PKG% manually.
)
echo ========================================================
endlocal
exit /b 0

REM ============================================================
REM  Helper: emit START.bat into the package
REM ============================================================
:write_start_bat
> "%PKG%\START.bat"  echo @echo off
>>"%PKG%\START.bat"  echo title TechZone POS
>>"%PKG%\START.bat"  echo color 0A
>>"%PKG%\START.bat"  echo cd /d "%%~dp0"
>>"%PKG%\START.bat"  echo.
>>"%PKG%\START.bat"  echo echo ========================================
>>"%PKG%\START.bat"  echo echo   TechZone POS - Starting...
>>"%PKG%\START.bat"  echo echo ========================================
>>"%PKG%\START.bat"  echo.
>>"%PKG%\START.bat"  echo if not exist mongodb\data mkdir mongodb\data
>>"%PKG%\START.bat"  echo if not exist logs         mkdir logs
>>"%PKG%\START.bat"  echo.
>>"%PKG%\START.bat"  echo echo [1/2] Starting MongoDB on port 27017...
>>"%PKG%\START.bat"  echo start "TechZone MongoDB" /MIN /B "" "%%~dp0mongodb\mongod.exe" --dbpath "%%~dp0mongodb\data" --port 27017 --logpath "%%~dp0mongodb\logs\mongod.log" --quiet
>>"%PKG%\START.bat"  echo echo      (Waiting for MongoDB to accept connections...)
>>"%PKG%\START.bat"  echo timeout /t 4 /nobreak ^>nul
>>"%PKG%\START.bat"  echo.
>>"%PKG%\START.bat"  echo echo [2/2] Starting TechZone server on http://127.0.0.1:8001
>>"%PKG%\START.bat"  echo echo      Default login: admin / admin123  ^(change it in Settings - Users^)
>>"%PKG%\START.bat"  echo echo.
>>"%PKG%\START.bat"  echo start "" "http://127.0.0.1:8001"
>>"%PKG%\START.bat"  echo cd backend
>>"%PKG%\START.bat"  echo "%%~dp0python\python.exe" -m uvicorn server:app --host 127.0.0.1 --port 8001
>>"%PKG%\START.bat"  echo.
>>"%PKG%\START.bat"  echo echo Server stopped. Run STOP.bat to also stop MongoDB.
>>"%PKG%\START.bat"  echo pause
exit /b 0

:write_stop_bat
> "%PKG%\STOP.bat"   echo @echo off
>>"%PKG%\STOP.bat"   echo echo Stopping TechZone POS...
>>"%PKG%\STOP.bat"   echo taskkill /F /IM mongod.exe    2^>nul
>>"%PKG%\STOP.bat"   echo taskkill /F /IM python.exe    2^>nul
>>"%PKG%\STOP.bat"   echo taskkill /F /IM uvicorn.exe   2^>nul
>>"%PKG%\STOP.bat"   echo echo Stopped.
>>"%PKG%\STOP.bat"   echo timeout /t 2 /nobreak ^>nul
exit /b 0

:write_readme
> "%PKG%\README.txt" echo ================================================
>>"%PKG%\README.txt" echo   TechZone POS - Portable Edition v%VERSION%
>>"%PKG%\README.txt" echo ================================================
>>"%PKG%\README.txt" echo.
>>"%PKG%\README.txt" echo NO INSTALLATION REQUIRED.
>>"%PKG%\README.txt" echo.
>>"%PKG%\README.txt" echo TO START:   Double-click START.bat
>>"%PKG%\README.txt" echo TO STOP:    Double-click STOP.bat  ^(or close the window + STOP.bat^)
>>"%PKG%\README.txt" echo.
>>"%PKG%\README.txt" echo URL:        http://127.0.0.1:8001
>>"%PKG%\README.txt" echo LOGIN:      admin / admin123   ^(CHANGE THIS IN SETTINGS -^> USERS^)
>>"%PKG%\README.txt" echo.
>>"%PKG%\README.txt" echo YOUR DATA:  mongodb\data   ^(back up this folder^)
>>"%PKG%\README.txt" echo LOGS:       mongodb\logs\mongod.log and any python console output
>>"%PKG%\README.txt" echo.
>>"%PKG%\README.txt" echo TROUBLESHOOTING:
>>"%PKG%\README.txt" echo   - Port 27017 or 8001 already in use?  STOP.bat then retry.
>>"%PKG%\README.txt" echo   - Forgot admin password?              Run RESET_ADMIN.bat.
>>"%PKG%\README.txt" echo ================================================
exit /b 0

:write_reset_admin
> "%PKG%\RESET_ADMIN.bat"  echo @echo off
>>"%PKG%\RESET_ADMIN.bat"  echo title TechZone POS - Reset admin password
>>"%PKG%\RESET_ADMIN.bat"  echo cd /d "%%~dp0"
>>"%PKG%\RESET_ADMIN.bat"  echo echo Make sure MongoDB is running ^(START.bat must be running^)!
>>"%PKG%\RESET_ADMIN.bat"  echo pause
>>"%PKG%\RESET_ADMIN.bat"  echo "%%~dp0python\python.exe" -c "import os,bcrypt;from pymongo import MongoClient;c=MongoClient('mongodb://127.0.0.1:27017')['techzone_pos'];h=bcrypt.hashpw(b'admin123',bcrypt.gensalt()).decode();c.users.update_one({'username':'admin'},{'$set':{'password_hash':h}},upsert=False);print('admin password reset to: admin123')"
>>"%PKG%\RESET_ADMIN.bat"  echo pause
exit /b 0
