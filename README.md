# 🚀 Chrome On-Device AI Playground

<img width="100%" alt="Screenshot 2026-08-27 at 18 05 38" src="https://github.com/user-attachments/assets/a2c87635-7af2-45d2-83a3-39fbf10527a9" />

Repositori ini berisi kumpulan eksperimen dan implementasi **On-Device AI** menggunakan kemampuan bawaan Google Chrome (seperti **Gemini Nano**, **LiteRT-LM WebGPU**, dan **Prompt API**). Semua berjalan secara lokal di perangkat tanpa memerlukan server pihak ketiga!

---

## 📂 Struktur Proyek

Berikut adalah daftar file utama di dalam direktori proyek ini:

* **`claude.html`**: Halaman eksperimen antarmuka dan perbandingan integrasi model dengan dukungan RAG lokal (Knowledge Base), multi-provider (Chrome AI, Ollama, API Eksternal).
* **`liter.html`**: Implementasi AI menggunakan **WebGPU** dan **LiteRT-LM** (`@litert-lm/core`) atau fallback **MediaPipe LLM Inference** (`@mediapipe/tasks-genai`) yang memuat model `.litertlm` (misal Gemma 4) langsung ke GPU lokal Anda secara offline. Didukung juga fitur RAG/Knowledge Base.
* **`vision_code.html`** & **`vision_code copy.html`**: Implementasi fitur AI untuk pemrosesan atau analisis *vision/code* secara lokal.
* **`vision_ulti.html`**: Versi *ultimate/advanced* dari eksperimen berbasis *vision* dengan Prompt API.
* **`nano_asset/`**: Folder penyimpanan aset pendukung untuk eksperimen Gemini Nano.

---

## ✨ Fitur Utama

* **100% Client-Side:** Pemrosesan AI berjalan secara lokal di perangkat keras Anda, menjaga privasi data sepenuhnya tanpa upload ke server.
* **Integrasi WebGPU & Prompt API:** Memanfaatkan standar web baru (Built-in AI & WebGPU) untuk berinteraksi langsung dengan LLM di dalam browser dengan performa hardware-accelerated.
* **Eksperimen Multimodal & RAG:** Pengujian kapabilitas teks, *vision*, serta Injeksi Dokumen (PDF, DOCX, TXT) langsung di lingkungan browser menggunakan IndexedDB lokal.

---

## 🛠️ Prasyarat & Cara Menjalankan

### 1. Mengaktifkan Chrome Built-in AI (Prompt API)
Gunakan Google Chrome versi terbaru (Dev / Canary sangat direkomendasikan).
* Buka `chrome://flags` di browser Anda.
* Aktifkan flag berikut:
  * `#optimization-guide-on-device-model` (Set ke *Enabled BypassPerfRequirement*)
  * `#prompt-api-for-gemini-nano` (Set ke *Enabled*)

<img width="100%" alt="Screenshot 2026-08-27 at 18 11 32" src="https://github.com/user-attachments/assets/b4b0d194-f1e4-41d8-869f-55ee50c4d67f" />

### 2. Menjalankan File
Aplikasi ini hanya berupa file statis. Untuk menjalankan:
* Buka terminal di folder proyek dan jalankan lokal server sederhana:
  ```bash
  python3 -m http.server 8080
  ```
* Buka browser dan akses `http://localhost:8080/` dan pilih file `.html` yang ingin dicoba (contoh: `claude.html` atau `liter.html`).

---

## 📖 Dokumentasi & Penjelasan Teknis: Chrome On-Device AI Suite

### 📌 Gambaran Umum Arsitektur
Proyek ini adalah Client-Side Multimodal AI Suite berbasis peramban (browser) yang dirancang untuk berinteraksi langsung dengan AI tanpa memerlukan infrastruktur server backend pihak ketiga. Seluruh proses inferensi dilakukan secara lokal.

### 🛠️ Komponen Teknis Utama

#### 1. Engine & Integrasi Model (Mode AI)
* **Chrome Built-in AI (Gemini Nano):** Menggunakan standar web Prompt API untuk komunikasi langsung antara JavaScript di sisi klien dan model lokal browser.
* **WebGPU LiteRT-LM & MediaPipe:** Menggunakan engine berbasis WebGPU (`liter.html`) untuk memuat model `.litertlm` (contoh: Gemma 4) yang dijalankan oleh hardware grafis lokal PC Anda dengan performa tinggi.
* **Multi-Provider Support:** Selain mode lokal, arsitektur mendukung opsi integrasi provider lain seperti Ollama, OpenAI, dan lainnya.

<img width="100%" alt="Screenshot 2026-08-27 at 18 13 20" src="https://github.com/user-attachments/assets/4ab5decf-1d49-4368-93ba-74e9a09e735c" />

#### 2. Manajemen Konteks & Knowledge Base (KB) / RAG
* **Dokumen Lokal:** Mendukung injeksi file dokumen lokal secara langsung ke dalam sesi aktif (seperti format .pdf, .docx, .txt, .md). Dokumen dibaca dan di-embedding di sisi klien (menggunakan `transformers.js`).
* **RAG Mini (Retrieval-Augmented Generation):** Dokumen disimpan di IndexedDB (`LiterChatDB` / `ClaudeChatDB`), memori browser akan mencari konteks paling mirip via cosine similarity, dan memberikan referensi mendalam.

<details>
<summary>📸 Lihat Screenshot Knowledge Base & RAG</summary>
<br/>
<img width="100%" alt="Screenshot" src="https://github.com/user-attachments/assets/8cbedf0e-d84a-49e0-8962-4741f7576bbc" />
<img width="100%" alt="Screenshot" src="https://github.com/user-attachments/assets/3e2f8834-9e58-43c7-9bd1-94ddecce5e6b" />
<img width="100%" alt="Screenshot" src="https://github.com/user-attachments/assets/31bf68d9-d1ad-4602-8018-afb003713a51" />
<img width="100%" alt="Screenshot" src="https://github.com/user-attachments/assets/902be638-080d-43f3-970f-2ddcb68504cc" />
<img width="100%" alt="Screenshot" src="https://github.com/user-attachments/assets/17d43877-8855-41d0-bb6a-2f887343814e" />
</details>

#### 3. Manajemen Sesi & Penyimpanan (State Management)
* **Sesi Lokal:** Menyediakan fitur penyimpanan riwayat percakapan secara lokal menggunakan IndexedDB.
* **Ekspor & Impor Fleksibel:** Pengguna dapat mengekspor hasil obrolan ke format PDF, DOCX, TXT, maupun format JSON.

#### 4. Antarmuka Pengguna & Persona (Prompt Library)
* **Multimodal UI Suite:** Dilengkapi dengan panel kontrol dinamis, pemilihan persona, dan pustaka prompt cepat (Prompt Library).
* **Fitur Tambahan:** Tombol utilitas instan untuk Ringkasan (Summarization), Perbaikan teks (Refinement), Terjemahan, dll secara real-time.

---

## ⚙️ Alur Kerja Sistem (Workflow)

1. **Inisialisasi & Pengecekan Status:** Saat aplikasi dimuat, skrip memeriksa ketersediaan model lokal menggunakan fungsi `ai.languageModel.availability()` (Prompt API) atau `navigator.gpu` (WebGPU).
2. **Injeksi Konteks (Knowledge Base):** Pengguna mengunggah dokumen. Teks diekstrak, di-chunk, di-embed menjadi vektor (Transformers.js), dan disimpan di IndexedDB.
3. **Eksekusi Inferensi:** Prompt dikirim bersama konteks dokumen terkait ke model lokal. Perangkat keras pengguna (NPU/GPU) memproses token dan mengembalikan respons streaming seketika tanpa network payload!

---

## 🤝 Kontribusi

Silakan buat *Pull Request* atau laporkan *Issue* jika Anda ingin mengembangkan eksperimen ini bersama-sama!

---

## 📄 Lisensi

Proyek ini bersifat open-source di bawah [MIT License](https://opensource.org/licenses/MIT).
