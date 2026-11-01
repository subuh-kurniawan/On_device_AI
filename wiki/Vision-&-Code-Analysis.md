# 👁️ Vision & Code Analysis

File: `analisis-vision.html`, `analisis-vision-rag.html`, `analisis-kode.html`

Modul spesialisasi ini dirancang khusus untuk memproses masukan multimodal (gambar, diagram, bagan, tangkapan layar) serta penelaahan kode pemrograman tingkat lanjut.

---

## 🖼️ Modul Analisis Vision (`analisis-vision.html` & `analisis-vision-rag.html`)

Modul ini menggabungkan kekuatan pemrosesan citra dengan model AI multimodal lokal:

### Fitur-Fitur:
1. **Drag-and-Drop Image Input:** Cukup seret gambar dari desktop atau paste dari papan klip (*clipboard*).
2. **Visual Inspection & OCR:**
   - Membaca teks di dalam gambar, dokumen hasil pindai (scan), kuitansi, atau struk pembayaran.
   - Mengidentifikasi objek, struktur antarmuka UI, dan sketsa desain.
3. **Diagram-to-Code Converter:**
   - Mengubah tangkapan layar bagan alur atau mockup UI menjadi kode HTML/CSS atau diagram Mermaid.
4. **Integrasi Vision RAG:**
   - Mengkorelasikan dokumen teks PDF dengan gambar pendukung untuk analisis dokumen komprehensif.

---

## 💻 Modul Analisis Kode (`analisis-kode.html`)

Modul asisten pemrograman yang dioptimalkan untuk pengembang perangkat lunak (*software engineers*):

### Fitur-Fitur:
1. **Editor Kode Terintegrasi (CodeMirror):**
   - Mendukung penulisan sintaks untuk JavaScript, TypeScript, Python, HTML/CSS, SQL, JSON, C++, Swift, dan bahasa populer lainnya.
   - Penomoran baris, pelipatan kode (*code folding*), dan tema gelap (*dark mode*) yang nyaman untuk mata.
2. **Preset Aksi Cepat (Quick Actions 1-Klik):**
   - 🔍 **Code Review & Audit:** Mendeteksi celah keamanan, potensi kebocoran memori, dan *code smells*.
   - ⚡ **Refactoring & Optimization:** Mengoptimalkan struktur kode agar lebih ringkas, mudah dibaca, dan berkinerja tinggi.
   - 🐛 **Bug Fix Explainer:** Menganalisis pesan error atau stack trace dan memberikan solusi perbaikan kode.
   - 📖 **Generate Docstrings / Comments:** Menghasilkan dokumentasi fungsi dan penjelasan baris per baris.
   - 🌐 **Language Transpilation:** Menerjemahkan logika algoritma dari satu bahasa ke bahasa lain (misal: Python ke JavaScript).
