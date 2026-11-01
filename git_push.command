#!/bin/bash
# =========================================================================
# Skrip Sekali Klik: Otomatis Commit & Push ke GitHub
# File: git_push.command
# Cukup klik ganda (double-click) file ini di Finder macOS.
# =========================================================================

# Berpindah ke direktori repositori
SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "========================================================"
echo "🚀 Auto-Push ke GitHub (On_device_AI)"
echo "📁 Direktori: $SCRIPT_DIR"
echo "========================================================"
echo ""

# 1. Pastikan direktori adalah repositori git
if [ ! -d ".git" ]; then
    echo "❌ Direktori ini bukan repositori git!"
    read -p "Tekan [Enter] untuk keluar..."
    exit 1
fi

# 2. Cek status perubahan berkas
echo "🔍 Memeriksa status repositori..."
CHANGES=$(git status --porcelain)
UNPUSHED=$(git log origin/main..HEAD --oneline 2>/dev/null)

if [ -z "$CHANGES" ] && [ -z "$UNPUSHED" ]; then
    echo "✅ Repositori bersih! Tidak ada perubahan baru atau commit tertunda."
    echo "🌐 Repositori lokal sudah sinkron dengan GitHub."
    echo ""
    read -p "Tekan [Enter] untuk menutup..."
    exit 0
fi

# 3. Jika ada perubahan berkas, lakukan staging & commit
if [ -n "$CHANGES" ]; then
    echo "📝 Ditemukan perubahan berkas:"
    git status -s
    echo ""
    
    # Input pesan commit (opsional, tekan enter untuk default)
    DEFAULT_MSG="Pembaruan: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "💬 Masukkan pesan commit (tekan Enter untuk default):"
    echo "   Default: \"$DEFAULT_MSG\""
    read -p "> " COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="$DEFAULT_MSG"
    fi
    
    echo ""
    echo "📦 Menambahkan berkas ke staging (git add -A)..."
    git add -A
    
    echo "💾 Membuat commit: \"$COMMIT_MSG\"..."
    git commit -m "$COMMIT_MSG"
    echo ""
fi

# 4. Push ke remote origin
BRANCH=$(git branch --show-current)
if [ -z "$BRANCH" ]; then
    BRANCH="main"
fi

echo "⬆️  Mengunggah perubahan ke GitHub (origin/$BRANCH)..."
if git push origin "$BRANCH"; then
    echo ""
    echo "========================================================"
    echo "🎉 Berhasil! Seluruh pembaruan telah ter-push ke GitHub."
    echo "========================================================"
else
    echo ""
    echo "========================================================"
    echo "❌ Push gagal! Periksa koneksi internet atau otentikasi token."
    echo "========================================================"
fi

echo ""
read -p "Tekan [Enter] untuk menutup jendela ini..."
