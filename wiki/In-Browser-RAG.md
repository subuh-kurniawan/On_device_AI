# 🧠 In-Browser RAG & Vector Knowledge Base

File: `obrolan-claude-rag.html`, `analisis-vision-rag.html`

Modul ini menghadirkan sistem **Retrieval-Augmented Generation (RAG)** mutakhir yang **100% dieksekusi di sisi klien (Client-Side)**. Anda dapat mengunggah dokumen PDF, Markdown, atau teks biasa, dan AI akan menjawab pertanyaan berdasarkan isi dokumen tersebut tanpa ada sepotong pun kalimat yang terkirim ke internet.

---

## 🏗️ Alur Pipeline RAG Lokal

```
[ Upload PDF / MD ] 
       |
       v
[ Header-Aware Chunking & PDF Page Splitter ]
       |
       v
[ Dual In-Browser Embedding Model (Transformers.js ONNX) ]
       |
       +---> Disimpan ke IndexedDB Vector Store
       |
[ Query Pengguna ] 
       |
       v
[ Hybrid Search: Cosine Similarity (65%) + BM25 Lexical (35%) ]
       |
       v
[ Context Injection & Strict Anti-Hallucination Prompt ]
       |
       v
[ On-Device LLM (Gemini Nano / Ollama) ] ---> [ Jawaban dengan Sitasi Hal. X ]
```

---

## 🔬 Komponen Kunci RAG Lokal

### 1. Dual Embedding Model Selector
Pengguna dapat memilih model embedding vektor yang sesuai dengan kebutuhan:
* **`Xenova/all-MiniLM-L6-v2` (~22 MB):**
  - Sangat cepat, hemat konsumsi memori RAM.
  - Sangat cocok untuk dokumen berbahasa Inggris atau perangkat dengan spesifikasi terbatas.
* **`intfloat/multilingual-e5-small` (~118 MB):**
  - Presisi dan akurasi tinggi untuk teks multibahasa (Bahasa Indonesia, Inggris, Jawa, dll).
  - Dilengkapi fitur *1-click re-indexing* untuk memperbarui indeks vektor saat model diganti.

### 2. Smart Header-Aware Chunking
Tidak seperti pemotongan teks sederhana berbasis karakter tetap (*fixed chunking*), sistem ini menganalisis struktur dokumen:
* Mempertahankan hierarki judul Markdown (`#`, `##`, `###`).
* Menjaga keutuhan paragraf dan mencatat nomor halaman asli dokumen PDF (`Hal. X`).

### 3. Hybrid Search Engine (Vektor + Leksikal)
Menggabungkan kelebihan pencarian semantik dan pencarian kata kunci:
* **Cosine Similarity Vektor (Bobot 65%):** Menemukan kesesuaian makna dan konteks meskipun kata kunci berbeda.
* **BM25 Lexical Search (Bobot 35%):** Menjamin istilah spesifik (seperti nomor registrasi, kode teknis, nama orang/tempat) terambil dengan tepat.

### 4. Transparansi Sitasi Sumber
Setiap potongan informasi yang digunakan oleh AI untuk menjawab pertanyaan akan ditampilkan dalam bentuk pil sitasi sumber (`Hal. 3`, skor kecocokan 89%), sehingga pengguna dapat memverifikasi kebenaran jawaban secara mandiri.

### 5. Strict Anti-Hallucination Mode
Sakelar proteksi khusus yang menginstruksikan model untuk:
- Hanya menjawab berdasarkan dokumen yang terindeks.
- Menolak memberikan spekulasi atau halusinasi jika jawaban tidak terdapat dalam konteks dokumen.
