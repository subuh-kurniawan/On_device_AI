@echo off
setlocal enabledelayedexpansion
title Chrome On-Device AI Playground - Windows Setup

echo ========================================================
echo  Chrome On-Device AI Playground - Auto Setup (Windows)
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Periksa Node.js
echo [1/4] Memeriksa Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [PERINGATAN] Node.js belum terpasang di sistem.
    where winget >nul 2>&1
    if %errorlevel% equ 0 (
        echo [INFO] Memasang Node.js LTS secara otomatis via Windows Package Manager (winget)...
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    ) else (
        echo [INFO] Silakan unduh dan pasang Node.js dari: https://nodejs.org/
        start https://nodejs.org/
    )
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
    echo [BERHASIL] Node.js terdeteksi: !NODE_VER!
)
echo.

:: 2. Periksa Python 3
echo [2/4] Memeriksa Python...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [PERINGATAN] Python belum terpasang di sistem.
    where winget >nul 2>&1
    if %errorlevel% equ 0 (
        echo [INFO] Memasang Python secara otomatis via winget...
        winget install Python.Python.3.11 --accept-package-agreements --accept-source-agreements
    ) else (
        echo [INFO] Silakan pasang Python dari: https://www.python.org/downloads/
    )
) else (
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PY_VER=%%i
    echo [BERHASIL] Python terdeteksi: !PY_VER!
)
echo.

:: 3. Periksa Integritas Model & Aset
echo [3/4] Memeriksa Integritas Model AI & Aset...
where python >nul 2>&1
if %errorlevel% equ 0 (
    python verify_assets.py
) else (
    where git-lfs >nul 2>&1
    if !errorlevel! equ 0 (
        echo [INFO] Menginisialisasi Git LFS...
        git lfs install
        git lfs pull
    ) else (
        echo [PERINGATAN] Jalankan verify_assets.bat untuk memastikan kelengkapan model AI.
    )
)
echo.

:: 4. Periksa / Buat Sertifikat SSL (HTTPS & WSS Lokal)
echo [4/4] Memeriksa Sertifikat SSL Lokal (key.pem & cert.pem)...
if exist "key.pem" if exist "cert.pem" (
    echo [BERHASIL] Sertifikat SSL sudah ada: key.pem & cert.pem
    goto :SELESAI
)

echo [INFO] Membuat sertifikat SSL mandiri (Self-Signed)...
set OPENSSL_BIN=openssl
where openssl >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Git\usr\bin\openssl.exe" (
        set OPENSSL_BIN="C:\Program Files\Git\usr\bin\openssl.exe"
    ) else if exist "C:\Program Files (x86)\Git\usr\bin\openssl.exe" (
        set OPENSSL_BIN="C:\Program Files (x86)\Git\usr\bin\openssl.exe"
    )
)

%OPENSSL_BIN% req -x509 -newkey rsa:2048 -nodes -sha256 -subj "/CN=localhost" -keyout key.pem -out cert.pem -days 365 >nul 2>&1
if exist "cert.pem" (
    echo [BERHASIL] Sertifikat SSL berhasil dibuat menggunakan OpenSSL.
) else (
    echo [INFO] Menggunakan PowerShell untuk membuat sertifikat...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$cert = New-SelfSignedCertificate -DnsName 'localhost', '127.0.0.1' -CertStoreLocation 'Cert:\CurrentUser\My'; " ^
        "$pwd = ConvertTo-SecureString -String 'pass' -Force -AsPlainText; " ^
        "Export-PfxCertificate -Cert $cert -FilePath 'temp.pfx' -Password $pwd | Out-Null; "
    echo [PERINGATAN] Jika sertifikat belum ter-generate, pasang OpenSSL atau jalankan via Git Bash.
)

:SELESAI
echo.
echo ========================================================
echo  Setup Selesai!
echo  Untuk memulai aplikasi di Windows, klik ganda: start_windows.bat
echo ========================================================
echo.
pause
