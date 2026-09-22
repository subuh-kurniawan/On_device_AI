#!/bin/bash
echo "==================================================="
echo "🚀 Memulai Chrome On-Device AI Playground (Mac)    "
echo "==================================================="

# Berpindah ke direktori tempat script ini berada
cd "$(dirname "$0")"

# Mengecek apakah Python3 terinstall
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 tidak ditemukan! Harap install Python 3 terlebih dahulu."
    exit 1
fi

# Memastikan port 8080 bersih
echo "[INFO] Membersihkan port 8080 jika sedang digunakan..."
lsof -ti:8080 | xargs kill -9 2>/dev/null

# Memulai Python HTTP Server di background
echo "[INFO] Memulai Local HTTP Server di port 8080..."
python3 -m http.server 8080 &

# Menunggu sejenak agar server siap
sleep 2

# Mengecek Chrome Dev, lalu fallback ke Chrome Stable/Canary
CHROME_PATH=""
for candidate in \
    "/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev" \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"; do
    if [ -x "$candidate" ]; then
        CHROME_PATH="$candidate"
        break
    fi
done

if [ -z "$CHROME_PATH" ]; then
    echo "[ERROR] Google Chrome Dev/Stable/Canary tidak ditemukan di folder Applications."
    exit 1
fi

# Meluncurkan Chrome dengan flags AI On-Device
echo "[INFO] Meluncurkan Chrome: $CHROME_PATH"
"$CHROME_PATH" --enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano "http://localhost:8080" &

echo "[SUCCESS] Selesai!"
echo "PENTING: Jika AI belum merespons, pastikan Anda mengecek chrome://components"
echo "dan mengunduh 'Optimization Guide On Device Model'."
