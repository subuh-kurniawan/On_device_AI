#!/usr/bin/env bash
# =========================================================================
# 🛡️ Asset & Model Integrity Checker (macOS & Linux Launcher)
# =========================================================================
SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

if command -v python3 &>/dev/null; then
    python3 verify_assets.py
elif command -v python &>/dev/null; then
    python verify_assets.py
else
    echo "❌ Python3 tidak ditemukan di sistem Anda."
    echo "Silakan pasang Python3 terlebih dahulu untuk menjalankan verifikasi aset."
    exit 1
fi
