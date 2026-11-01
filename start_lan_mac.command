#!/bin/bash
set -u

echo "==================================================="
echo "🚀 Memulai EduVis / Gemma AI LAN Server (Mac Host) "
echo "==================================================="

# Berpindah ke direktori tempat script ini berada (ONDEVICEC)
SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

PORT=1234
RELAY_SCRIPT="$SCRIPT_DIR/nano_asset/assets/js/lan-ai-relay-server.js"

# 1. Mengecek ketersediaan Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js tidak ditemukan! Harap install Node.js terlebih dahulu."
    echo "Kunjungi https://nodejs.org/ untuk mengunduhnya."
    read -p "Tekan Enter untuk keluar..."
    exit 1
fi

if [ ! -f "$RELAY_SCRIPT" ]; then
    echo "[ERROR] File $RELAY_SCRIPT tidak ditemukan!"
    read -p "Tekan Enter untuk keluar..."
    exit 1
fi

# 2. Mengecek Google Chrome (Dev / Canary / Stable) untuk AI On-Device
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

# 3. Menentukan halaman awal yang dibuka
TARGET_PAGE="obrolan-claude.html"
if [ ! -f "$SCRIPT_DIR/obrolan-claude.html" ]; then
    if [ -f "$SCRIPT_DIR/percakapan-gemini-live.html" ]; then
        TARGET_PAGE="percakapan-gemini-live.html"
    elif [ -f "$SCRIPT_DIR/index.html" ]; then
        TARGET_PAGE="index.html"
    fi
fi

# 4. Mendeteksi IP Wi-Fi Lokal
WIFI_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")

# 5. Memulai LAN AI Relay Server di background
echo "[INFO] Menjalankan LAN AI Relay Server pada port $PORT..."
node "$RELAY_SCRIPT" "$PORT" &
SERVER_PID=$!

cleanup() {
    echo ""
    echo "[INFO] Menghentikan LAN AI Relay Server..."
    if kill -0 "$SERVER_PID" 2>/dev/null; then
        kill "$SERVER_PID" 2>/dev/null || true
    fi
    wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

URL="http://localhost:$PORT/$TARGET_PAGE"
SERVER_READY=0
for attempt in {1..12}; do
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "[ERROR] Server gagal dijalankan pada port $PORT."
        exit 1
    fi
    if curl --silent --fail "$URL" --output /dev/null 2>/dev/null; then
        SERVER_READY=1
        break
    fi
    sleep 0.5
done

# 6. Membuka Chrome Server Host dengan Flags AI On-Device
if [ -n "$CHROME_PATH" ]; then
    echo "[INFO] Meluncurkan Chrome Host: $CHROME_PATH"
    "$CHROME_PATH" --enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano "$URL" &
else
    echo "[WARN] Chrome khusus tidak ditemukan, membuka browser default..."
    open "$URL" &
fi

echo ""
echo "==================================================="
echo "✅ SERVER AI BERHASIL AKTIF!"
echo "==================================================="
echo "💻 Host Server (Mac) : http://localhost:$PORT/$TARGET_PAGE"
if [ -n "$WIFI_IP" ]; then
    echo "📱 Klien LAN (HP)    : http://$WIFI_IP:$PORT/$TARGET_PAGE"
fi
echo "---------------------------------------------------"
echo "💡 PETUNJUK MODE AI:"
echo "• Di Browser Server (Mac): Mode AI diset ke 'Chrome On-Device AI' (Gemini Nano)"
echo "• Di Klien (HP / Tablet) : Otomatis numpang fitur On-Device Mac via Wi-Fi!"
echo "• Scan QR Code           : Klik tombol 'QR HP' di pojok atas browser Mac"
echo "==================================================="
echo "PENTING: Jangan tutup jendela Terminal ini agar"
echo "perangkat klien di Wi-Fi tetap dapat terhubung."
echo "Tekan Ctrl + C untuk menghentikan server."
echo "==================================================="

wait "$SERVER_PID"
