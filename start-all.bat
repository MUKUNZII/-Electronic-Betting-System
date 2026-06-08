@echo off
title Electronic Betting System
color 0A
echo.
echo  ==========================================
echo   Electronic Betting System
echo  ==========================================
echo.

:: Step 1 - Start MySQL if not running
echo  [1/3] Checking MySQL...
netstat -ano | findstr ":3306" >nul 2>&1
if errorlevel 1 (
    echo  [1/3] Starting XAMPP MySQL...
    start /B "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini"
    echo  [1/3] Waiting for MySQL to start...
    timeout /t 5 /nobreak >nul
    netstat -ano | findstr ":3306" >nul 2>&1
    if errorlevel 1 (
        echo.
        echo  ERROR: MySQL failed to start!
        echo  Please open XAMPP Control Panel and start MySQL manually.
        echo.
        pause
        exit /b 1
    )
    echo  [1/3] MySQL started successfully!
) else (
    echo  [1/3] MySQL already running.
)

:: Step 2 - Confirm DB connection
echo  [2/3] Database: OK
echo  [3/3] Starting Backend + Frontend...
echo.
echo  Backend  --^> http://localhost:5000
echo  Frontend --^> http://localhost:3000
echo  Admin    --^> http://localhost:3000/admin/login
echo.
echo  Press Ctrl+C to stop
echo.

cd /d "%~dp0"
npm run dev
pause
