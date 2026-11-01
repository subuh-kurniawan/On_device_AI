@echo off
REM =========================================================================
REM 🛡️ Asset & Model Integrity Checker (Windows Launcher)
REM =========================================================================
cd /d "%~dp0"

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python verify_assets.py
    pause
    exit /b 0
)

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    py -3 verify_assets.py
    pause
    exit /b 0
)

echo [ERROR] Python tidak ditemukan di sistem Windows Anda.
echo Silakan pasang Python 3 dari https://www.python.org/downloads/
pause
exit /b 1
