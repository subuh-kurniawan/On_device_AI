# ⚙️ Panduan Setup Otomatis

Repositori ini telah dilengkapi dengan skrip instalasi otomatis lintas platform (*cross-platform setup scripts*). Skrip ini secara otomatis mempersiapkan seluruh kebutuhan lingkungan kerja tanpa konfigurasi rumit.

---

## 🛠️ Apa Saja yang Dilakukan Skrip Setup?

Saat Anda menjalankan skrip setup:
1. **Deteksi Package Manager Sistem**:
   - macOS: Menggunakan **Homebrew**.
   - Linux: Mendeteksi **APT** (Debian/Ubuntu), **DNF** (Fedora), atau **Pacman** (Arch).
   - Windows: Menggunakan **WinGet** atau PowerShell.
2. **Pemasangan Dependensi Esensial**: Memeriksa keberadaan `node`, `python3`, `openssl`, dan `git-lfs`, lalu memasangnya jika belum ada.
3. **Generate Sertifikat SSL Mandiri (Self-Signed HTTPS)**: Membuat berkas `key.pem` dan `cert.pem` dengan SAN (*Subject Alternative Name*) yang mencakup `localhost`, `127.0.0.1`, dan IP lokal jaringan Wi-Fi Anda.
4. **Verifikasi Integritas Model AI**: Menjalankan `verify_assets.py` untuk memastikan model ONNX lokal (*embedding*) bukan berkas *stub pointer* Git LFS (< 2 KB). Jika belum terunduh, skrip otomatis mengunduh dan mengekstrak bobot model utuh dari mirror server.
5. **Konfigurasi Izin Eksekusi**: Menyetel hak akses eksekusi (`chmod +x`) ke seluruh berkas skrip peluncur (`.sh`, `.command`, `.py`).

---

## 🚀 Cara Menjalankan Sesuai Sistem Operasi

### 🍏 Pengguna macOS
Ada dua cara mudah:
* **Cara 1 (Finder):** Buka folder proyek di Finder, lalu klik ganda (double-click) berkas `setup_mac.command`.
* **Cara 2 (Terminal):**
  ```bash
  chmod +x setup.sh setup_mac.command
  ./setup.sh
  ```

### 🐧 Pengguna Linux (Ubuntu/Debian/Fedora/Arch)
Buka terminal di direktori proyek dan jalankan:
```bash
chmod +x setup.sh
./setup.sh
```

### 🪟 Pengguna Windows
* **Cara 1 (File Explorer):** Klik ganda pada berkas `setup.bat`.
* **Cara 2 (PowerShell / Command Prompt):**
  ```cmd
  setup.bat
  ```

### 📦 Menggunakan NPM (Semua Platform)
Jika Anda sudah memasang Node.js:
```bash
npm run setup
```

---

## ✅ Indikator Keberhasilan Setup

Setelah skrip setup selesai berjalan, Anda akan melihat output konsol berikut:
- File `cert.pem` dan `key.pem` telah terbentuk di direktori utama.
- File model ONNX di dalam folder `nano_asset/` atau `models/` terverifikasi memiliki ukuran file sebenarnya (bukan pointer stub).
- Muncul pesan ucapan selamat dan instruksi untuk melanjutkan ke tahap peluncuran server.
