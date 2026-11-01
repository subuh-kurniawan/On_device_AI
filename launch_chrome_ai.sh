#!/usr/bin/env bash
# =========================================================================
# 🚀 Chrome On-Device AI Flags & Environment Launcher (macOS & Linux)
# File: launch_chrome_ai.sh
# Mendeteksi otomatis: Chrome Canary, Chrome Dev, Chrome Beta, atau Chrome Biasa (Stable)
# =========================================================================

set -e

# Warna Terminal
BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
MAGENTA="\033[0;35m"
RED="\033[0;31m"
RESET="\033[0m"

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BOLD}${CYAN}========================================================"
echo "🚀 Chrome On-Device AI - Auto Detection & Flags Launcher"
echo -e "📁 Direktori: ${SCRIPT_DIR}${RESET}"
echo -e "${BOLD}${CYAN}========================================================${RESET}"
echo ""

OS_TYPE="$(uname -s)"

# -------------------------------------------------------------------------
# 1. Pemeriksaan Spesifikasi Perangkat Keras (Hardware Requirements)
# -------------------------------------------------------------------------
echo -e "${BOLD}${CYAN}[1/4] Memeriksa Spesifikasi Perangkat Keras...${RESET}"

RAM_GB=0
if [ "$OS_TYPE" = "Darwin" ]; then
    RAM_BYTES=$(sysctl -n hw.memsize 2>/dev/null || echo 0)
    RAM_GB=$(( RAM_BYTES / 1024 / 1024 / 1024 ))
else
    RAM_KB=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}' || echo 0)
    RAM_GB=$(( RAM_KB / 1024 / 1024 ))
fi

echo -n "  • Total RAM: ${RAM_GB} GB "
if [ "$RAM_GB" -ge 16 ]; then
    echo -e "${GREEN}(Memenuhi syarat resmi >= 16 GB)${RESET}"
else
    echo -e "${YELLOW}(Di bawah 16 GB - Flag BypassPerfRequirement diaktifkan secara otomatis!)${RESET}"
fi

FREE_DISK_GB=0
if [ "$OS_TYPE" = "Darwin" ]; then
    FREE_DISK_KB=$(df -k "$HOME" 2>/dev/null | awk 'NR==2 {print $4}' || echo 0)
    FREE_DISK_GB=$(( FREE_DISK_KB / 1024 / 1024 ))
else
    FREE_DISK_KB=$(df -k "$HOME" 2>/dev/null | awk 'NR==2 {print $4}' || echo 0)
    FREE_DISK_GB=$(( FREE_DISK_KB / 1024 / 1024 ))
fi

echo -n "  • Ruang Disk Tersedia: ~${FREE_DISK_GB} GB "
if [ "$FREE_DISK_GB" -ge 22 ]; then
    echo -e "${GREEN}(Cukup untuk model Gemini Nano >= 22 GB)${RESET}"
else
    echo -e "${YELLOW}(Peringatan: Google menyarankan >= 22 GB ruang kosong untuk mengunduh bobot model)${RESET}"
fi

echo ""

# -------------------------------------------------------------------------
# 2. Deteksi Otomatis Edisi Chrome (Canary / Dev / Beta / Biasa-Stable)
# -------------------------------------------------------------------------
echo -e "${BOLD}${CYAN}[2/4] Mendeteksi Edisi Google Chrome yang Terpasang...${RESET}"

CHROME_BIN=""
CHROME_EDITION=""
CHROME_VERSION=""
FOUND_EDITIONS=()

detect_macos_chrome() {
    # Urutan prioritas untuk AI On-Device: Dev -> Canary -> Beta -> Stable (Biasa)
    declare -a EDITIONS=(
        "Google Chrome Dev.app:Chrome Dev (Kanal Developer - Sangat Disarankan):/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev"
        "Google Chrome Dev.app:Chrome Dev (Kanal Developer - User):$HOME/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev"
        "Google Chrome Canary.app:Chrome Canary (Kanal Eksperimental Harian):/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
        "Google Chrome Canary.app:Chrome Canary (Kanal Eksperimental User):$HOME/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
        "Google Chrome Beta.app:Chrome Beta (Kanal Pengujian Pra-Rilis):/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta"
        "Google Chrome.app:Chrome Biasa (Kanal Stable Standar):/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        "Google Chrome.app:Chrome Biasa (Kanal Stable User):$HOME/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        "Chromium.app:Chromium (Open Source):/Applications/Chromium.app/Contents/MacOS/Chromium"
    )

    for item in "${EDITIONS[@]}"; do
        IFS=":" read -r app_name label bin_path <<< "$item"
        if [ -x "$bin_path" ]; then
            ver=$("$bin_path" --version 2>/dev/null || echo "Unknown Version")
            FOUND_EDITIONS+=("$label ($ver)")
            if [ -z "$CHROME_BIN" ]; then
                CHROME_BIN="$bin_path"
                CHROME_EDITION="$label"
                CHROME_VERSION="$ver"
            fi
        fi
    done
}

detect_linux_chrome() {
    declare -a LINUX_EDITIONS=(
        "google-chrome-dev:Chrome Dev (Kanal Developer)"
        "google-chrome-unstable:Chrome Canary / Unstable"
        "google-chrome-beta:Chrome Beta (Pra-Rilis)"
        "google-chrome-stable:Chrome Biasa (Stable)"
        "google-chrome:Chrome Biasa (Stable)"
        "chromium-browser:Chromium"
        "chromium:Chromium"
    )

    for item in "${LINUX_EDITIONS[@]}"; do
        IFS=":" read -r cmd label <<< "$item"
        if command -v "$cmd" &>/dev/null; then
            bin_path="$(command -v "$cmd")"
            ver=$("$bin_path" --version 2>/dev/null || echo "Unknown Version")
            FOUND_EDITIONS+=("$label ($ver)")
            if [ -z "$CHROME_BIN" ]; then
                CHROME_BIN="$bin_path"
                CHROME_EDITION="$label"
                CHROME_VERSION="$ver"
            fi
        fi
    done
}

if [ "$OS_TYPE" = "Darwin" ]; then
    detect_macos_chrome
else
    detect_linux_chrome
fi

if [ -z "$CHROME_BIN" ]; then
    echo -e "${RED}❌ Tidak ditemukan Google Chrome (Canary / Dev / Beta / Biasa) di sistem Anda!${RESET}"
    echo "Untuk hasil terbaik dengan On-Device AI, kami menyarankan memasang Google Chrome Dev:"
    echo "  👉 https://www.google.com/chrome/dev/"
    echo ""
    read -p "Tekan [Enter] untuk keluar..."
    exit 1
fi

echo -e "  🔍 Semua instalasi yang terdeteksi:"
for ed in "${FOUND_EDITIONS[@]}"; do
    echo -e "     • ${CYAN}${ed}${RESET}"
done
echo ""
echo -e "  🎯 ${BOLD}${GREEN}Edisi Terpilih:${RESET} ${BOLD}${MAGENTA}${CHROME_EDITION}${RESET}"
echo -e "     Versi: ${BOLD}${CHROME_VERSION}${RESET}"
echo -e "     Lokasi: ${CHROME_BIN}"

# Tampilkan catatan edukasi jika menggunakan edisi biasa
if [[ "$CHROME_EDITION" == *"Biasa"* ]]; then
    echo -e "  ${YELLOW}💡 Tips: Anda menggunakan Chrome Biasa (Stable). Fitur Prompt API terbaru paling cepat${RESET}"
    echo -e "  ${YELLOW}   tersedia di Chrome Dev / Canary. Namun skrip ini akan tetap mencoba mengaktifkannya via flags!${RESET}"
fi
echo ""

# -------------------------------------------------------------------------
# 3. Memeriksa Ketersediaan Local Server
# -------------------------------------------------------------------------
echo -e "${BOLD}${CYAN}[3/4] Memeriksa Local Server (Port 8080 / 1234)...${RESET}"

TARGET_URL="http://127.0.0.1:8080/index.html"
SERVER_RUNNING=0

if curl --silent --fail --output /dev/null "http://127.0.0.1:8080/index.html" 2>/dev/null; then
    SERVER_RUNNING=1
    echo -e "  ${GREEN}✅ Local HTTP Server aktif di port 8080.${RESET}"
elif curl --silent --insecure --fail --output /dev/null "https://127.0.0.1:1234/api/network-info" 2>/dev/null; then
    SERVER_RUNNING=1
    TARGET_URL="https://127.0.0.1:1234/index.html"
    echo -e "  ${GREEN}✅ LAN AI Relay Server aktif di port 1234.${RESET}"
else
    echo -e "  ${YELLOW}ℹ️  Server lokal belum aktif. Memulai background HTTP Server (port 8080)...${RESET}"
    if command -v python3 &>/dev/null; then
        python3 -m http.server 8080 --bind 127.0.0.1 --directory "$SCRIPT_DIR" >/dev/null 2>&1 &
        sleep 1
        echo -e "  ${GREEN}✅ Python HTTP Server berhasil dinyalakan di background (PID: $!).${RESET}"
    fi
fi
echo ""

# -------------------------------------------------------------------------
# 4. Menyusun Chrome Flags & Meluncurkan Browser
# -------------------------------------------------------------------------
echo -e "${BOLD}${CYAN}[4/4] Meluncurkan ${CHROME_EDITION} dengan Flags AI On-Device...${RESET}"

AI_PROFILE_DIR="/tmp/chrome-on-device-ai-profile"
mkdir -p "$AI_PROFILE_DIR" 2>/dev/null || true

AI_FLAGS=(
    # 1. Flag Inti Chrome Built-in AI (Prompt API & Gemini Nano dengan bypass class performa)
    "--enable-features=OptimizationGuideOnDeviceModel:compatible_on_device_performance_classes/*,PromptAPIForGeminiNano,EnableWebGPU"
    
    # 2. Flag Evaluasi & Eksekusi Model On-Device
    "--optimization-guide-on-device-model-execution-eval=1"
    
    # 3. Flag Akselerasi WebGPU & Bypass Blocklist GPU
    "--enable-unsafe-webgpu"
    "--enable-webgpu-developer-features"
    "--ignore-gpu-blocklist"
    
    # 4. Gunakan direktori profil AI terisolasi (flags 100% aktif tanpa mengganggu profil utama Chrome)
    "--user-data-dir=${AI_PROFILE_DIR}"
    
    # 5. Halaman yang dibuka otomatis
    "$TARGET_URL"
    "chrome://components"
    "chrome://on-device-internals"
)

echo "Daftar flags yang disuntikkan:"
echo "  • OptimizationGuideOnDeviceModel (Bypass Performance Class)"
echo "  • PromptAPIForGeminiNano (Window.ai / Gemini Nano API)"
echo "  • EnableWebGPU & Developer Features (LiteRT-LM Engine)"
echo "  • Isolated Profile Directory: $AI_PROFILE_DIR"
echo ""

# Eksekusi Browser
"$CHROME_BIN" "${AI_FLAGS[@]}" >/dev/null 2>&1 &

echo -e "${BOLD}${GREEN}========================================================"
echo "🎉 ${CHROME_EDITION} Berhasil Dibuka!"
echo -e "========================================================${RESET}"
echo ""
echo -e "${BOLD}Panduan di Browser:${RESET}"
echo -e "  1. Pada tab ${CYAN}chrome://components${RESET}:"
echo "     Cari 'Optimization Guide On Device Model' dan klik 'Check for update'."
echo -e "  2. Pada tab ${CYAN}chrome://on-device-internals${RESET}:"
echo "     Periksa status model (harus 'Ready' setelah terunduh)."
echo -e "  3. Pada tab ${CYAN}AI Playground${RESET}:"
echo "     Pilih modul dan mulai jalankan AI langsung di browser Anda!"
echo ""
