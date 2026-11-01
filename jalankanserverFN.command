#!/bin/bash
# =========================================================================
# Launcher EduVis / Gemma LAN AI Server (macOS Native Swift GUI)
# File: jalankanserverFN.command
# Klik ganda (double-click) file ini di Finder untuk membuka kontrol GUI native macOS.
# =========================================================================

set -e

# Berpindah ke direktori proyek ONDEVICEC
SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"

SWIFT_SRC="$SCRIPT_DIR/jalankanserverFN_gui.swift"
APP_BIN="$SCRIPT_DIR/jalankanserverFN_gui"

# 1. Periksa ketersediaan sumber kode Swift
if [ ! -f "$SWIFT_SRC" ]; then
    echo "❌ Berkas sumber Swift ($SWIFT_SRC) tidak ditemukan!"
    read -p "Tekan Enter untuk keluar..."
    exit 1
fi

# 2. Kompilasi aplikasi jika binary belum ada atau kode Swift baru saja diperbarui
NEED_COMPILE=0
if [ ! -f "$APP_BIN" ]; then
    NEED_COMPILE=1
elif [ "$SWIFT_SRC" -nt "$APP_BIN" ]; then
    NEED_COMPILE=1
fi

if [ $NEED_COMPILE -eq 1 ]; then
    echo "========================================================"
    echo "⚙️  Mengompilasi Swift macOS GUI (Pertama kali / Update)..."
    echo "========================================================"
    
    # Deteksi SDK macOS
    SDK_PATH="$(xcrun --show-sdk-path 2>/dev/null || echo /Library/Developer/CommandLineTools/SDKs/MacOSX.sdk)"
    CACHE_DIR="/tmp/swift-cache"
    mkdir -p "$CACHE_DIR"

    if command -v swiftc &>/dev/null; then
        swiftc -O -sdk "$SDK_PATH" -module-cache-path "$CACHE_DIR" "$SWIFT_SRC" -o "$APP_BIN"
        chmod +x "$APP_BIN"
        echo "✅ Kompilasi selesai."
    else
        echo "❌ Kompiler swiftc tidak ditemukan di sistem macOS Anda."
        echo "Pastikan Xcode Command Line Tools sudah terpasang (xcode-select --install)."
        read -p "Tekan Enter untuk keluar..."
        exit 1
    fi
fi

# 3. Sembunyikan / minimalkan jendela Terminal agar layar fokus ke jendela Swift GUI
(sleep 0.3 && osascript -e 'tell application "Terminal" to set miniaturized of front window to true' 2>/dev/null || true) &

# 4. Jalankan aplikasi GUI Swift Native
"$APP_BIN" "$@"
EXIT_CODE=$?

# 5. Tutup jendela terminal jika aplikasi GUI ditutup normal
if [ $EXIT_CODE -eq 0 ]; then
    osascript -e 'tell application "Terminal" to close (first window whose name contains "jalankanserverFN")' 2>/dev/null || true
fi

exit $EXIT_CODE
