# 🚀 Chrome On-Device AI Playground (V1.5.0)

<div align="center">
  <img width="100%" alt="Screenshot 2026-08-27 at 18 05 38" src="https://github.com/user-attachments/assets/a2c87635-7af2-45d2-83a3-39fbf10527a9" />
  <p><em>Kumpulan eksperimen dan purwarupa (prototype) aplikasi AI Client-Side yang berjalan 100% secara lokal di dalam browser Anda, tanpa server backend, tanpa biaya API, dan dengan privasi data yang terjamin.</em></p>
</div>

---

## 📑 Daftar Isi
- [🚀 Chrome On-Device AI Playground (V1.5.0)](#-chrome-on-device-ai-playground-v150)
  - [📑 Daftar Isi](#-daftar-isi)
  - [✨ Gambaran Umum](#-gambaran-umum)
  - [📂 Struktur & Modul Proyek](#-struktur--modul-proyek)
    - [1. `liter.html` (WebGPU LiteRT-LM Engine)](#1-literhtml-webgpu-litert-lm-engine)
    - [2. `claude.html` (Multi-Provider Chat Interface)](#2-claudehtml-multi-provider-chat-interface)
    - [3. `vision_ulti.html` & `vision_code.html` (Vision & Code Analysis)](#3-vision_ultihtml--vision_codehtml-vision--code-analysis)
  - [🧠 In-Browser RAG & Knowledge Base Lokal](#-in-browser-rag--knowledge-base-lokal)
  - [🛠️ Arsitektur & Teknologi](#️-arsitektur--teknologi)
  - [🚀 Prasyarat & Cara Menjalankan](#-prasyarat--cara-menjalankan)
    - [Langkah 1: Konfigurasi Chrome Flags](#langkah-1-konfigurasi-chrome-flags)
    - [Langkah 2: Jalankan Local Server](#langkah-2-jalankan-local-server)
  - [🐛 Troubleshooting](#-troubleshooting)
  - [🤝 Kontribusi](#-kontribusi)
  - [📄 Lisensi](#-lisensi)

---

## ✨ Gambaran Umum

Repositori ini adalah sebuah _playground_ untuk mengeksplorasi batas kemampuan **Browser-based AI**. Dengan memanfaatkan standar web mutakhir seperti **WebGPU** dan **Chrome Built-in AI (Prompt API)**, repositori ini mendemonstrasikan bahwa model bahasa besar (LLM) dapat berjalan langsung di perangkat keras pengguna (GPU/NPU lokal) dengan latensi yang sangat rendah.

**Keunggulan Utama:**
* **Privasi Maksimal (100% Offline):** Semua pemrosesan prompt dan dokumen dilakukan secara lokal. Tidak ada data yang dikirim ke server.
* **Performa Hardware-Accelerated:** Menggunakan WebGPU untuk memanfaatkan kartu grafis perangkat secara langsung.
* **Arsitektur Tanpa Server (Serverless):** Aplikasi murni dibangun menggunakan HTML, CSS (Vanilla), dan JavaScript ES Modules.

---

## 📂 Struktur & Modul Proyek

Setiap file `.html` dalam repositori ini bertindak sebagai sebuah *Single-Page Application (SPA)* mandiri yang mendemonstrasikan teknologi yang berbeda.

### 1. `liter.html` (WebGPU LiteRT-LM Engine)
File ini adalah implementasi *state-of-the-art* dari inferensi WebGPU menggunakan framework terbaru dari Google.
* **Teknologi:** `@litert-lm/core` (Primary) dan `@mediapipe/tasks-genai` (Fallback).
* **Fitur:** 
  * Dapat memuat model bahasa berformat `.litertlm` (misal: `Gemma 4 E2B Instruct`) langsung dari penyimpanan lokal (File System) atau diunduh dari URL HuggingFace.
  * Memiliki *progress bar* realtime saat mengunduh bobot model dari jaringan.
  * Pipeline inferensi menggunakan VRAM (GPU) secara langsung untuk streaming respons berkecepatan tinggi.

### 2. `claude.html` (Multi-Provider Chat Interface)
Halaman antarmuka obrolan yang kaya fitur, dirancang mirip dengan aplikasi AI profesional kelas atas (seperti Claude/ChatGPT).
* **Teknologi:** Google Chrome Built-in AI (`window.ai`), Ollama REST API, OpenAI-compatible API.
* **Fitur:**
  * **Dukungan Eksternal LLM Server (Pengaturan):** Melalui menu pengaturan bawaan (Settings), pengguna dapat mengonfigurasi aplikasi agar terhubung dengan server LLM eksternal. Kami mendukung:
    * **Ollama:** Hubungkan langsung ke server Ollama lokal Anda (contoh: `http://localhost:11434`) untuk menjalankan Llama 3, Mistral, dll.
    * **OpenAI API / Custom Endpoint:** Masukkan Base URL dan API Key untuk menggunakan model dari OpenAI (GPT-4o), Groq, Together AI, atau server LM Studio lokal.
  * **Multi-Provider Switcher:** Memungkinkan Anda berganti dengan mulus antara model bawaan Chrome (Gemini Nano) dan model jaringan/server yang dikonfigurasi di atas.
  * **Persona/Prompt Library:** Pustaka *system prompt* bawaan untuk mengubah karakter asisten AI (sebagai Programmer, Editor, Translator, dll).
  * **Session Management:** Percakapan disimpan secara presisten ke IndexedDB (`ClaudeChatDB`). Ekspor percakapan ke format PDF, DOCX, TXT, dan JSON tersedia.

### 3. `vision_ulti.html` & `vision_code.html` (Vision & Code Analysis)
Fokus pada analisis teks lanjutan dan tugas multimodal sederhana.
* **Fitur Khusus:** Tombol *Quick Action* untuk manipulasi teks secara instan (Translate, Summarize, Refine, Code Review).
* UI yang dioptimalkan untuk membaca baris kode panjang dan sintaks yang diformat khusus.

---

## 🧠 In-Browser RAG & Knowledge Base Lokal

Semua modul aplikasi di atas (`liter.html`, `claude.html`, `vision_code.html`) kini dilengkapi dengan sistem **Retrieval-Augmented Generation (RAG)** yang berjalan sepenuhnya di sisi klien!

**Bagaimana ini bekerja?**
1. **Parsing Dokumen:** Pengguna mengunggah dokumen referensi (mendukung `.pdf` via PDF.js, `.docx` via Mammoth.js, serta `.txt` dan `.md`).
2. **Chunking & Embedding:** Teks diekstrak dan dipecah (chunking) dengan teknik *overlapping*. Kemudian, menggunakan `Transformers.js` (model `Xenova/all-MiniLM-L6-v2`), teks diubah menjadi vektor (embeddings).
3. **Penyimpanan Lokal:** Vektor dan teks asli disimpan ke dalam browser menggunakan IndexedDB secara permanen.
4. **Vector Search:** Saat pengguna bertanya, pertanyaan diubah menjadi vektor, lalu dicari kecocokannya (cosine similarity) dengan dokumen dalam IndexedDB. Konteks yang relevan disuntikkan langsung ke dalam prompt AI!

<details>
<summary>📸 <strong>Lihat Tangkapan Layar RAG / Knowledge Base</strong></summary>
<br/>
<img width="100%" alt="RAG Screenshot 1" src="https://github.com/user-attachments/assets/8cbedf0e-d84a-49e0-8962-4741f7576bbc" />
<img width="100%" alt="RAG Screenshot 2" src="https://github.com/user-attachments/assets/3e2f8834-9e58-43c7-9bd1-94ddecce5e6b" />
<img width="100%" alt="RAG Screenshot 3" src="https://github.com/user-attachments/assets/31bf68d9-d1ad-4602-8018-afb003713a51" />
<img width="100%" alt="RAG Screenshot 4" src="https://github.com/user-attachments/assets/902be638-080d-43f3-970f-2ddcb68504cc" />
<img width="100%" alt="RAG Screenshot 5" src="https://github.com/user-attachments/assets/17d43877-8855-41d0-bb6a-2f887343814e" />
</details>

---

## 🛠️ Arsitektur & Teknologi

* **Frontend:** HTML5, CSS3 (Vanilla dengan variabel kustom untuk *Dynamic Theming*), Vanilla JavaScript (ESM).
* **Local Storage:** IndexedDB (menyimpan riwayat sesi dan Vector Database chunk RAG).
* **Machine Learning / AI API:**
  * [Chrome Prompt API](https://github.com/WICG/prompt-api) (`window.ai`)
  * [LiteRT-LM](https://github.com/google-ai-edge/LiteRT-LM) (`@litert-lm/core`) via WebGPU
  * [Transformers.js](https://huggingface.co/docs/transformers.js/index) (untuk eksekusi model *embedding* di browser)
* **File Parsers:** `pdf.min.js`, `mammoth.browser.min.js`, `marked.js` (untuk rendering markdown), `highlight.js`.

---

## 🚀 Prasyarat & Cara Menjalankan

Karena aplikasi ini berinteraksi dengan API eksperimental (seperti membaca file lokal, WebGPU, dan akses memori tinggi), aplikasi ini **tidak bisa dijalankan langsung dengan klik ganda** (`file:///` protocol). Anda harus melayaninya melalui HTTP Server lokal.

### Langkah 1: Persyaratan Hardware & Aktivasi Chrome On-Device AI (Gemini Nano)

**Persyaratan Sistem (Hardware Requirements):**
* **RAM:** Minimal 8GB (Disarankan 16GB atau lebih untuk performa yang lancar dan stabil).
* **Penyimpanan:** Minimal 3GB ruang kosong di media penyimpanan Anda untuk mengunduh bobot (weights) model bahasa.
* **GPU:** Kartu grafis yang mendukung standar **WebGPU** (Contoh: Apple Silicon M1/M2/M3, Intel Iris Xe, AMD Radeon modern, atau NVIDIA seri GTX 10 ke atas).
* **Browser:** Google Chrome versi 127 atau lebih baru (Disarankan menggunakan **Chrome Dev** atau **Canary** build).

**Cara Aktivasi On-Device AI (Prompt API):**
Agar fitur AI bawaan Chrome dapat berjalan secara lokal, Anda perlu mengaktifkan *flags* eksperimental dan memastikan model telah terunduh:

1. Buka tab baru dan akses URL: `chrome://flags`
2. Cari dan aktifkan ketiga opsi berikut:
   * **Optimization Guide On Device Model:** Ubah nilainya ke `Enabled BypassPerfRequirement`
   * **Prompt API for Gemini Nano:** Ubah nilainya ke `Enabled`
   * **Enables WebGPU:** Ubah nilainya ke `Enabled` (Biasanya sudah aktif secara default, namun pastikan untuk berjaga-jaga)
3. Klik tombol **Relaunch** di pojok kanan bawah untuk memuat ulang browser Anda.
4. Setelah browser terbuka kembali, buka tab baru dan akses URL: `chrome://components`
5. Gulir dan cari komponen bernama **Optimization Guide On Device Model**.
6. Klik tombol **Check for update**. Tunggu proses pengunduhan selesai. Ini akan mengunduh model AI sebesar ~1.5GB hingga 2GB di latar belakang. Pastikan versi komponen tidak lagi menunjukkan `0.0.0.0`.

<img width="100%" alt="Chrome Flags Config" src="https://github.com/user-attachments/assets/b4b0d194-f1e4-41d8-869f-55ee50c4d67f" />

### Langkah 2: Jalankan Local Server
Buka terminal Anda, arahkan ke direktori repositori ini, dan jalankan server lokal:

**Menggunakan Python:**
```bash
python3 -m http.server 8080
```
**Atau menggunakan Node.js (http-server):**
```bash
npx http-server -p 8080
```

Buka browser Anda dan akses `http://localhost:8080/`. Silakan klik salah satu file `.html` untuk memulai pengujian!

---

## 🐛 Troubleshooting

* **Model Simulasi Aktif di `liter.html`:** Ini terjadi karena CDN package `@litert-lm/core` saat ini masih berstatus "Early Preview" oleh Google dan kadang tidak dapat diunduh (tergantung registry CDN saat itu). Skrip kami telah dilengkapi dengan fallback multi-CDN. Pastikan koneksi internet stabil saat inisialisasi awal.
* **Error CORS pada Transformers.js:** Pastikan Anda mengakses aplikasi melalui `localhost` atau IP lokal (`127.0.0.1`), bukan dengan membuka file langsung dari File Explorer (protokol `file://`).
* **Gemini Nano tidak merespons (`claude.html`):** Terkadang model lokal Chrome memerlukan waktu untuk terunduh di latar belakang. Coba buka `chrome://components/`, cari *Optimization Guide On Device Model*, dan klik tombol *Check for update*.

---

## 🤝 Kontribusi

Proyek ini sangat terbuka untuk kontribusi! Jika Anda tertarik untuk menambahkan integrasi API baru, memperbaiki bug, atau menyempurnakan UI, silakan ajukan *Pull Request* atau laporkan masalah melalui tab *Issues*.

---

## 📄 Lisensi

Proyek ini bersifat open-source di bawah [MIT License](https://opensource.org/licenses/MIT). Anda bebas untuk menggunakan, mengubah, dan mendistribusikan perangkat lunak ini.
