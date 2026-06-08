@echo off
title Electronic Betting System - Backend
color 0A
echo.
echo  Checking MySQL...
netstat -ano | findstr ":3306" >nul 2>&1
if errorlevel 1 (
    echo  Starting XAMPP MySQL...
    start /B "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini"
    timeout /t 5 /nobreak >nul
)
echo  MySQL OK. Starting backend...
echo.
cd /d "%~dp0backend"
npm run dev
pause
