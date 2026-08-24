@echo off
title StockPulse Dependency Installer
echo ========================================================================
echo   ⚡ Launching StockPulse Automated Dependency Installer (winget)
echo ========================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-dependencies.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Setup encountered an issue. Press any key to exit.
    pause >nul
)

