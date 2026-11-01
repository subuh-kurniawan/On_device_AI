# 📦 Verifikasi Integritas Aset & Model

File: `verify_assets.py`, `verify_assets.sh`, `verify_assets.bat`

Model pembelajaran mesin lokal (seperti model embedding ONNX untuk RAG) memiliki ukuran berkas yang cukup besar (antara 20 MB hingga 150+ MB). Ketika pengguna mengkloning repositori dari GitHub tanpa memasang **Git LFS (Large File Storage)**, berkas yang terunduh hanyalah sebuah berkas teks penunjuk (*pointer stub*) berukuran kurang dari 2 KB:

```text
version https://git-lfs.github.com/spec/v1
oid sha256:4a8c9b...
size 23481230
```

Jika model berupa berkas pointer ini dimuat ke dalam browser, Transformers.js akan mengalami error kegagalan parsing (*Invalid ONNX model header*).

---

## 🛡️ Solusi: Skrip Verifikasi Otomatis

Untuk mencegah masalah ini, skrip `verify_assets.py` dibuat untuk memverifikasi integritas berkas aset model:

1. **Memeriksa Ukuran Berkas Fisik:**
   - Memindai berkas model `.onnx` di folder `nano_asset/` dan direktori terkait.
   - Jika ukuran berkas < 2 KB, berkas dideteksi sebagai Git LFS stub pointer.
2. **Pilihan Pemulihan Otomatis (Dual Source Mirror):**
   - **Sumber 1 (Server Mirror Cepat):** Mengunduh arsip `models.zip` langsung dari mirror server resmi.
   - **Sumber 2 (Google Drive Fallback):** Jika mirror server utama tidak dapat diakses, skrip otomatis beralih ke tautan cadangan Google Drive.
3. **Ekstraksi & Penempatan Otomatis:**
   - Mengekstrak isi arsip zip secara otomatis ke struktur direktori yang tepat dan menggantikan pointer stub dengan bobot biner model asli.
   - Menghapus berkas arsip zip sementara setelah selesai untuk menghemat ruang disk.

---

## 🏃 Cara Menjalankan Verifikasi Manual

Jika Anda ingin memeriksa status integritas model sewaktu-waktu:

* **Menggunakan Python langsung:**
  ```bash
  python3 verify_assets.py
  ```
* **macOS / Linux:**
  ```bash
  ./verify_assets.sh
  ```
* **Windows:**
  ```cmd
  verify_assets.bat
  ```
