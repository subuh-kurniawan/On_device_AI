# 🚀 Chrome On-Device AI Playground (V2.1.0)

<div align="center">
  <p>
    <b><a href="README.md">🇮🇩 Bahasa Indonesia</a> | <a href="README_EN.md">🇬🇧 English</a> | ꦗꦮ Basa Jawa</b>
  </p>
  <img width="100%" alt="On-Device AI Playground Banner" src="nano_asset/assets/og-image.jpg" />
  <p><em>Kempalan panaliten lan purwarupa (prototype) aplikasi AI Client-Side ingkang lumampah 100% kanthi lokal ing salebeting browser panjenengan, tanpa server eksternal, tanpa ragad API, lan kanthi jaminan privasi data ingkang wutuh.</em></p>
  <p>
    <a href="CHANGELOG_JV.md"><b>📋 Tingali Cathetan Pangowahan (Changelog)</b></a>
  </p>
</div>

---

## 📑 Pratélan Isining Berkas
- [🚀 Chrome On-Device AI Playground (V2.1.0)](#-chrome-on-device-ai-playground-v210)
  - [✨ Gambaran Umum](#-gambaran-umum)
  - [📂 Struktur & Modul Proyek](#-struktur--modul-proyek)
    - [1. `index.html`, `index_en.html`, & `index_jv.html` (Portal Tri-Basa)](#1-indexhtml-index_enhtml--index_jvhtml-portal-tri-basa)
    - [2. `mesin-litert-lm.html` (Mesin WebGPU LiteRT-LM)](#2-mesin-litert-lmhtml-mesin-webgpu-litert-lm)
    - [3. `obrolan-claude.html` (Antarmuka Pirembagan Multi-Provider)](#3-obrolan-claudehtml-antarmuka-pirembagan-multi-provider)
    - [4. `analisis-vision.html` & `analisis-kode.html` (Analisis Gambar & Kode)](#4-analisis-visionhtml--analisis-kodehtml-analisis-gambar--kode)
    - [5. `percakapan-gemini-live.html` (Pirembagan Suwanten Real-Time)](#5-percakapan-gemini-livehtml-pirembagan-suwanten-real-time)
  - [🧠 In-Browser RAG & Basis Kawruh Vektor](#-in-browser-rag--basis-kawruh-vektor)
  - [🌐 LAN AI Relay Server (Akses lumantar HP/Tablet)](#-lan-ai-relay-server-akses-lumantar-hptablet)
  - [🛠️ Arsitektur & Teknologi](#️-arsitektur--teknologi)
  - [🚀 Cara Nguripake wonten ing Komputer Pribadhi](#-cara-nguripake-wonten-ing-komputer-pribadhi)

---

## ✨ Gambaran Umum

Repositori punika minangka papan pasinaon (*playground*) kangge nyobi kabisan **Browser-based AI**. Kanthi migunakaken standar web paling enggal kados **WebGPU** saha **Chrome Built-in AI (Prompt API)**, repositori punika mbuktekaken bilih model basa ageng (LLM) saged mlaku langsung ing piranti panjenengan (GPU/NPU lokal) kanthi latensi kilat.

**Kaluwihan Pokok:**
* **Privasi Wutuh (100% Luring / Offline):** Sedaya pamrosesan pitakon, analisis dhokumen, lan obrolan dipun-tindakaken ing RAM piranti panjenengan. Mboten wonten data ingkang kakintun dhateng internet.
* **Kinerja Akselerasi Hardware:** Migunakaken WebGPU kangge nggayuh kakuwatan NPU lan GPU piranti kanthi langsung.
* **Arsitektur Tanpa Server Eksternal:** Antarmuka murni kagabung saking HTML5, CSS3 modern, lan Vanilla JavaScript ES Modules.
* **Panyengkuyung Akses Multi-Device (LAN Bridge):** Komputer saged mbagi kabisan AI lokal dhateng ponsel/tablet ing jaringan Wi-Fi ingkang sami lumantar sambungan SSL HTTPS.

---

## 📂 Struktur & Modul Proyek

### 1. `index.html`, `index_en.html`, & `index_jv.html` (Portal Tri-Basa)
Kaca punjer kangge madosi sedaya varian aplikasi AI ingkang sumadya ing 3 basa (Bahasa Indonesia, English, lan Basa Jawa).
* **Welcome Language Modal:** Modal interaktif ingkang medal nalika sepisanan mbikak `index.html` kangge milih basa ingkang dipun-karepaken.
* **3-Way Language Switcher:** Menu mudhun (*dropdown*) ringkas (`[🇮🇩 ID ▾]`, `[🇬🇧 EN ▾]`, `[ꦗꦮ JV ▾]`) ing bilah nginggil mawi ukuran 46px ingkang kepenak ing layar HP.
* **Simulasi Alur Interaktif SVG & Live Metrics:** Diagram arsitektur 4-lapisan mawi animasi sirkuit SVG lan tombol pacoban (`💬 Naskah & Kode`, `📄 Dhokumen RAG`, `🖼️ Analisis Gambar`).
* **Narasi Edukatif Chrome On-Device AI:** Katrangan cetha babagan kadospundi Gemini Nano makarya kanthi privasi 100% luring.
* **Quickstart OS Tabs:** Pituduh ngundhuh lan nguripake lokal mawi tab sistem operasi (macOS, Windows, Linux) lan tombol nurun prentah 1-klik.

---

## 🧠 In-Browser RAG & Basis Kawruh Vektor

Aplikasi RAG (`obrolan-claude-rag.html` lan `analisis-vision-rag.html`) ngemot fitur Retrieval-Augmented Generation paling modern:
* **Pamilih Model Embedding Dinamis:** `all-MiniLM-L6-v2` (22 MB, entheng) lan `multilingual-e5-small` (118 MB, presisi dhuwur) mawi fitur *1-click re-index*.
* **Smart Header-Aware Chunking:** Mbedhah naskah kanthi nggatekaken struktur sesirah Markdown lan nomer kaca dhokumen PDF asli.
* **Hybrid Search Engine:** Nggabungaken *Cosine Similarity Vektor* (bobot 65%) kaliyan *Lexical BM25 Keyword Search* (bobot 35%).
* **Sitasi Sumber Akurat:** Nampilaken nomer kaca (`Hal. X`) lan skor relevansi hibrida ingkang cetha.
* **Strict Anti-Hallucination Mode:** Tombol sakelar supados model namung paring wangsulan miturut dhokumen ingkang sampun kabuktikaken.

---

## 🚀 Cara Nguripake wonten ing Komputer Pribadhi

1. **Undhuh repositori:**
```bash
git clone https://github.com/subuh-kurniawan/On_device_AI.git
cd On_device_AI
```

2. **Pasang dependensi & priksa model:**
- **macOS:** `./setup_mac.command`
- **Linux:** `./setup.sh`
- **Windows:** `setup.bat`

3. **Uripake peladen lokal:**
- **macOS:** `./jalankanserverFN.command`
- **Windows:** `start_win.bat`
- **Terminal biasa:** `npm start`
