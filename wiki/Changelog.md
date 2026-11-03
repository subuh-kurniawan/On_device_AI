# 📋 Catatan Rilis (Changelog)

Semua riwayat pembaruan penting pada proyek **Chrome On-Device AI Playground** didokumentasikan di halaman ini.

---

## 🌟 Versi 2.2.0 (2026-11-03)

### ✨ Fitur Baru & Peningkatan
* **Integrasi Mesin WebLLM In-Browser WebGPU & Model Penalaran DeepSeek-R1 (`mesin-web-llm.html`):**
  - Eksekusi model SLM open-weights secara native pada GPU pengguna tanpa server menggunakan `@mlc-ai/web-llm`.
  - **Dukungan DeepSeek-R1-Distill-1.5B**: Dilengkapi perender alur penalaran interaktif *Thinking Box* (`<think> ... </think>`) dengan pengukur waktu berpikir otomatis.
  - **Mode JSON Terstruktur dengan XGrammar**: Pemaksaan skema JSON (*constrained decoding*) yang menjamin output model 100% valid sesuai skema JSON tanpa *syntax error*.
  - Pilihan 7 model: `DeepSeek-R1-Distill-1.5B`, `SmolLM2-360M`, `Qwen2.5-0.5B`, `Llama-3.2-1B`, `SmolLM2-1.7B`, `Qwen2.5-1.5B`, dan `Llama-3.2-3B`.
  - Download & cache progress bar dengan penyimpanan permanen IndexedDB/Cache API.
  - Metrik kecepatan langsung (*tokens/second*), latensi TTFT, dan inspektur adapter WebGPU.
* **Aplikasi Vision Multimodal In-Browser WebGPU Baru (`analisis-vision-webgpu.html`):**
  - Mengintegrasikan fondasi VLM (*Vision-Language Model*) **Florence-2** via `@huggingface/transformers` v3 dengan akselerasi penuh WebGPU.
  - Fitur visual mandiri 100% offline: Deskripsi Gambar, Ekstraksi Teks OCR, dan Deteksi Objek ber-kanvas overlay *bounding box*.
  - Terintegrasi penuh ke dalam portal tri-bahasa (`index.html`, `index_en.html`, `index_jv.html`).
* **Aplikasi Agen AI Otonom & Runner Python WASM (`agen-ai-otonom.html`):**
  - Alur kerja agen otonom ReAct dengan runtime Python 3.12 WebAssembly (Pyodide).
  - Eksekusi kode komputasi lokal, simulasi Monte Carlo, dan render grafik interaktif Chart.js.
* **Aplikasi Mesin Database Vektor PGlite SQL (`mesin-pglite-rag.html`):**
  - Database PostgreSQL WASM murni di browser dengan ekstensi `pgvector` persisten di IndexedDB.
  - Konsol SQL interaktif, pengunggah berkas dengan *auto-chunker*, ekspor data JSON, dan antarmuka pencarian semantik vektor RAG.
  - Terintegrasi penuh ke dalam portal tri-bahasa (`index.html`, `index_en.html`, `index_jv.html`).
* **Aplikasi Mesin Audio & Suara AI WebGPU (`mesin-suara-webgpu.html`):**
  - Transkripsi suara Whisper Web STT (`whisper-tiny`) dengan akselerasi WebGPU dan visualisasi gelombang mikrofon real-time.
  - Sintesis suara Text-to-Speech Kokoro-82M multi-suara (`af_heart`, `am_adam`, `bf_emma`, `bm_george`), kontrol kecepatan audio, web audio player, dan ekspor audio WAV.
  - Terintegrasi penuh ke dalam portal tri-bahasa (`index.html`, `index_en.html`, `index_jv.html`).
* **Pustaka AI Advanced Stream Engine & Interactive Artifacts:**
  - Optimistic streaming markdown healer (pencegah kedipan layout pada unclosed fences ```).
  - JSON Repair parser untuk streaming tool calls dan data semi-lengkap.
  - Claude-style Interactive Artifacts (live sandboxed iframe/SVG preview, source code tab, fullscreen & export).

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
