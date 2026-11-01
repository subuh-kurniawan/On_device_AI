#!/bin/bash
# =========================================================================
# Skrip Sekali Klik: Sinkronisasi & Unggah Wiki ke GitHub Wiki
# File: push_wiki.command
# Target: https://github.com/subuh-kurniawan/On_device_AI.wiki.git
# Cukup klik ganda (double-click) file ini di Finder macOS.
# =========================================================================

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

WIKI_SRC="$SCRIPT_DIR/wiki"
WIKI_REPO_URL="https://github.com/subuh-kurniawan/On_device_AI.wiki.git"
WIKI_LOCAL_DIR="$SCRIPT_DIR/.wiki_git"

echo "========================================================"
echo "📚 Auto-Deploy & Push GitHub Wiki (On_device_AI)"
echo "📁 Sumber Berkas: $WIKI_SRC"
echo "🌐 URL Remote Wiki: $WIKI_REPO_URL"
echo "========================================================"
echo ""

# 1. Pastikan folder wiki ada
if [ ! -d "$WIKI_SRC" ]; then
    echo "❌ Direktori $WIKI_SRC tidak ditemukan!"
    read -p "Tekan [Enter] untuk keluar..."
    exit 1
fi

# 2. Ambil identitas git dari repositori utama
GIT_NAME=$(git -C "$SCRIPT_DIR" config user.name 2>/dev/null)
GIT_EMAIL=$(git -C "$SCRIPT_DIR" config user.email 2>/dev/null)

if [ -z "$GIT_NAME" ]; then
    GIT_NAME="Subuh Kurniawan"
fi
if [ -z "$GIT_EMAIL" ]; then
    GIT_EMAIL="52267005+subuh-kurniawan@users.noreply.github.com"
fi

# 3. Siapkan repositori lokal wiki
echo "🔄 Menyiapkan repositori wiki lokal..."

if [ ! -d "$WIKI_LOCAL_DIR/.git" ]; then
    echo "📥 Mengkloning repositori GitHub Wiki..."
    rm -rf "$WIKI_LOCAL_DIR"
    if git clone "$WIKI_REPO_URL" "$WIKI_LOCAL_DIR" 2>/dev/null; then
        echo "✅ Berhasil mengkloning repositori wiki yang sudah ada."
    else
        echo "ℹ️  Repositori wiki belum pernah di-clone atau belum diinisialisasi di web GitHub."
        echo "🔨 Menginisialisasi repositori git wiki baru secara lokal..."
        mkdir -p "$WIKI_LOCAL_DIR"
        cd "$WIKI_LOCAL_DIR" || exit 1
        git init -b master
        git remote add origin "$WIKI_REPO_URL"
        cd "$SCRIPT_DIR" || exit 1
    fi
else
    echo "🔄 Memperbarui repositori wiki lokal (git pull)..."
    cd "$WIKI_LOCAL_DIR" || exit 1
    git pull origin master 2>/dev/null || true
    cd "$SCRIPT_DIR" || exit 1
fi

cd "$WIKI_LOCAL_DIR" || exit 1

# Konfigurasikan identitas commit untuk repositori wiki lokal
git config user.name "$GIT_NAME"
git config user.email "$GIT_EMAIL"

# 4. Salin semua berkas dari wiki/ ke repositori wiki
echo "📋 Menyalin dokumen wiki terbaru..."
cp -R "$WIKI_SRC"/*.md "$WIKI_LOCAL_DIR/" 2>/dev/null || true

# 5. Cek commit dan status perubahan
git add -A
CHANGES=$(git status --porcelain)
HAS_COMMITS=$(git log -1 --oneline 2>/dev/null)

if [ -z "$CHANGES" ] && [ -n "$HAS_COMMITS" ]; then
    echo "✅ Semua dokumen wiki sudah di-commit."
else
    COMMIT_MSG="Update wiki documentation: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "💾 Membuat commit: \"$COMMIT_MSG\"..."
    git commit -m "$COMMIT_MSG"
fi

# Pastikan berada di branch master
git branch -M master

# 6. Push ke remote origin
echo ""
echo "⬆️  Mengunggah pembaruan ke GitHub Wiki ($WIKI_REPO_URL)..."
if git push -u origin master 2>/dev/null || git push -u origin master --force; then
    echo ""
    echo "========================================================"
    echo "🎉 Berhasil! Seluruh dokumen wiki telah aktif di:"
    echo "👉 https://github.com/subuh-kurniawan/On_device_AI/wiki"
    echo "========================================================"
else
    echo ""
    echo "========================================================"
    echo "⚠️  Catatan Jika Push Ditolak Oleh GitHub:"
    echo "1. Pastikan fitur Wiki telah diaktifkan di repositori GitHub:"
    echo "   Buka https://github.com/subuh-kurniawan/On_device_AI/settings"
    echo "   Di bagian 'Features', centang kotak 'Wikis'."
    echo ""
    echo "2. Jika wiki belum pernah memiliki halaman pertama:"
    echo "   Buka https://github.com/subuh-kurniawan/On_device_AI/wiki"
    echo "   Klik tombol hijau 'Create the first page', ketik judul apa saja,"
    echo "   lalu klik 'Save Page'."
    echo ""
    echo "3. Setelah itu, jalankan kembali push_wiki.command ini!"
    echo "   Seluruh 22 halaman lengkap akan otomatis menimpa dan terpasang rapi."
    echo "========================================================"
fi

echo ""
read -p "Tekan [Enter] untuk menutup jendela ini..."
