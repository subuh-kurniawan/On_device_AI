# 📋 Changelog

<div align="center">
  <p>
    <b>🇮🇩 Bahasa Indonesia | <a href="CHANGELOG_EN.md">🇬🇧 English</a></b>
  </p>
</div>

Semua perubahan penting pada proyek **Chrome On-Device AI Playground** didokumentasikan dalam berkas ini.
Format pencatatan mengikuti panduan [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan menganut prinsip [Semantic Versioning](https://semver.org/).

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
