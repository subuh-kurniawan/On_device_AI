#!/usr/bin/env python3
# =============================================================================
# 🛡️ Asset & Model Integrity Checker & Auto-Downloader
# Proyek: Chrome On-Device AI Playground
# File: verify_assets.py
# Kompatibilitas: Python 3.6+ (macOS, Windows, Linux) - Tanpa dependensi pihak ketiga
# =============================================================================

import os
import sys
import shutil
import urllib.request
import urllib.error
import zipfile

# Definisi Warna Terminal
try:
    if os.name == 'nt':
        os.system('color')
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    RESET = '\033[0m'
except Exception:
    GREEN = YELLOW = CYAN = RED = BOLD = RESET = ''

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(SCRIPT_DIR, 'nano_asset', 'models')
ASSETS_JS_DIR = os.path.join(SCRIPT_DIR, 'nano_asset', 'assets', 'js')

# Daftar berkas krusial & ukuran minimum valid (dalam byte)
CRITICAL_ASSETS = [
    {
        'path': os.path.join(MODELS_DIR, 'multilingual-e5-small', 'onnx', 'model_quantized.onnx'),
        'name': 'Model multilingual-e5-small (ONNX)',
        'min_size': 50 * 1024 * 1024,  # min 50MB (asli ~118MB)
        'category': 'model'
    },
    {
        'path': os.path.join(MODELS_DIR, 'all-MiniLM-L6-v2', 'onnx', 'model_quantized.onnx'),
        'name': 'Model all-MiniLM-L6-v2 (ONNX)',
        'min_size': 10 * 1024 * 1024,  # min 10MB (asli ~23MB)
        'category': 'model'
    },
    {
        'path': os.path.join(ASSETS_JS_DIR, 'pyodide.asm.wasm'),
        'name': 'Pyodide WebAssembly Engine',
        'min_size': 5 * 1024 * 1024,   # min 5MB (asli ~9MB)
        'category': 'runtime'
    },
    {
        'path': os.path.join(ASSETS_JS_DIR, 'mermaid.min.js'),
        'name': 'Mermaid Diagram Engine',
        'min_size': 1 * 1024 * 1024,   # min 1MB (asli ~3.3MB)
        'category': 'runtime'
    }
]

DOWNLOAD_SOURCES = [
    {
        'name': 'Mirror Utama (agendakelas.my.id)',
        'url': 'https://agendakelas.my.id/models.zip'
    },
    {
        'name': 'Mirror Google Drive Direct',
        'url': 'https://drive.usercontent.google.com/download?id=1UPM-az2Y5VIkzoBuPB06CDLj3IiQkZL-&export=download'
    },
    {
        'name': 'Mirror Google Drive Fallback',
        'url': 'https://docs.google.com/uc?export=download&id=1UPM-az2Y5VIkzoBuPB06CDLj3IiQkZL-'
    }
]


def is_lfs_pointer(file_path):
    """Mendeteksi apakah file hanya berupa stub Git LFS pointer text (< 500 byte)."""
    if not os.path.exists(file_path):
        return False
    size = os.path.getsize(file_path)
    if size < 500:
        try:
            with open(file_path, 'rb') as f:
                header = f.read(100)
                return b'version https://git-lfs.github.com' in header
        except Exception:
            return False
    return False


def check_assets_status():
    """Memeriksa integritas setiap berkas aset."""
    missing_or_corrupt = []
    print(f"\n{BOLD}{CYAN}🔍 Memeriksa Integritas Folder Aset & Model AI...{RESET}")
    print("-" * 65)

    for item in CRITICAL_ASSETS:
        p = item['path']
        rel_p = os.path.relpath(p, SCRIPT_DIR)
        name = item['name']

        if not os.path.exists(p):
            print(f" {RED}❌ [HILANG]{RESET} {name}\n    Path: {rel_p}")
            missing_or_corrupt.append((item, 'File tidak ditemukan'))
        elif is_lfs_pointer(p):
            size = os.path.getsize(p)
            print(f" {YELLOW}⚠️  [LFS POINTER]{RESET} {name} (Hanya {size} byte stub teks)\n    Path: {rel_p}")
            missing_or_corrupt.append((item, 'Git LFS pointer stub'))
        elif os.path.getsize(p) < item['min_size']:
            size_mb = os.path.getsize(p) / (1024 * 1024)
            print(f" {YELLOW}⚠️  [TIDAK LENGKAP]{RESET} {name} ({size_mb:.2f} MB, di bawah batas minimum)\n    Path: {rel_p}")
            missing_or_corrupt.append((item, 'Ukuran file tidak wajar'))
        else:
            size_mb = os.path.getsize(p) / (1024 * 1024)
            print(f" {GREEN}✅ [LENGKAP]{RESET} {name} ({size_mb:.2f} MB)")

    print("-" * 65)
    return missing_or_corrupt


def download_with_progress(url, dest_path):
    """Mengunduh berkas dengan indikator progress di terminal."""
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req, timeout=30) as response, open(dest_path, 'wb') as out_file:
        total_size = response.headers.get('Content-Length')
        total_size = int(total_size) if total_size and total_size.isdigit() else 0
        downloaded = 0
        block_size = 64 * 1024  # 64KB per chunk

        while True:
            buffer = response.read(block_size)
            if not buffer:
                break
            downloaded += len(buffer)
            out_file.write(buffer)

            if total_size > 0:
                percent = (downloaded / total_size) * 100
                mb_down = downloaded / (1024 * 1024)
                mb_total = total_size / (1024 * 1024)
                bar_len = 30
                filled = int(bar_len * downloaded / total_size)
                bar = '█' * filled + '░' * (bar_len - filled)
                sys.stdout.write(f"\r  [{bar}] {percent:.1f}% ({mb_down:.1f}/{mb_total:.1f} MB)")
            else:
                mb_down = downloaded / (1024 * 1024)
                sys.stdout.write(f"\r  Mengunduh: {mb_down:.1f} MB...")
            sys.stdout.flush()
    print("\n")


def print_manual_guide():
    """Menampilkan panduan pemulihan manual jika proses unduh otomatis gagal."""
    print(f"\n{BOLD}{YELLOW}========================================================================{RESET}")
    print(f"{BOLD}📖 PANDUAN MANUAL (MANUAL REPAIR GUIDE){RESET}")
    print(f"{BOLD}{YELLOW}========================================================================{RESET}")
    print("Jika unduhan otomatis gagal karena pembatasan jaringan / firewall:")
    print("1. Unduh berkas model secara manual dari salah satu tautan berikut:")
    print(f"   • {CYAN}https://agendakelas.my.id/models.zip{RESET}")
    print(f"   • {CYAN}https://drive.google.com/file/d/1UPM-az2Y5VIkzoBuPB06CDLj3IiQkZL-/view?usp=sharing{RESET}")
    print("\n2. Ekstrak seluruh isi file models.zip ke dalam folder:")
    print(f"   📁 {BOLD}{os.path.relpath(MODELS_DIR, SCRIPT_DIR)}/{RESET}")
    print("\n3. Jalankan kembali skrip ini untuk memastikan integritas:")
    print(f"   {GREEN}python3 verify_assets.py{RESET}")
    print(f"{BOLD}{YELLOW}========================================================================{RESET}\n")


def try_git_lfs_pull():
    """Mencoba git lfs pull jika repositori memiliki git terpasang."""
    if shutil.which('git'):
        try:
            print(f"\n{CYAN}⚡ Mencoba menjalankan 'git lfs pull'...{RESET}")
            ret = os.system("git lfs pull")
            if ret == 0:
                print(f"{GREEN}✅ Git LFS pull berhasil!{RESET}")
                return True
        except Exception:
            pass
    return False


def main():
    print(f"{BOLD}{GREEN}========================================================================")
    print("🛡️  Chrome On-Device AI Playground - Asset & Model Integrity Guard")
    print(f"========================================================================{RESET}")

    missing = check_assets_status()

    if not missing:
        print(f"\n{BOLD}{GREEN}🎉 SEMUA ASET LENGKAP & VALID!{RESET}")
        print("Model AI lokal siap dijalankan dengan performa penuh tanpa kendala.\n")
        return 0

    has_model_issue = any(item['category'] == 'model' for item, _ in missing)

    if has_model_issue:
        print(f"\n{BOLD}{YELLOW}⚠️  Ditemukan berkas model AI yang belum lengkap atau masih berupa Git LFS pointer.{RESET}")
        
        # Opsi 1: Coba git lfs pull terlebih dahulu
        if try_git_lfs_pull():
            missing_after_lfs = check_assets_status()
            if not missing_after_lfs:
                print(f"\n{BOLD}{GREEN}🎉 Seluruh berkas model berhasil ditarik via Git LFS!{RESET}\n")
                return 0

        # Opsi 2: Unduh otomatis models.zip
        print(f"\n{BOLD}{CYAN}📥 Memulai pengunduhan otomatis paket model AI (models.zip)...{RESET}")
        temp_zip = os.path.join(SCRIPT_DIR, 'models_temp.zip')
        download_success = False

        for source in DOWNLOAD_SOURCES:
            src_name = source['name']
            src_url = source['url']
            print(f"\n{CYAN}🌐 Mencoba sumber: {BOLD}{src_name}{RESET}...")
            try:
                download_with_progress(src_url, temp_zip)
                # Periksa apakah file zip valid
                if os.path.exists(temp_zip) and os.path.getsize(temp_zip) > 10 * 1024 * 1024:
                    print(f"{GREEN}✅ Unduhan berhasil ({os.path.getsize(temp_zip) / (1024 * 1024):.1f} MB).{RESET}")
                    download_success = True
                    break
                else:
                    print(f"{YELLOW}⚠️  File yang diunduh terlalu kecil atau terpotong. Mencoba mirror lain...{RESET}")
                    if os.path.exists(temp_zip):
                        os.remove(temp_zip)
            except Exception as e:
                print(f"{RED}❌ Gagal mengunduh dari sumber ini:{RESET} {e}")
                if os.path.exists(temp_zip):
                    try:
                        os.remove(temp_zip)
                    except Exception:
                        pass

        if download_success:
            print(f"\n{CYAN}📦 Mengekstrak paket model ke: {BOLD}{os.path.relpath(MODELS_DIR, SCRIPT_DIR)}/{RESET}...")
            try:
                os.makedirs(MODELS_DIR, exist_ok=True)
                with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
                    zip_ref.extractall(MODELS_DIR)
                print(f"{GREEN}✅ Ekstraksi selesai!{RESET}")
            except Exception as e:
                print(f"{RED}❌ Gagal mengekstrak zip:{RESET} {e}")
            finally:
                if os.path.exists(temp_zip):
                    try:
                        os.remove(temp_zip)
                    except Exception:
                        pass

            # Verifikasi ulang
            final_missing = check_assets_status()
            if not final_missing:
                print(f"\n{BOLD}{GREEN}🎉 SELAMAT! Seluruh model AI lokal berhasil dipasang & diverifikasi.{RESET}\n")
                return 0
            else:
                print(f"\n{YELLOW}⚠️  Beberapa berkas masih belum sesuai setelah ekstraksi.{RESET}")
                print_manual_guide()
                return 1
        else:
            print(f"\n{RED}❌ Seluruh mirror unduhan otomatis tidak dapat dijangkau.{RESET}")
            print_manual_guide()
            return 1

    return 0


if __name__ == '__main__':
    sys.exit(main())
