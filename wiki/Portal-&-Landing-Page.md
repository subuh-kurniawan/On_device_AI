# 🌐 Portal Tri-Bahasa & Landing Page

File: `index.html`, `index_en.html`, `index_jv.html`

Portal utama **Chrome On-Device AI Playground** dirancang sebagai pusat kendali untuk menavigasi seluruh varian aplikasi AI client-side yang tersedia di dalam repositori.

---

## ✨ Fitur-Fitur Utama Portal

### 1. Sistem Tri-Bahasa & Welcome Language Modal
* **Modal Sambutan Awal (*Welcome Language Modal*):** Saat pengguna pertama kali mengunjungi `index.html`, modal sambutan yang ramah akan muncul untuk memberikan opsi bahasa pengantar:
  - 🇮🇩 **Bahasa Indonesia**
  - 🇬🇧 **English**
  - ꦗꦮ **Basa Jawa**
* Pilihan pengguna otomatis tersimpan di `localStorage` peramban, sehingga kunjungan berikutnya langsung memuat bahasa yang disukai.
* **Dropdown Bahasa 3 Arah (*3-Way Language Switcher*):** Tombol apung (*floating topbar pill*) 46px di bagian atas layar memungkinkan perpindahan instan antar bahasa kapan saja tanpa memotong layout pada layar smartphone kecil (*mobile-first non-stacking design*).

### 2. Simulasi Pipeline Arsitektur Interaktif SVG
Di bagian tengah beranda, terdapat diagram visual arsitektur 4-lapisan berbasis SVG interaktif:
* **Lapisan Antarmuka Pengguna (Web UI & Canvas)**
* **Lapisan In-Browser Engine (Prompt API & LiteRT-LM WebGPU)**
* **Lapisan Akselerasi Perangkat Keras (NPU / GPU Direct Pipeline)**
* **Lapisan Privasi Lokal (Local RAM / IndexedDB Zero Data Leakage)**

Pengguna dapat mengklik tombol uji interaktif:
- 💬 **Teks & Kode**
- 📄 **Dokumen RAG**
- 🖼️ **Analisis Gambar**

Animasi pulsa sirkuit SVG akan mensimulasikan perjalanan data secara visual, disertai pembaruan metrik langsung (*Live Metrics Bar*) yang menampilkan latensi real-time, tingkat privasi memori, dan akselerator hardware aktif.

### 3. Narasi Edukatif On-Device AI
Memberikan penjelasan komprehensif mengenai:
* Mengapa AI On-Device lebih aman daripada AI berbasis cloud.
* Bagaimana model bahasa kecil (*Small Language Model* / SLM) beroperasi efisien di perangkat konsumer.
* Standar W3C Web Platform AI dan masa depan ekosistem web modern.

### 4. Tab Sistem Operasi Quickstart Bebas Lag
Petunjuk instalasi interaktif dengan tab macOS, Linux, dan Windows yang diinisialisasi secara dini (*early execution*) untuk menjamin peralihan tab yang instan dan responsif, dilengkapi tombol salin perintah 1-klik (*copy-to-clipboard*).
