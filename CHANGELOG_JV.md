# 📋 Cathetan Pangowahan (Changelog)

<div align="center">
  <p>
    <b><a href="CHANGELOG.md">🇮🇩 Bahasa Indonesia</a> | <a href="CHANGELOG_EN.md">🇬🇧 English</a> | ꦗꦮ Basa Jawa</b>
  </p>
</div>

Sedaya owah-owahan wigatos wonten ing proyek **Chrome On-Device AI Playground** dipun-cathet wonten ing berkas punika.
Format panyeratan manut paugeran [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) saha paugeran [Semantic Versioning](https://semver.org/).

---

## [2.1.0] - 2026-11-02

### ✨ Dipun-tambahaken (Added)
- **Panyengkuyung Tri-Basa Portal Utama (ID, EN, JV) & Modal Pamilih Basa (`index.html`, `index_en.html`, `index_jv.html`)**:
  - Modal sugeng rawuh (*Welcome Language Modal*) interaktif ing `index.html` kangge milih basa kawitan (Bahasa Indonesia, English, Basa Jawa) nalika sepisanan bikak portal.
  - Menu mudhun (*dropdown*) 3 basa (`[🇮🇩 ID ▾]`, `[🇬🇧 EN ▾]`, `[ꦗꦮ JV ▾]`) wonten ing bilah navigasi nginggil kanthi wujud *floating pill* 46px ingkang rapi ing piranti seluler.
  - Portal wutuh Basa Jawa (`index_jv.html`) mawi basa Krama Madya ingkang baku kangge sedaya elemen antarmuka, 18 kertu aplikasi, narasi edukatif, lan modal dhialog.
  - Portal wutuh Basa Inggris (`index_en.html`).
- **Simulasi Alur Arsitektur Interaktif SVG & Metrik Langsung (`index.html`, `index_en.html`, `index_jv.html`)**:
  - Diagram alur interaktif mawi animasi SVG kanthi 3 tombol pacoban alur (`💬 Naskah & Kode`, `📄 Dhokumen RAG`, `🖼️ Analisis Gambar`).
  - Bilah metrik langsung (*Live Metrics Bar*) ingkang nganyari kahanan latensi, privasi RAM piranti, akselerator hardware (NPU/GPU), lan sumadyaning mode luring.
- **Skrip Paneliti Integritas Aset & Pangundhuh Model Otomatis (`verify_assets.py`, `verify_assets.sh`, `verify_assets.bat`)**:
  - Paneliti otomatis berkas model embedding ONNX lokal kangge ndeteksi *stub pointer* Git LFS (< 2 KB).
  - Pangundhuh otomatis saking cermin peladen (`https://agendakelas.my.id/models.zip`) lan cadhangan Google Drive kanthi ekstraksi otomatis dhateng direktori `models/`.
  - Kagabung langsung salebeting skrip instalasi lintas platform (`setup.sh`, `setup_mac.command`, `setup.bat`).
- **Panyampurnan Sistem In-Browser RAG & Vector Knowledge Base (`obrolan-claude-rag.html`, `analisis-vision-rag.html`)**:
  - Pamilih model embedding dinamis: `all-MiniLM-L6-v2` (22 MB) lan `multilingual-e5-small` (118 MB) mawi fitur *1-click re-index*.
  - *Smart header-aware chunking* ingkang njagi struktur sesirah Markdown lan nomer kaca dhokumen PDF.
  - *Hybrid Search Engine* (Kombinasi Cosine Similarity 65% + Lexical BM25 35%).
  - Sitasi rujukan akurat mawi pil nomer kaca (`Hal. X`) lan katrangan skor hibrid.
  - Tombol *Strict Anti-Hallucination Mode* kangge nyegah wangsulan ing sanjawining dhokumen.
- **Panyampurnan Responsivitas Mobile-First & Tab Sistem Operasi**:
  - Pandhapukan kawitan (*early execution*) kangge tab sistem operasi (macOS, Windows, Linux) ing bagean Quickstart supados saged ka-switch seketika.
  - Pangecalan garis wates biru ganda (*browser focus ring*) wonten ing tombol tab.

---

## [2.0.0] - 2026-11-02
- Peluncur Chrome Otomatis Multi-Platform kanthi Deteksi Edisi (`launch_chrome_ai.sh`).
- Skrip Instalasi Dependensi Lintas Platform (`setup.sh`, `setup.bat`).
- Peluncur Native macOS Swift GUI (`jalankanserverFN.command`).
