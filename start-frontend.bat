@echo off
title Electronic Betting System - Frontend
color 0B
echo.
echo  ==========================================
echo   Electronic Betting System - Frontend
echo  ==========================================
echo.
echo  Starting frontend on http://localhost:3000
echo  Press Ctrl+C to stop
echo.
cd /d "%~dp0frontend"
npm run dev
pause
