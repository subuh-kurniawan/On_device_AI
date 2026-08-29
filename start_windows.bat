@echo off
echo ===================================================
echo 🚀 Memulai Chrome On-Device AI Playground (Windows)
echo ===================================================

:: Mengecek apakah Python terinstall
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python tidak ditemukan! Harap install Python terlebih dahulu.
    echo Anda juga bisa menjalankan server secara manual menggunakan Node.js (npx http-server).
    pause
    exit /b
)

:: Memulai Python HTTP Server di terminal baru agar log terlihat
echo [INFO] Memulai Local HTTP Server di port 8080...
start "AI Playground Server" cmd /c "python -m http.server 8080"

:: Menunggu sejenak agar server siap
timeout /t 2 /nobreak >nul

:: Mencari lokasi instalasi Chrome
set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
IF NOT EXIST %CHROME_PATH% (
    set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

IF NOT EXIST %CHROME_PATH% (
    echo [ERROR] Google Chrome tidak ditemukan di path standar.
    echo Silakan jalankan Chrome secara manual dan aktifkan flags dari chrome://flags
    pause
    exit /b
)

:: Meluncurkan Chrome dengan flags AI On-Device
echo [INFO] Meluncurkan Google Chrome dengan konfigurasi AI Flags...
start "" %CHROME_PATH% --enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano "http://localhost:8080"

echo [SUCCESS] Selesai! 
echo PENTING: Jika AI belum merespons, pastikan Anda telah mengecek chrome://components 
echo dan memperbarui "Optimization Guide On Device Model".
pause
