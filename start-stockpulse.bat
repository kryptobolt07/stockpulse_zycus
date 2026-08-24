@echo off
title StockPulse Fullstack Launcher
echo ========================================================================
echo   ⚡ Launching StockPulse Fullstack Servers (Backend + Frontend)
echo ========================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-stockpulse.ps1"
