# 📋 Changelog

<div align="center">
  <p>
    <b>🇮🇩 Bahasa Indonesia | <a href="CHANGELOG_EN.md">🇬🇧 English</a> | <a href="CHANGELOG_JV.md">ꦗꦮ Basa Jawa</a></b>
  </p>
</div>

Semua perubahan penting pada proyek **Chrome On-Device AI Playground** didokumentasikan dalam berkas ini.
Format pencatatan mengikuti panduan [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan menganut prinsip [Semantic Versioning](https://semver.org/).

---

## [2.1.0] - 2026-11-02

### ✨ Ditambahkan (Added)
- **Dukungan Tri-Bahasa Landing Page (ID, EN, JV) & Welcome Language Modal (`index.html`, `index_en.html`, `index_jv.html`)**:
  - Modal selamat datang (*Welcome Language Modal*) interaktif pada `index.html` untuk memilih bahasa awal (Bahasa Indonesia, English, Basa Jawa) saat kunjungan pertama dengan fitur simpan preferensi.
  - Dropdown bahasa 3 arah (`[🇮🇩 ID ▾]`, `[🇬🇧 EN ▾]`, `[ꦗꦮ JV ▾]`) di bilah navigasi atas (topbar) dengan desain *mobile-first floating pill* 46px non-stacking.
  - Halaman penuh berbahasa Jawa (`index_jv.html`) bertata bahasa Krama Madya baku untuk seluruh elemen UI, 18 kartu aplikasi, narasi edukatif Chrome On-Device AI, dan modal dialog.
  - Halaman penuh berbahasa Inggris (`index_en.html`).
- **Simulasi Pipeline Arsitektur Interaktif SVG & Live Metrics (`index.html`, `index_en.html`, `index_jv.html`)**:
  - Diagram alur interaktif berbasis SVG animasi dengan 3 tombol pengujian alur (`💬 Teks & Kode`, `📄 Dokumen RAG`, `🖼️ Analisis Gambar`).
  - Bar metrik langsung (*Live Metrics Bar*) yang memperbarui status latensi, privasi data RAM, akselerator hardware aktif (NPU/GPU), dan ketersediaan luring secara dinamis.
- **Skrip Verifikasi Integritas Aset & Pengunduh Model Otomatis (`verify_assets.py`, `verify_assets.sh`, `verify_assets.bat`)**:
  - Pemeriksa integritas model embedding ONNX lokal untuk mendeteksi *pointer stub* Git LFS (< 2 KB).
  - Pengunduh otomatis arsip model dari cermin server (`https://agendakelas.my.id/models.zip`) dan Google Drive (`1UPM-az2Y5VIkzoBuPB06CDLj3IiQkZL-`) dengan ekstraksi otomatis ke direktori `models/`.
  - Terintegrasi langsung ke dalam skrip setup lintas platform (`setup.sh`, `setup_mac.command`, `setup.bat`).
- **Penyempurnaan Sistem In-Browser RAG & Vector Knowledge Base (`obrolan-claude-rag.html`, `analisis-vision-rag.html`)**:
  - Pemilih model embedding dinamis: `all-MiniLM-L6-v2` (22 MB, cepat) dan `multilingual-e5-small` (118 MB, akurasi tinggi multi-bahasa) dengan fitur *1-click re-index*.
  - *Smart header-aware chunking* yang mempertahankan hierarki heading Markdown dan nomor halaman dokumen PDF.
  - *Hybrid Search Engine* (Kombinasi Cosine Similarity 65% + Lexical BM25 35%).
  - Sitasi sumber akurat dengan *page pills* (`Hal. X`) dan skor relevansi hibrida transparan.
  - Tombol *Strict Anti-Hallucination Mode* untuk mencegah model memberikan jawaban di luar basis pengetahuan.
- **Perbaikan Responsivitas Mobile-First & Tab Sistem Operasi**:
  - Inisialisasi awal (*early execution*) untuk tab sistem operasi (macOS, Windows, Linux) pada bagian Quickstart sehingga bebas lag dan langsung dapat di-switch.
  - Penghapusan browser focus ring ganda pada tombol tab sistem operasi.

---

## [2.0.0] - 2026-11-02

### ✨ Ditambahkan (Added)
- **Peluncur Chrome Otomatis Multi-Platform dengan Deteksi Edisi (`launch_chrome_ai.sh`, `launch_chrome_mac.command`, `launch_chrome_ai.bat`)**:
  - Otomatis mendeteksi varian instalasi Chrome: **Chrome Canary**, **Chrome Dev**, **Chrome Beta**, maupun **Chrome Biasa (Stable)**.
  - Memilih edisi terbaik secara cerdas (memprioritaskan Dev/Canary yang memiliki API On-Device terbaru).
  - Melakukan pengecekan spesifikasi hardware otomatis (RAM & sisa ruang disk); otomatis mengaktifkan flag `BypassPerfRequirement` jika RAM < 16 GB.
  - Menyuntikkan seluruh flags esensial (`OptimizationGuideOnDeviceModel`, `PromptAPIForGeminiNano`, `EnableWebGPU`, dsb.) menggunakan direktori profil AI terisolasi agar flags 100% aktif tanpa mengganggu profil Chrome yang sedang berjalan.
  - Otomatis membuka tab aplikasi, `chrome://components`, dan `chrome://on-device-internals`.
- **Skrip Instalasi Dependensi Otomatis Lintas Platform (`setup.sh`, `setup_mac.command`, `setup.bat`, `package.json`)**:
  - Dukungan otomatisasi untuk **macOS**, **Linux** (Ubuntu/Debian, Fedora, Arch), dan **Windows**.
  - Deteksi dan instalasi otomatis untuk Node.js, Python 3, OpenSSL, dan Git LFS (menggunakan Homebrew di Mac, APT/DNF/Pacman di Linux, dan WinGet di Windows).
  - Pembuatan sertifikat mandiri SSL lokal (`cert.pem` & `key.pem`) dengan Subject Alternative Name (SAN) untuk localhost dan IP LAN.
  - Inisialisasi Git LFS otomatis untuk mengunduh model ONNX lokal.
  - Standarisasi `package.json` untuk menjalankan `npm run setup`, `npm start`, dan `npm run serve`.
- **Peluncur Native macOS Swift GUI (`jalankanserverFN.command` & `jalankanserverFN_gui.swift`)**:
  - Kontrol server berbasis antarmuka grafis (GUI) native macOS yang otomatis dikompilasi via `swiftc`.
  - Pemantauan status SSL HTTPS (`cert.pem` & `key.pem`), port server, QR Code LAN, dan log aktivitas realtime.
- **Skrip Git Sekali Klik (`git_push.command`)**:
  - Skrip bash double-click di macOS Finder untuk otomatisasi `git add`, `git commit`, dan `git push`.
  - Integrasi dengan macOS Keychain (`osxkeychain`) untuk otentikasi tanpa memasukkan password berulang.
- **LAN AI Relay & Bridge Server (`lan-ai-bridge.js`, `lan-ai-relay-server.js`, `relay.js`)**:
  - Memungkinkan perangkat lain (smartphone/tablet di jaringan Wi-Fi/LAN yang sama) mengakses dan menggunakan inferensi AI Chrome On-Device dari komputer host melalui WebSocket ber-SSL.
  - Auto-generate sertifikat SSL self-signed (`key.pem` dan `cert.pem`) untuk HTTPS lokal.
- **Integrasi Git LFS untuk Model ONNX Berukuran Besar**:
  - Konfigurasi `.gitattributes` untuk melacak berkas model `.onnx` menggunakan Git LFS.
  - Penambahan model embedding `intfloat/multilingual-e5-small` (113 MB) dan `all-MiniLM-L6-v2` (22 MB) untuk kebutuhan pencarian semantik multibahasa offline.
- **Interactivity & Visual Enhancements**:
  - `ai-mermaid-controls.js`: Kontrol interaktif untuk diagram Mermaid (fitur zoom in/out, pan drag, salin kode SVG, dan fullscreen).
  - `intent-enricher.js`: Deteksi otomatis intensi prompt untuk merender format diagram, tabel, grafik, mindmap, atau KaTeX yang relevan secara dinamis.
  - `context-memory-manager.js`: Pengarsipan memori percakapan lintas sesi ke IndexedDB (`kb_chunks` dan `kb_files`).
  - `python-runner.js`: Runner lokal untuk eksekusi kode Python langsung dari playground.
  - Penambahan thumbnail pratinjau antarmuka untuk seluruh varian SPA di `nano_asset/assets/previews/`.
- **Dokumentasi Persona AI (`chat.md`)**:
  - Panduan system prompt persona chatbot AI Lokal Playground dalam Bahasa Indonesia.

### 🔄 Diubah (Changed)
- **Struktur Direktori & Aset**:
  - Reorganisasi seluruh aset statis, font KaTeX, gambar cover, dan model AI lokal ke dalam struktur `nano_asset/`.
  - Pembersihan file-file duplikat di root direktori proyek.
- **Peningkatan Responsivitas & Tema**:
  - Penambahan stylesheet `responsive.css` dan `ai-renderers.css` untuk tata letak mobile-friendly saat diakses via LAN.
  - Optimalisasi KaTeX dan CodeMirror stylesheet untuk tampilan mode gelap yang lebih kontras dan nyaman.

### 🛡️ Keamanan & Pembersihan (Security)
- Pembaruan `.gitignore` untuk mencegah berkas sertifikat pribadi (`*.pem`), biner hasil kompilasi (`jalankanserverFN_gui`), dan metadata macOS (`.DS_Store`) terunggah ke repositori publik.

---

## [1.5.0] - 2026-10-16

### ✨ Ditambahkan (Added)
- Integrasi Chrome Built-in AI (`window.ai` / Prompt API) untuk model Gemini Nano.
- Antarmuka obrolan multi-provider `obrolan-claude.html` yang mendukung Gemini Nano, Ollama lokal, dan OpenAI-compatible API.
- Fitur in-browser RAG dengan eksekusi lokal Transformers.js (`all-MiniLM-L6-v2`).
- Parser dokumen terintegrasi untuk file PDF, DOCX, TXT, dan Markdown di sisi browser.
- Skrip peluncur otomatis `start_mac.command` dan `start_windows.bat`.

---

## [1.0.0] - 2026-08-27

### ✨ Rilis Awal (Initial Release)
- Prototipe awal aplikasi Chrome On-Device AI Playground.
- Implementasi WebGPU LiteRT-LM Engine (`mesin-litert-lm.html`).
- Antarmuka dasar analisis kode dan analisis visi.
