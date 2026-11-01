# 📋 Catatan Rilis (Changelog)

Semua riwayat pembaruan penting pada proyek **Chrome On-Device AI Playground** didokumentasikan di halaman ini.

---

## 🌟 Versi 2.1.0 (2026-11-02)

### ✨ Fitur Baru & Peningkatan
* **Dukungan Tri-Bahasa Landing Page (ID, EN, JV) & Welcome Language Modal:**
  - Modal selamat datang interaktif pada kunjungan pertama di `index.html` dengan fitur simpan preferensi bahasa.
  - Dropdown bahasa 3 arah (`[🇮🇩 ID ▾]`, `[🇬🇧 EN ▾]`, `[ꦗꦮ JV ▾]`) di bilah atas apung 46px ramah layar seluler (*mobile-first non-stacking design*).
  - Halaman penuh berbahasa Jawa (`index_jv.html`) bertata bahasa Krama Madya baku untuk seluruh 18 kartu modul aplikasi.
  - Halaman penuh berbahasa Inggris (`index_en.html`).
* **Simulasi Pipeline Arsitektur Interaktif SVG & Live Metrics:**
  - Diagram arsitektur interaktif 4-lapisan berbasis SVG animasi dengan tombol uji coba alur (Teks & Kode, Dokumen RAG, Analisis Gambar).
  - Bar metrik langsung yang memperbarui latensi, status RAM privasi, dan akselerasi hardware secara real-time.
* **Skrip Verifikasi Integritas Aset & Pengunduh Model Otomatis (`verify_assets.py`):**
  - Pemeriksa integritas model embedding ONNX lokal untuk mendeteksi *pointer stub* Git LFS (< 2 KB).
  - Pengunduh otomatis arsip model dari cermin server resmi dan Google Drive dengan ekstraksi otomatis.
* **Penyempurnaan Sistem In-Browser RAG & Vector Knowledge Base:**
  - Pilihan dual embedding model: `all-MiniLM-L6-v2` (22 MB, cepat) dan `multilingual-e5-small` (118 MB, presisi tinggi multibahasa) dengan fitur *1-click re-index*.
  - *Smart header-aware chunking* yang menjaga hierarki heading Markdown dan nomor halaman dokumen PDF.
  - *Hybrid Search Engine* (Kombinasi Cosine Similarity 65% + Lexical BM25 35%).
  - Sitasi sumber akurat dengan *page pills* (`Hal. X`) dan skor relevansi transparan.
  - Tombol *Strict Anti-Hallucination Mode*.
* **Perbaikan Navigasi Tab Sistem Operasi:**
  - Inisialisasi awal (*early execution*) untuk tab sistem operasi (macOS, Windows, Linux) pada bagian Quickstart bebas lag.

---

## 🌟 Versi 2.0.0 (2026-11-02)

### ✨ Fitur Baru & Peningkatan
* **Peluncur Chrome Otomatis Multi-Platform:**
  - Skrip cerdas pendeteksi varian Chrome (`launch_chrome_ai.sh`, `launch_chrome_mac.command`, `launch_chrome_ai.bat`).
  - Menjalankan Chrome dengan flags AI aktif pada direktori profil pengguna terisolasi.
* **Skrip Instalasi Dependensi Otomatis Lintas Platform (`setup.sh`, `setup_mac.command`, `setup.bat`):**
  - Deteksi dan instalasi otomatis Node.js, Python 3, OpenSSL, dan Git LFS untuk macOS, Linux, dan Windows.
  - Generate sertifikat mandiri SSL lokal (`cert.pem` & `key.pem`) dengan Subject Alternative Name (SAN).
* **Peluncur Native macOS Swift GUI (`jalankanserverFN.command` & `jalankanserverFN_gui.swift`):**
  - Aplikasi kontrol server native macOS yang otomatis dikompilasi via `swiftc`.
* **Skrip Git Sekali Klik (`git_push.command`):**
  - Skrip praktis satu-klik di macOS Finder untuk mempermudah pembaruan ke repositori GitHub.
