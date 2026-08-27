<img width="2874" height="1358" alt="Screenshot 2026-08-27 at 18 05 38" src="https://github.com/user-attachments/assets/a2c87635-7af2-45d2-83a3-39fbf10527a9" />
# 🚀 Chrome On-Device AI Playground

Repositori ini berisi kumpulan eksperimen dan implementasi **On-Device AI** menggunakan kemampuan bawaan Google Chrome (seperti **Gemini Nano** dan **Prompt API**). Semua berjalan secara lokal di perangkat tanpa memerlukan server pihak ketiga!

---

## 📂 Struktur Proyek

Berikut adalah daftar file utama di dalam direktori proyek ini:

* **`CL.html` / `claude.html**`: Halaman eksperimen antarmuka dan perbandingan integrasi model.
* **`nano_asset/`**: Folder penyimpanan aset pendukung untuk eksperimen Gemini Nano.
* **`vision_code.html` & `vision_code copy.html**`: Implementasi fitur AI untuk pemrosesan atau analisis *vision/code* secara lokal.
* **`vision_ulti.html`**: Versi *ultimate/advanced* dari eksperimen berbasis *vision* dengan Prompt API.

---

## ✨ Fitur Utama

* **100% Client-Side:** Pemrosesan AI berjalan secara lokal di perangkat keras Anda, menjaga privasi data sepenuhnya.
* **Integrasi Prompt API:** Memanfaatkan standar web baru untuk berinteraksi langsung dengan model bahasa besar (LLM) di dalam browser.
* **Eksperimen Multimodal:** Pengujian kapabilitas teks dan *vision* langsung di lingkungan browser.

---

## 🛠️ Prasyarat & Cara Menjalankan

1. **Versi Chrome:** Gunakan Google Chrome versi terbaru (Dev / Canary sangat direkomendasikan).
2. **Mengaktifkan Flag:**
* Buka `chrome://flags` di browser Anda.
* Aktifkan flag berikut:
* `#optimization-guide-on-device-model` (Set ke *Enabled*)
* `#prompt-api-for-gemini-nano` (Set ke *Enabled*)


<img width="2858" height="1364" alt="Screenshot 2026-08-27 at 18 11 32" src="https://github.com/user-attachments/assets/b4b0d194-f1e4-41d8-869f-55ee50c4d67f" />


3. **Menjalankan File:**
* Cukup buka salah satu file `.html` (misalnya `vision_ulti.html` atau `claude.html`) langsung di browser Chrome Anda.


Dokumentasi & Penjelasan Teknis: Chrome On-Device AI Suite (V1.5.0)
📌 Gambaran Umum Arsitektur
Proyek ini adalah Client-Side Multimodal AI Suite berbasis peramban (browser) yang dirancang untuk berinteraksi langsung dengan Gemini Nano melalui Chrome Built-in AI (Prompt API) tanpa memerlukan infrastruktur server backend pihak ketiga. Seluruh proses inferensi dilakukan secara lokal (100% offline-capable setelah model terunduh).

🛠️ Komponen Teknis Utama
1. Engine & Integrasi Model (Mode AI)
Chrome Built-in AI (Gemini Nano): Menggunakan standar web Prompt API untuk komunikasi langsung antara JavaScript di sisi klien dan model lokal browser.
<img width="2872" height="1388" alt="Screenshot 2026-08-27 at 18 13 20" src="https://github.com/user-attachments/assets/4ab5decf-1d49-4368-93ba-74e9a09e735c" />

Multi-Provider Support: Selain mode lokal (Chrome On-Device), arsitektur antarmuka mendukung opsi fallback atau integrasi multi-provider seperti Ollama, OpenAI, dan pengaturan umum kustom.

Flag Prasyarat: Memerlukan pengaktifan flag eksperimental Chromium:

#optimization-guide-on-device-model

#prompt-api-for-gemini-nano

2. Manajemen Konteks & Knowledge Base (KB)
Dokumen Lokal: Mendukung injeksi file dokumen lokal secara langsung ke dalam sesi aktif (seperti format .pdf, .docx, .xlsx, .txt, .md, tabel, dan gambar).
<img width="2870" height="1374" alt="Screenshot 2026-08-27 at 18 12 30" src="https://github.com/user-attachments/assets/8cbedf0e-d84a-49e0-8962-4741f7576bbc" />
<img width="2878" height="1366" alt="Screenshot 2026-08-27 at 18 12 40" src="https://github.com/user-attachments/assets/3e2f8834-9e58-43c7-9bd1-94ddecce5e6b" />
<img width="2878" height="1398" alt="Screenshot 2026-08-27 at 18 13 00" src="https://github.com/user-attachments/assets/31bf68d9-d1ad-4602-8018-afb003713a51" />
<img width="2838" height="1378" alt="Screenshot 2026-08-27 at 18 13 12" src="https://github.com/user-attachments/assets/902be638-080d-43f3-970f-2ddcb68504cc" />
<img width="2872" height="1388" alt="Screenshot 2026-08-27 at 18 13 20" src="https://github.com/user-attachments/assets/17d43877-8855-41d0-bb6a-2f887343814e" />

RAG Mini (Retrieval-Augmented Generation): Memungkinkan pemrosesan dokumen lokal (contoh: analisis file daftar_nilai_tka.pdf) secara langsung di memori browser untuk menghasilkan analisis mendalam, ringkasan, serta ekstraksi data terstruktur.

3. Manajemen Sesi & Penyimpanan (State Management)
Sesi Lokal: Menyediakan fitur penyimpanan riwayat percakapan secara lokal (Kelola Sesi Tersimpan, Simpan Sesi Sekarang).

Ekspor & Impor Fleksibel: Pengguna dapat mengekspor hasil obrolan atau analisis secara instan ke format dokumen standar seperti DOCX, PDF, maupun format cadangan terstruktur JSON.

4. Antarmuka Pengguna & Persona (Prompt Library)
Multimodal UI Suite (V1.5.0): Dilengkapi dengan panel kontrol dinamis, pemilihan persona (Default Assistant), serta pustaka prompt cepat (Prompt Library).

Fitur Tambahan Cepat: Tombol utilitas instan untuk fungsi spesifik seperti Ringkasan (Summarization) dan Perbaikan (Refinement) teks secara real-time.

⚙️ Alur Kerja Sistem (Workflow)
Inisialisasi & Pengecekan Status:
Saat aplikasi dimuat, skrip memeriksa ketersediaan model lokal menggunakan fungsi ketersediaan API browser (ai.languageModel.availability()).

Injeksi Konteks (Knowledge Base):
Pengguna mengunggah dokumen referensi. Dokumen diparsing di sisi klien untuk dijadikan konteks tambahan bagi sesi Prompt API.

Eksekusi Inferensi:
Prompt dan konteks dikirimkan ke sesi aktif Gemini Nano. Perangkat keras pengguna (GPU/NPU lokal) memproses token dan mengembalikan respons secara instan dengan latensi rendah tanpa lalu lintas jaringan (network payload).


---

## 🤝 Kontribusi

Silakan buat *Pull Request* atau laporkan kendala jika Anda ingin mengembangkan eksperimen ini bersama-sama!

---

## 📄 Lisensi

Proyek ini bersifat open-source di bawah [MIT License](https://www.google.com/search?q=LICENSE).
