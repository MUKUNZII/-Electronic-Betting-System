@echo off
title Electronic Betting System - Database Setup
color 0E
echo.
echo  ==========================================
echo   Electronic Betting System - DB Setup
echo  ==========================================
echo.
echo  This will create all database tables and
echo  insert the default admin account.
echo.
echo  Make sure MySQL is running and you have
echo  updated backend\.env with your DB password.
echo.
pause
cd /d "%~dp0backend"
node config/migrate.js
echo.
echo  Done! You can now start the backend.
pause
