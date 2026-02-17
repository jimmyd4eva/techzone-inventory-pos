@echo off
echo ==========================================
echo   SalesTax POS - Local Runner
echo ==========================================
echo.

:: Start Backend
echo Starting backend server...
cd backend
start "SalesTax Backend" cmd /k "py -m pip install -r requirements-minimal.txt && py -m uvicorn server:app --host 127.0.0.1 --port 8001"
cd ..

:: Wait for backend to start
echo Waiting for backend to start...
timeout /t 15 /nobreak

:: Start Frontend
echo Starting frontend...
cd frontend
start "SalesTax Frontend" cmd /k "set REACT_APP_BACKEND_URL=http://127.0.0.1:8001 && npm install --legacy-peer-deps --no-audit && npm start"
cd ..

echo.
echo ==========================================
echo   App is starting...
echo   Backend: http://127.0.0.1:8001
echo   Frontend: http://localhost:3000
echo   
echo   Login: admin / admin123
echo ==========================================
echo.
pause
