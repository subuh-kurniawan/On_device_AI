#!/usr/bin/env bash
# =========================================================================
# 🛠️ Setup & Automated Dependency Installer (macOS & Linux)
# Proyek: Chrome On-Device AI Playground
# File: setup.sh
# =========================================================================

set -e

# Warna Terminal
BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BOLD}${CYAN}========================================================"
echo "🚀 Chrome On-Device AI Playground - Auto Setup"
echo -e "📁 Direktori: ${SCRIPT_DIR}${RESET}"
echo -e "${BOLD}${CYAN}========================================================${RESET}"
echo ""

# 1. Deteksi Sistem Operasi
OS_TYPE="$(uname -s)"
echo -e "${CYAN}🔍 Mendeteksi Sistem Operasi:${RESET} ${BOLD}${OS_TYPE}${RESET}"

install_macos_deps() {
    echo -e "${CYAN}🍎 Memeriksa dependensi macOS...${RESET}"

    # Periksa Homebrew
    if ! command -v brew &>/dev/null; then
        echo -e "${YELLOW}⚠️  Homebrew belum terpasang.${RESET}"
        read -p "Apakah Anda ingin memasang Homebrew otomatis? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${CYAN}⏳ Memasang Homebrew...${RESET}"
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv 2>/dev/null || true)"
        else
            echo -e "${YELLOW}Silakan pasang Node.js & OpenSSL secara manual jika belum ada.${RESET}"
        fi
    fi

    # Node.js
    if ! command -v node &>/dev/null; then
        echo -e "${YELLOW}⚠️  Node.js belum ditemukan. Memasang via Homebrew...${RESET}"
        brew install node
    else
        echo -e "${GREEN}✅ Node.js terdeteksi:${RESET} $(node -v)"
    fi

    # Python3
    if ! command -v python3 &>/dev/null; then
        echo -e "${YELLOW}⚠️  Python3 belum ditemukan. Memasang via Homebrew...${RESET}"
        brew install python3
    else
        echo -e "${GREEN}✅ Python3 terdeteksi:${RESET} $(python3 --version)"
    fi

    # OpenSSL
    if ! command -v openssl &>/dev/null; then
        echo -e "${YELLOW}⚠️  OpenSSL belum ditemukan. Memasang via Homebrew...${RESET}"
        brew install openssl
    else
        echo -e "${GREEN}✅ OpenSSL terdeteksi:${RESET} $(openssl version)"
    fi

    # Git LFS
    if ! command -v git-lfs &>/dev/null; then
        echo -e "${YELLOW}⚠️  Git LFS belum ditemukan. Memasang via Homebrew...${RESET}"
        brew install git-lfs
    else
        echo -e "${GREEN}✅ Git LFS terdeteksi:${RESET} $(git-lfs --version | head -n1)"
    fi

    # Xcode Command Line Tools (untuk swiftc GUI launcher)
    if ! command -v swiftc &>/dev/null; then
        echo -e "${YELLOW}⚠️  Kompiler swiftc belum ditemukan. Meminta instalasi Command Line Tools...${RESET}"
        xcode-select --install 2>/dev/null || true
    else
        echo -e "${GREEN}✅ Kompiler Swift terdeteksi:${RESET} $(swiftc --version | head -n1)"
    fi
}

install_linux_deps() {
    echo -e "${CYAN}🐧 Memeriksa dependensi Linux...${RESET}"

    # Deteksi Package Manager
    if command -v apt-get &>/dev/null; then
        PKG_MNGR="apt"
    elif command -v dnf &>/dev/null; then
        PKG_MNGR="dnf"
    elif command -v pacman &>/dev/null; then
        PKG_MNGR="pacman"
    else
        PKG_MNGR="unknown"
    fi

    echo -e "${CYAN}📦 Package Manager terdeteksi:${RESET} ${BOLD}${PKG_MNGR}${RESET}"

    MISSING_PKGS=()

    if ! command -v node &>/dev/null; then MISSING_PKGS+=("nodejs" "npm"); fi
    if ! command -v python3 &>/dev/null; then MISSING_PKGS+=("python3"); fi
    if ! command -v openssl &>/dev/null; then MISSING_PKGS+=("openssl"); fi
    if ! command -v git-lfs &>/dev/null; then MISSING_PKGS+=("git-lfs"); fi

    if [ ${#MISSING_PKGS[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Paket berikut belum terpasang: ${MISSING_PKGS[*]}${RESET}"
        read -p "Pasang paket tersebut sekarang menggunakan sudo? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            case $PKG_MNGR in
                apt)
                    sudo apt-get update
                    sudo apt-get install -y "${MISSING_PKGS[@]}"
                    ;;
                dnf)
                    sudo dnf install -y "${MISSING_PKGS[@]}"
                    ;;
                pacman)
                    sudo pacman -Sy --noconfirm "${MISSING_PKGS[@]}"
                    ;;
                *)
                    echo -e "${RED}❌ Tidak dapat menginstal otomatis. Silakan pasang: ${MISSING_PKGS[*]}${RESET}"
                    ;;
            esac
        fi
    else
        echo -e "${GREEN}✅ Seluruh dependensi dasar (Node.js, Python3, OpenSSL, Git LFS) sudah terpasang.${RESET}"
    fi
}

# Jalankan installer sesuai OS
if [ "$OS_TYPE" = "Darwin" ]; then
    install_macos_deps
elif [ "$OS_TYPE" = "Linux" ]; then
    install_linux_deps
else
    echo -e "${YELLOW}⚠️  Sistem operasi tidak dikenal: $OS_TYPE. Melanjutkan pemeriksaan file lokal...${RESET}"
fi

echo ""
echo -e "${BOLD}${CYAN}--------------------------------------------------------${RESET}"
echo -e "${BOLD}🔒 Memeriksa & Mengenerate Sertifikat SSL Lokal (HTTPS/WSS)${RESET}"
echo -e "${BOLD}${CYAN}--------------------------------------------------------${RESET}"

# 2. Pembuatan Sertifikat SSL (Self-Signed) untuk Localhost & LAN
if [ -f "key.pem" ] && [ -f "cert.pem" ]; then
    echo -e "${GREEN}✅ Sertifikat SSL sudah ada:${RESET} key.pem & cert.pem"
else
    echo -e "${YELLOW}⚠️  Sertifikat SSL belum ada. Membuat sertifikat mandiri (365 hari)...${RESET}"
    
    # Deteksi IP lokal untuk dimasukkan ke Subject Alternative Name (SAN)
    LOCAL_IP=""
    if [ "$OS_TYPE" = "Darwin" ]; then
        LOCAL_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")"
    else
        LOCAL_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")"
    fi

    SAN_ATTR="DNS:localhost,IP:127.0.0.1"
    if [ -n "$LOCAL_IP" ]; then
        SAN_ATTR="${SAN_ATTR},IP:${LOCAL_IP}"
        echo -e "${CYAN}🌐 Menyertakan IP LAN ke sertifikat:${RESET} ${BOLD}${LOCAL_IP}${RESET}"
    fi

    # Pembuatan sertifikat via openssl
    openssl req -x509 -newkey rsa:2048 -nodes -sha256 \
        -subj '/CN=localhost' \
        -addext "subjectAltName=${SAN_ATTR}" \
        -keyout key.pem -out cert.pem -days 365 2>/dev/null || \
    openssl req -x509 -newkey rsa:2048 -nodes -sha256 \
        -subj '/CN=localhost' \
        -keyout key.pem -out cert.pem -days 365

    chmod 600 key.pem 2>/dev/null || true
    chmod 644 cert.pem 2>/dev/null || true
    echo -e "${GREEN}✅ Sertifikat SSL berhasil dibuat:${RESET} key.pem & cert.pem"
fi

echo ""
echo -e "${BOLD}${CYAN}--------------------------------------------------------${RESET}"
echo -e "${BOLD}📦 Memeriksa Bobot Model AI & Integritas Aset${RESET}"
echo -e "${BOLD}${CYAN}--------------------------------------------------------${RESET}"

# 3. Jalankan Skrip Integritas Aset & Auto-Downloader
if command -v python3 &>/dev/null; then
    python3 verify_assets.py || true
elif command -v python &>/dev/null; then
    python verify_assets.py || true
elif command -v git-lfs &>/dev/null; then
    echo -e "${CYAN}⏳ Menginisialisasi Git LFS & mengunduh model jika diperlukan...${RESET}"
    git lfs install --skip-repo 2>/dev/null || git lfs install || true
    git lfs pull || true
    echo -e "${GREEN}✅ Model AI lokal siap.${RESET}"
else
    echo -e "${YELLOW}⚠️  Python3 atau Git LFS belum terpasang. Jalankan ./verify_assets.sh untuk verifikasi model.${RESET}"
fi

# 4. Beri Izin Eksekusi untuk Seluruh Skrip Peluncur
echo ""
echo -e "${CYAN}⚙️  Menyetel izin eksekusi skrip (*.command, *.sh)...${RESET}"
chmod +x *.command *.sh 2>/dev/null || true
echo -e "${GREEN}✅ Izin eksekusi disetel.${RESET}"

echo ""
echo -e "${BOLD}${GREEN}========================================================"
echo "🎉 Setup Selesai! Lingkungan Anda Siap Digunakan."
echo -e "========================================================${RESET}"
echo ""
echo -e "${BOLD}Cara Menjalankan Aplikasi:${RESET}"
if [ "$OS_TYPE" = "Darwin" ]; then
    echo -e "  1. ${CYAN}Klik ganda jalankanserverFN.command${RESET} (Mac Native Swift GUI Launcher)"
    echo -e "  2. Atau jalankan: ${CYAN}./start_mac.command${RESET}"
else
    echo -e "  1. Jalankan server: ${CYAN}node nano_asset/assets/js/relay.js 1234${RESET}"
    echo -e "  2. Atau server web: ${CYAN}python3 -m http.server 8080${RESET}"
fi
echo ""
read -p "Tekan [Enter] untuk menutup..."
