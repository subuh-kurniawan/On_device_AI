#!/bin/bash
# ========================================================
# Launcher Server EduVis / Gemma AI LAN Server (macOS)
# Klik ganda file ini untuk langsung menjalankan server
# ========================================================

cd "$(dirname "$0")"

echo "========================================================"
echo "🚀 Memulai EduVis / Gemma LAN AI Relay Server..."
echo "========================================================"

# Cari file server di beberapa lokasi relatif yang memungkinkan
SERVER_SCRIPT=""
if [ -f "nano_asset/assets/js/lan-ai-relay-server.js" ]; then
    SERVER_SCRIPT="nano_asset/assets/js/lan-ai-relay-server.js"
elif [ -f "assets/js/lan-ai-relay-server.js" ]; then
    SERVER_SCRIPT="assets/js/lan-ai-relay-server.js"
elif [ -f "./lan-ai-relay-server.js" ]; then
    SERVER_SCRIPT="./lan-ai-relay-server.js"
fi

if [ -z "$SERVER_SCRIPT" ]; then
    echo "❌ Berkas lan-ai-relay-server.js tidak ditemukan!"
    echo "Pastikan struktur folder proyek lengkap."
    read -p "Tekan Enter untuk keluar..."
    exit 1
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
echo "• Membuka browser otomatis..."

# Buka browser server secara otomatis setelah jeda singkat
(sleep 1.5 && open "http://localhost:$PORT/index.html") &

# Jalankan server relay
node "$SERVER_SCRIPT" "$PORT"
