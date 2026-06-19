@echo off
echo ==========================================================
echo    SHARADHA STORES - FESTIVAL COMBO HAMPER BUILDER
echo ==========================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

echo [INFO] Node.js detected. Preparing workspace dependencies...
echo.

:: Install workspace dependencies
if not exist node_modules (
    echo [INFO] Installing root workspace runner...
    call npm install
)

:: Install sub-folders dependencies
if not exist backend\node_modules (
    echo [INFO] Installing backend dependencies...
    call npm install --prefix backend
)

if not exist frontend\node_modules (
    echo [INFO] Installing frontend dependencies...
    call npm install --prefix frontend
)

echo.
echo ==========================================================
echo [SUCCESS] Dependencies prepared. Starting dev servers...
echo.
echo Backend API will listen on: http://localhost:5000/api
echo Frontend React App will run on: http://localhost:3000
echo ==========================================================
echo.

call npm run dev
pause
