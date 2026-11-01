# 💬 Multi-Provider Chat Interface

File: `obrolan-claude.html`, `obrolan-claude-rag.html`, `obrolan-claude-ringkas.html`

Antarmuka percakapan AI tingkat lanjut yang mengadopsi estetika antarmuka modern (terinspirasi dari Claude / ChatGPT) dengan kemampuan beralih antar penyedia model AI secara dinamis.

---

## 🔌 Dukungan Multi-Provider

Antarmuka ini dapat dihubungkan ke berbagai penyedia model sesuai preferensi pengguna:

```
                  +---------------------------+
                  |  Antarmuka Obrolan Chat   |
                  +---------------------------+
                                |
      +-------------------------+-------------------------+
      |                         |                         |
      v                         v                         v
[ Chrome Built-in AI ]     [ Ollama Local ]      [ OpenAI / LM Studio ]
(Gemini Nano - 100% luring) (Llama 3, Mistral)     (GPT-4o, Localhost)
```

1. **Chrome On-Device (Gemini Nano):**
   - Menggunakan API bawaan `window.ai` / Chrome Prompt API.
   - Bekerja 100% offline tanpa koneksi internet, tanpa biaya, latensi instan.
2. **Ollama Local Server:**
   - Menghubungkan antarmuka ke endpoint REST API Ollama lokal di `http://localhost:11434`.
   - Mendukung model open-weight berukuran besar seperti Llama 3, DeepSeek-R1, Mistral, Gemma 2, dan Qwen.
3. **OpenAI / Custom API Compatible:**
   - Mendukung server inferensi lokal seperti **LM Studio**, **LocalAI**, **vLLM**, maupun API eksternal OpenAI resmi dengan memasukkan Base URL dan API Key.

---

## 🎨 Fitur Visual & Pengalaman Pengguna (UX)

* **Mermaid.js Diagram Interaktif:** Menghasilkan bagan alur, sequence diagram, atau entity relationship diagram yang dapat diperbesar (*zoom*), digeser (*pan*), dan diekspor ke SVG/PNG (`ai-mermaid-controls.js`).
* **KaTeX Math Rendering:** Merender formula matematika LaTeX yang kompleks secara presisi.
* **Prism.js / CodeMirror Syntax Highlighting:** Pewarnaan sintaks kode program yang rapi dengan tombol salin 1-klik.
* **Penyimpanan Sesi Permanen (IndexedDB):** Percakapan disimpan ke database lokal browser (`ClaudeChatDB`). Tidak ada riwayat obrolan yang hilang saat browser ditutup.
* **Pencarian Riwayat Cepat:** Menemukan obrolan lama berdasarkan kata kunci secara instan (`session-search.js`).
* **Ekspor Multi-Format:** Mengunduh ringkasan percakapan ke format PDF, DOCX, TXT, dan JSON.
