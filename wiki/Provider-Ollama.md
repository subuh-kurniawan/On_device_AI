# 🦙 Provider: Ollama Local Server

Bagi pengguna yang membutuhkan model bahasa dengan parameter lebih besar (7B, 8B, 14B, hingga 70B) seperti **Llama 3**, **Mistral**, **DeepSeek-R1**, **Qwen 2.5**, atau **Gemma 2**, antarmuka obrolan menyediakan integrasi native ke server **Ollama**.

---

## 🚀 Prasyarat & Pemasangan Ollama

1. Unduh dan pasang Ollama dari situs resminya di [ollama.com](https://ollama.com).
2. Unduh model pilihan Anda melalui terminal:
   ```bash
   ollama run llama3
   # atau
   ollama run deepseek-r1:8b
   # atau
   ollama run mistral
   ```

---

## ⚠️ Konfigurasi Kritis: Pengaturan CORS (`OLLAMA_ORIGINS`)

Karena aplikasi playground berjalan di peramban web pada port tertentu (misal `http://localhost:8080`), browser akan memblokir permintaan AJAX ke endpoint Ollama (`http://localhost:11434`) kecuali Ollama mengizinkan Cross-Origin Resource Sharing (CORS).

### Cara Mengaktifkan CORS di Ollama:

#### 🍏 Di macOS:
Jika Ollama berjalan sebagai aplikasi latar belakang di menubar:
1. Keluar dari aplikasi Ollama (klik ikon Ollama di menubar > Quit).
2. Buka Terminal dan jalankan:
   ```bash
   launchctl setenv OLLAMA_ORIGINS "*"
   ```
3. Buka kembali aplikasi Ollama dari folder Applications.

#### 🐧 Di Linux (systemd):
1. Edit konfigurasi service Ollama:
   ```bash
   sudo systemctl edit ollama.service
   ```
2. Tambahkan baris konfigurasi berikut di bawah blok `[Service]`:
   ```ini
   [Service]
   Environment="OLLAMA_ORIGINS=*"
   ```
3. Simpan dan muat ulang service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart ollama
   ```

#### 🪟 Di Windows:
1. Tutup Ollama dari sistem tray.
2. Buka **Control Panel** > **System and Security** > **System** > **Advanced system settings** > **Environment Variables**.
3. Di bagian *User variables*, klik **New**:
   - Variable name: `OLLAMA_ORIGINS`
   - Variable value: `*`
4. Klik OK dan jalankan kembali Ollama dari Start Menu.

---

## ⚙️ Menghubungkan di Antarmuka Obrolan

1. Buka `obrolan-claude.html` atau `obrolan-claude-rag.html`.
2. Klik ikon **Settings** (roda gigi) di pojok atas.
3. Pilih Provider: **Ollama (Lokal)**.
4. Masukkan URL server: `http://localhost:11434` (default).
5. Pilih nama model dari dropdown (daftar model yang sudah terpasang akan terdeteksi otomatis!).
