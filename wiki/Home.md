# 🚀 Selamat Datang di Wiki On_device_AI Playground

Selamat datang di pusat dokumentasi resmi **Chrome On-Device AI Playground** (`On_device_AI`)!

Repositori ini adalah sebuah *playground* komprehensif untuk mengeksplorasi batas kemampuan **Client-Side AI & In-Browser Intelligence**. Dengan memanfaatkan standar web mutakhir seperti **WebGPU** dan **Google Chrome Built-in AI (Prompt API / Gemini Nano)**, seluruh pemrosesan Large Language Model (LLM), analisis dokumen RAG, dan inferensi multimodal berjalan **100% lokal** di perangkat keras pengguna (GPU/NPU) tanpa bergantung pada server backend eksternal, tanpa biaya API, dan dengan jaminan privasi data absolut.

---

## 🌟 Pilar & Keunggulan Utama

| Keunggulan | Penjelasan Teknis |
| :--- | :--- |
| 🔒 **Privasi 100% Offline (Zero Leakage)** | Semua prompt obrolan, pembedahan kode, dan dokumen sensitif diproses di memori RAM/VRAM lokal. Tidak ada paket data yang dikirim ke cloud. |
| ⚡ **Akselerasi Hardware Penuh** | Memanfaatkan WebGPU (`@litert-lm/core`) dan NPU internal perangkat untuk inferensi berlatensi ultra-rendah dan streaming token secepat kilat. |
| 💰 **Bebas Biaya API Selamanya** | Tidak memerlukan token berbayar, subscription, maupun API key bulanan. |
| 🧠 **In-Browser Hybrid RAG** | Pembedahan dokumen pintar (*header-aware chunking*), database vektor lokal di IndexedDB, pencarian hibrida Cosine Similarity + BM25, serta proteksi anti-halusinasi. |
| 🌐 **Akses Multi-Device via LAN** | Komputer utama bertindak sebagai host AI; smartphone atau tablet di jaringan Wi-Fi lokal dapat terhubung aman melalui HTTPS SSL lokal hanya dengan scan kode QR. |
| 🌍 **Dukungan Tri-Bahasa** | Antarmuka portal utama tersedia lengkap dalam **Bahasa Indonesia**, **English**, dan **Basa Jawa (Krama Madya)**. |

---

## 🗺️ Peta Navigasi Wiki

Silakan telusuri bab dokumentasi sesuai kebutuhan Anda:

### 1. 🚀 Panduan Memulai Cepat (Quickstart)
* **[Prasyarat & Spesifikasi Hardware](Prasyarat-&-Spesifikasi)**: Persyaratan RAM, VRAM, dan versi Chrome yang direkomendasikan.
* **[Panduan Setup Otomatis](Panduan-Setup-Otomatis)**: Langkah 1-klik untuk macOS, Linux, dan Windows (`setup.sh`, `setup.bat`).
* **[Konfigurasi Chrome Flags](Konfigurasi-Chrome-Flags)**: Cara mengaktifkan Prompt API dan Gemini Nano pada browser Chrome.
* **[Menjalankan Server Lokal](Menjalankan-Server-Lokal)**: Cara menyalakan server lokal melalui terminal, skrip command, atau GUI.

### 2. 🧩 Modul & Fitur Aplikasi
* **[Portal Tri-Bahasa & Landing Page](Portal-&-Landing-Page)**: Fitur landing page, simulasi SVG interaktif, dan modal bahasa.
* **[Mesin LiteRT-LM & WebGPU](Mesin-LiteRT-LM-&-WebGPU)**: Inferensi lokal model bahasa `.litertlm` (seperti Gemma 4 E2B) langsung di GPU.
* **[Multi-Provider Chat Interface](Multi-Provider-Chat)**: Antarmuka percakapan bergaya modern dengan integrasi Mermaid.js, KaTeX, dan IndexedDB.
* **[In-Browser RAG & Knowledge Base](In-Browser-RAG)**: Sistem pencarian semantik vektor dokumen PDF/Markdown offline.
* **[Vision & Code Analysis](Vision-&-Code-Analysis)**: Analisis citra multimodal dan review refactoring kode sumber.
* **[Gemini Live & Multimodal Voice](Gemini-Live-&-Voice)**: Eksperimen antarmuka suara dan komunikasi realtime.

### 3. 🛠️ Otomasi & Peluncur
* **[macOS Native Swift GUI Launcher](macOS-Swift-GUI-Launcher)**: Aplikasi GUI native macOS untuk monitoring server, status SSL, dan QR code.
* **[Skrip Peluncur Chrome AI](Skrip-Peluncur-Chrome)**: Skrip cerdas pendeteksi varian Chrome (Dev/Canary) dengan injeksi flags terisolasi.
* **[Verifikasi Integritas Aset](Verifikasi-Integritas-Aset)**: Otomasi deteksi pointer Git LFS dan pengunduh mirror model AI.
* **[LAN Bridge & Akses HP/Tablet](LAN-Bridge-&-HTTPS-SSL)**: Akses AI dari smartphone/tablet via HTTPS lokal.

### 4. 🔌 Integrasi Provider AI
* **[Chrome Built-in AI (Gemini Nano)](Provider-Chrome-Nano)**
* **[Ollama Local Server (Llama 3, DeepSeek, Mistral)](Provider-Ollama)**
* **[OpenAI & LM Studio Custom Endpoints](Provider-Custom-API)**

### 5. ❓ Bantuan & Troubleshooting
* **[Troubleshooting & FAQ](Troubleshooting-&-FAQ)**: Panduan solusi kendala umum (flags tidak aktif, CORS error, model pointer, dsb).
* **[Catatan Rilis (Changelog)](Changelog)**: Riwayat pembaruan versi proyek.

---

> 💡 **Tip:** Gunakan menu di bilah sisi (**Sidebar**) di sebelah kanan untuk berpindah antar topik dengan cepat.
