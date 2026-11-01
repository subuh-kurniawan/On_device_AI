# 🖥️ Menjalankan Server Lokal & Membuka Aplikasi

Karena aplikasi ini berinteraksi dengan API modern seperti **WebGPU**, **Prompt API (`window.ai`)**, **Web Workers**, dan **Service Workers/WASM**, aplikasi **wajib dijalankan melalui server web lokal** (protokol `http://` atau `https://`) dan tidak bisa dibuka langsung melalui double-click file browser (`file:///`).

---

## ⚡ Metode Peluncuran Cepat (Direkomendasikan)

### 🍏 Pengguna macOS
1. **Peluncur Native Swift GUI (`jalankanserverFN.command`):**
   - Klik ganda `jalankanserverFN.command` di Finder.
   - Jendela antarmuka GUI native macOS akan muncul dengan panel status server, port, status SSL, tombol on/off, dan kode QR untuk perangkat seluler.
2. **Peluncur CLI Standar (`start_mac.command` atau `start_lan_mac.command`):**
   - Klik ganda untuk memulai server Python/Node di terminal dan otomatis membuka browser.

### 🪟 Pengguna Windows
- Klik ganda berkas `start_windows.bat` di File Explorer.

---

## 💻 Metode Manual via Terminal / Command Line

Anda dapat memilih server lokal favorit Anda:

### 1. Menggunakan NPM (Node.js)
```bash
# Menjalankan server HTTP standar pada port 8080:
npm start

# Atau menjalankan server HTTPS / LAN relay:
npm run serve
```

### 2. Menggunakan Python 3
```bash
python3 -m http.server 8080
```

### 3. Menggunakan Node.js `http-server`
```bash
npx http-server -p 8080 -c-1
```

---

## 🌐 Alamat Akses di Browser

Setelah server lokal menyala, buka salah satu URL berikut di Chrome Anda:

| Halaman | URL Akses | Deskripsi |
| :--- | :--- | :--- |
| **Portal Utama (ID)** | `http://localhost:8080/index.html` | Beranda utama dengan modal pemilihan bahasa & katalog modul |
| **Portal English (EN)** | `http://localhost:8080/index_en.html` | Full English landing page |
| **Portal Basa Jawa (JV)** | `http://localhost:8080/index_jv.html` | Kaca ngarep Basa Jawa Krama Madya |
| **Mesin WebGPU LiteRT-LM** | `http://localhost:8080/mesin-litert-lm.html` | Mesin inferensi GPU murni lokal |
| **Obrolan Multi-Provider RAG** | `http://localhost:8080/obrolan-claude-rag.html` | Chat AI lengkap dengan pencarian dokumen PDF/vektor |
| **Analisis Vision & RAG** | `http://localhost:8080/analisis-vision-rag.html` | Analisis gambar, OCR, dan telaah dokumen visual |
| **Percakapan Gemini Live** | `http://localhost:8080/percakapan-gemini-live.html` | Interaksi suara & multimodal realtime |
