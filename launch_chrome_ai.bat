@echo off
setlocal enabledelayedexpansion
title Chrome On-Device AI - Hardware Check & Flags Launcher (Windows)

echo ========================================================
echo  Chrome On-Device AI - Auto Detection ^& Flags Launcher
echo ========================================================
echo.

cd /d "%~dp0"

:: -------------------------------------------------------------------------
:: 1. Pemeriksaan Spesifikasi Perangkat Keras (Hardware Requirements)
:: -------------------------------------------------------------------------
echo [1/4] Memeriksa Spesifikasi Perangkat Keras...

for /f %%a in ('powershell -NoProfile -Command "[math]::Round((Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum).Sum / 1GB)" 2^>nul') do set RAM_GB=%%a
if defined RAM_GB (
    echo   * Total RAM: !RAM_GB! GB
    if !RAM_GB! LSS 16 (
        echo     [INFO] RAM di bawah 16 GB - Flag BypassPerfRequirement akan diterapkan otomatis.
    ) else (
        echo     [OK] RAM memenuhi spesifikasi resmi (>= 16 GB).
    )
) else (
    echo   * Total RAM: Tidak dapat dideteksi.
)

for /f %%b in ('powershell -NoProfile -Command "[math]::Round((Get-PSDrive C).Free / 1GB)" 2^>nul') do set DISK_GB=%%b
if defined DISK_GB (
    echo   * Ruang Kosong Drive C: ~!DISK_GB! GB
    if !DISK_GB! LSS 22 (
        echo     [PERINGATAN] Ruang disk di bawah 22 GB. Google menyarankan >= 22 GB untuk bobot Gemini Nano.
    ) else (
        echo     [OK] Ruang disk memadai (>= 22 GB).
    )
)
echo.

:: -------------------------------------------------------------------------
:: 2. Deteksi Otomatis Edisi Chrome (Canary / Dev / Beta / Biasa-Stable)
:: -------------------------------------------------------------------------
echo [2/4] Mendeteksi Edisi Google Chrome yang Terpasang...

set CHROME_BIN=""
set CHROME_EDITION=""

:: Prioritas: Dev -> Canary -> Beta -> Biasa (Stable)
if exist "C:\Program Files\Google\Chrome Dev\Application\chrome.exe" (
    set CHROME_BIN="C:\Program Files\Google\Chrome Dev\Application\chrome.exe"
    set CHROME_EDITION=Chrome Dev (Kanal Developer - Sangat Disarankan)
) else if exist "%LocalAppData%\Google\Chrome Dev\Application\chrome.exe" (
    set CHROME_BIN="%LocalAppData%\Google\Chrome Dev\Application\chrome.exe"
    set CHROME_EDITION=Chrome Dev (Kanal Developer - User)
) else if exist "C:\Program Files\Google\Chrome SxS\Application\chrome.exe" (
    set CHROME_BIN="C:\Program Files\Google\Chrome SxS\Application\chrome.exe"
    set CHROME_EDITION=Chrome Canary (Kanal Eksperimental Harian)
) else if exist "%LocalAppData%\Google\Chrome SxS\Application\chrome.exe" (
    set CHROME_BIN="%LocalAppData%\Google\Chrome SxS\Application\chrome.exe"
    set CHROME_EDITION=Chrome Canary (Kanal Eksperimental User)
) else if exist "C:\Program Files\Google\Chrome Beta\Application\chrome.exe" (
    set CHROME_BIN="C:\Program Files\Google\Chrome Beta\Application\chrome.exe"
    set CHROME_EDITION=Chrome Beta (Kanal Pengujian Pra-Rilis)
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set CHROME_BIN="C:\Program Files\Google\Chrome\Application\chrome.exe"
    set CHROME_EDITION=Chrome Biasa (Kanal Stable Standar)
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set CHROME_BIN="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    set CHROME_EDITION=Chrome Biasa (Kanal Stable x86)
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set CHROME_BIN="%LocalAppData%\Google\Chrome\Application\chrome.exe"
    set CHROME_EDITION=Chrome Biasa (Kanal Stable User)
)

if %CHROME_BIN% == "" (
    echo [ERROR] Tidak ditemukan Google Chrome (Canary / Dev / Beta / Biasa) di sistem Anda!
    echo Disarankan mengunduh Google Chrome Dev dari: https://www.google.com/chrome/dev/
    pause
    exit /b 1
)

echo   [BERHASIL TERDETEKSI]
echo   * Edisi: !CHROME_EDITION!
echo   * Lokasi: %CHROME_BIN%
echo.

:: -------------------------------------------------------------------------
:: 3. Memeriksa Local Server
:: -------------------------------------------------------------------------
echo [3/4] Memeriksa Local Server...
set TARGET_URL=http://localhost:8080/index.html

powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8080/index.html' -TimeoutSec 1; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [BERHASIL] Local HTTP Server aktif di port 8080.
) else (
    echo   [INFO] Server belum aktif. Memulai Python HTTP Server di jendela baru...
    where python >nul 2>&1
    if %errorlevel% equ 0 (
        start "AI Playground Server" cmd /c "python -m http.server 8080"
        timeout /t 2 /nobreak >nul
    )
)
echo.

:: -------------------------------------------------------------------------
:: 4. Meluncurkan Chrome dengan Flags AI On-Device & WebGPU
:: -------------------------------------------------------------------------
echo [4/4] Meluncurkan !CHROME_EDITION! dengan Flags AI On-Device...

set AI_PROFILE=%LocalAppData%\Google\Chrome-AI-Profile
if not exist "%AI_PROFILE%" mkdir "%AI_PROFILE%"

set FLAGS=--enable-features=OptimizationGuideOnDeviceModel:compatible_on_device_performance_classes/*,PromptAPIForGeminiNano,EnableWebGPU
set FLAGS=%FLAGS% --optimization-guide-on-device-model-execution-eval=1
set FLAGS=%FLAGS% --enable-unsafe-webgpu
set FLAGS=%FLAGS% --enable-webgpu-developer-features
set FLAGS=%FLAGS% --ignore-gpu-blocklist
set FLAGS=%FLAGS% --user-data-dir="%AI_PROFILE%"

echo.
echo Meluncurkan browser dengan profil AI terisolasi...
start "" %CHROME_BIN% %FLAGS% "%TARGET_URL%" "chrome://components" "chrome://on-device-internals"

echo.
echo ========================================================
echo  Google Chrome Berhasil Dibuka!
echo ========================================================
echo.
echo Langkah selanjutnya di Chrome:
echo   1. Pada tab chrome://components, cari "Optimization Guide On Device Model" dan klik "Check for update".
echo   2. Pada tab chrome://on-device-internals, pastikan model berstatus "Ready".
echo   3. Buka tab AI Playground dan nikmati AI 100%% lokal!
echo.
pause
