# ❓ Troubleshooting & FAQ (Tanya Jawab)

Daftar solusi untuk permasalahan teknis yang paling sering dijumpai saat menjalankan On_device_AI Playground.

---

## 🚩 Masalah Chrome Flags & Prompt API

### Q1: Prompt API (`window.ai`) tidak terdeteksi atau bernilai `undefined`?
* **Penyebab:**
  1. Flag belum diaktifkan atau browser belum di-*relaunch*.
  2. Versi Chrome terlalu lama (wajib Chrome 128+, sangat disarankan Chrome Dev atau Canary).
  3. Membuka berkas langsung dengan double click (`file:///path/to/file.html`).
* **Solusi:**
  1. Pastikan selalu membuka halaman via server lokal (`http://localhost:8080/index.html`).
  2. Periksa kembali `chrome://flags` dan pastikan kedua flag ini aktif:
     - `Optimization Guide On Device Model`: ubah ke **`Enabled BypassPerfRequirement`**.
     - `Prompt API for Gemini Nano`: ubah ke **`Enabled`**.
  3. Gunakan skrip peluncur otomatis `launch_chrome_mac.command` atau `launch_chrome_ai.bat` yang otomatis menginjeksi flags tersebut.

---

### Q2: Status Gemini Nano di `chrome://components` tidak mau mengunduh?
* **Penyebab:** Ruang penyimpanan disk tersisa kurang dari 10 GB, atau koneksi internet terputus.
* **Solusi:**
  1. Pastikan hard drive memiliki ruang kosong minimal 15 GB.
  2. Buka `chrome://components`, cari **Optimization Guide On Device Model**, lalu klik **Check for update**.
  3. Buka tab `chrome://on-device-internals` untuk memeriksa status log unduhan internal browser.

---

## ⚡ Masalah WebGPU & LiteRT-LM

### Q3: Halaman `mesin-litert-lm.html` menampilkan pesan "Model Simulasi Aktif"?
* **Penyebab:** Kegagalan mengunduh bundle JavaScript `@litert-lm/core` dari jaringan CDN publik (misal CDN terkena blokir atau masalah koneksi internet saat inisialisasi).
* **Solusi:**
  - Aplikasi telah dilengkapi fallback otomatis ke pustaka `@mediapipe/tasks-genai`.
  - Muat ulang (*hard reload*) halaman dengan menekan `Cmd+Shift+R` (Mac) atau `Ctrl+F5` (Windows).
  - Pastikan perangkat Anda mendukung WebGPU dengan membuka `chrome://gpu` (pastikan *WebGPU* berstatus *Hardware accelerated*).

---

## 🧠 Masalah In-Browser RAG & Embedding ONNX

### Q4: Muncul error "Invalid ONNX Model Header" saat memproses dokumen di RAG?
* **Penyebab:** Berkas model ONNX di folder `nano_asset/` berukuran kurang dari 2 KB karena merupakan pointer Git LFS yang belum terunduh utuh.
* **Solusi:**
  - Jalankan skrip verifikasi otomatis:
    ```bash
    python3 verify_assets.py
    ```
  - Skrip ini akan mendeteksi berkas stub dan otomatis mengunduh bobot model utuh dari mirror server resmi.

---

### Q5: Error CORS saat menghubungi server Ollama?
* **Penyebab:** Ollama menolak permintaan dari domain browser karena variable lingkungan `OLLAMA_ORIGINS` belum disetel.
* **Solusi:**
  - macOS: Jalankan `launchctl setenv OLLAMA_ORIGINS "*"` di Terminal lalu restart aplikasi Ollama.
  - Windows: Tambahkan System Environment Variable `OLLAMA_ORIGINS` dengan nilai `*`, lalu tutup dan buka kembali Ollama.
  - Baca panduan lengkap di: **[Provider: Ollama Local Server](Provider-Ollama)**.

---

### Q6: Peringatan keamanan "Koneksi Anda Tidak Privat" saat membuka via HP?
* **Penyebab:** Sertifikat SSL (`cert.pem`) dibuat secara mandiri (*self-signed*) untuk jaringan lokal, sehingga tidak ditandatangani oleh otoritas publik komersial.
* **Solusi:**
  - Ini adalah hal yang sepenuhnya normal dan aman pada jaringan lokal Anda sendiri.
  - Klik tombol **Lanjutan (Advanced)** di browser HP Anda, lalu pilih **Lanjutkan ke situs (Proceed / Accept Risk)**.
