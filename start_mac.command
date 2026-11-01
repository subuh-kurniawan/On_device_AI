#!/bin/bash
set -u

echo "==================================================="
echo "🚀 Memulai Chrome On-Device AI Playground (Mac)    "
echo "==================================================="

# Berpindah ke direktori tempat script ini berada
SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Mengecek apakah Python3 terinstall
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 tidak ditemukan! Harap install Python 3 terlebih dahulu."
    exit 1
fi

# Mengecek Chrome sebelum memulai server
CHROME_PATH=""
for candidate in \
    "/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev" \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary" \
    "$HOME/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev" \
    "$HOME/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "$HOME/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"; do
    if [ -x "$candidate" ]; then
        CHROME_PATH="$candidate"
        break
    fi
done

if [ -z "$CHROME_PATH" ]; then
    echo "[ERROR] Google Chrome Dev/Stable/Canary tidak ditemukan."
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/percakapan-gemini-live.html" ]; then
    echo "[ERROR] File percakapan-gemini-live.html tidak ditemukan di $SCRIPT_DIR."
    exit 1
fi

# Memulai Python HTTP Server di background
echo "[INFO] Memulai Local HTTP Server di 127.0.0.1:8080..."
python3 -m http.server 8080 --bind 127.0.0.1 --directory "$SCRIPT_DIR" &
SERVER_PID=$!

cleanup() {
    if kill -0 "$SERVER_PID" 2>/dev/null; then
        kill "$SERVER_PID" 2>/dev/null || true
    fi
    wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

URL="http://127.0.0.1:8080/percakapan-gemini-live.html"
SERVER_READY=0
for attempt in {1..10}; do
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        wait "$SERVER_PID"
        echo "[ERROR] Server gagal dimulai. Pastikan port 8080 tidak sedang digunakan."
        exit 1
    fi
    if curl --silent --show-error --fail "$URL" --output /dev/null 2>/dev/null; then
        SERVER_READY=1
        break
    fi
    sleep 0.5
done

if [ "$SERVER_READY" -ne 1 ]; then
    echo "[ERROR] Server tidak siap menyajikan $URL."
    exit 1
fi

# Meluncurkan Chrome dengan flags AI On-Device
echo "[INFO] Meluncurkan Chrome: $CHROME_PATH"
"$CHROME_PATH" --enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano "$URL" &

echo "[SUCCESS] Halaman Gemini Live Lokal dibuka."
echo "Server tetap berjalan selama jendela ini terbuka. Tekan Ctrl+C untuk menghentikannya."
echo "Pastikan Chrome ditutup sepenuhnya sebelum menjalankan skrip agar flags diterapkan."
echo "PENTING: Jika AI belum merespons, pastikan Anda mengecek chrome://components"
echo "dan mengunduh 'Optimization Guide On Device Model'."

wait "$SERVER_PID"
