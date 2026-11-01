#!/bin/bash
# ========================================================
# Launcher Server EduVis / Gemma AI LAN Server (macOS - HTTPS)
# Klik ganda file ini untuk langsung menjalankan server
# ========================================================

cd "$(dirname "$0")"

echo "========================================================"
echo "🚀 Memulai EduVis / Gemma LAN AI Relay Server (HTTPS)..."
echo "========================================================"

# Cari file server di beberapa lokasi relatif yang memungkinkan
SERVER_SCRIPT=""
if [ -f "nano_asset/assets/js/relay.js" ]; then
    SERVER_SCRIPT="nano_asset/assets/js/relay.js"
elif [ -f "assets/js/relay.js" ]; then
    SERVER_SCRIPT="assets/js/relay.js"
elif [ -f "./relay.js" ]; then
    SERVER_SCRIPT="./relay.js"
fi

if [ -z "$SERVER_SCRIPT" ]; then
    echo "❌ Berkas relay.js tidak ditemukan!"
    echo "Pastikan struktur folder proyek lengkap."
    read -p "Tekan Enter untuk keluar..."
    exit 1
fi

# Periksa sertifikat SSL
if [ ! -f "key.pem" ] || [ ! -f "cert.pem" ]; then
    echo "⚠️ Sertifikat SSL tidak ditemukan. Membuat sertifikat mandiri..."
    openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
      -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
      -keyout key.pem -out cert.pem -days 365 2>/dev/null || \
    openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
      -keyout key.pem -out cert.pem -days 365
    echo "✅ Sertifikat SSL berhasil dibuat."
fi

# Periksa apakah Node.js terpasang
if ! command -v node &> /dev/null; then
    echo "❌ Node.js belum terpasang di sistem macOS Anda."
    echo "Silakan unduh dan pasang Node.js dari https://nodejs.org/"
    read -p "Tekan Enter untuk keluar..."
    exit 1
fi

PORT=1234
echo "• Port: $PORT"

# Periksa apakah port sedang digunakan oleh proses sebelumnya
OLD_PID=$(lsof -ti :$PORT 2>/dev/null)
if [ -n "$OLD_PID" ]; then
    echo "⚠️ Port $PORT sedang digunakan oleh proses (PID: $OLD_PID)."
    echo "  Menghentikan proses lama agar server baru dapat berjalan..."
    kill -9 $OLD_PID 2>/dev/null
    sleep 0.5
fi

# Deteksi browser Google Chrome (Dev / Canary / Stable) untuk Prompt API & Gemini Nano
CHROME_APP=""
for cand in \
    "/Applications/Google Chrome Dev.app" \
    "/Applications/Google Chrome.app" \
    "/Applications/Google Chrome Canary.app" \
    "$HOME/Applications/Google Chrome Dev.app" \
    "$HOME/Applications/Google Chrome.app" \
    "$HOME/Applications/Google Chrome Canary.app"; do
    if [ -d "$cand" ]; then
        CHROME_APP="$cand"
        break
    fi
done

TARGET_URL="https://localhost:$PORT/index.html"

if [ -n "$CHROME_APP" ]; then
    echo "• Membuka Google Chrome ($CHROME_APP) langsung..."
    (sleep 0.5 && open -a "$CHROME_APP" "$TARGET_URL" --args --enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano --ignore-certificate-errors) &
else
    echo "• Membuka browser default via HTTPS..."
    (sleep 0.5 && open "$TARGET_URL") &
fi

# Jalankan server relay
node "$SERVER_SCRIPT" "$PORT"
