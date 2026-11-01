# 💎 Provider: Chrome Built-in AI (Gemini Nano)

**Chrome Built-in AI** (juga dikenal sebagai **Prompt API**) adalah inisiatif resmi dari Google Chrome dan W3C Web Machine Learning Working Group untuk mengintegrasikan Large Language Model langsung ke dalam peramban web (*browser runtime*).

---

## ⚡ Karakteristik Gemini Nano

* **Model:** Gemini Nano (arsitektur transformer ringan yang dioptimalkan untuk perangkat keras konsumen).
* **Ukuran Bobot:** ~1.5 GB hingga 2.5 GB (diunduh otomatis oleh Chrome ke penyimpanan lokal).
* **Konsumsi Daya & RAM:** Sangat hemat (berjalan di background browser).
* **Koneksi:** 100% Offline (bisa digunakan di mode pesawat / tanpa internet).
* **Akses API JavaScript:** Objek global `window.ai` atau `window.model` (sesuai spesifikasi Chrome Prompt API terkini).

---

## 💻 Contoh Penggunaan API di Balik Layar

Di dalam modul aplikasi seperti `obrolan-claude.html`, integrasi dengan Prompt API dilakukan secara deklaratif:

```javascript
// 1. Memeriksa ketersediaan Gemini Nano di browser
const capabilities = await window.ai.languageModel.capabilities();

if (capabilities.available === 'readily') {
  console.log("Gemini Nano siap digunakan!");
  
  // 2. Membuat sesi baru
  const session = await window.ai.languageModel.create({
    systemPrompt: "Anda adalah asisten AI lokal yang ramah dan cerdas."
  });

  // 3. Mengirim prompt dan menerima streaming token respons
  const stream = session.promptStreaming("Jelaskan konsep WebGPU secara sederhana.");
  for await (const chunk of stream) {
    console.log(chunk);
  }
} else if (capabilities.available === 'after-download') {
  console.log("Model sedang diunduh oleh Chrome di latar belakang.");
} else {
  console.warn("Prompt API belum diaktifkan atau hardware tidak memenuhi syarat.");
}
```

---

## 🛠️ Status Diagnostik Model di Chrome

Anda dapat memantau status internal model Gemini Nano di tab khusus browser:
```text
chrome://on-device-internals
```
Di halaman ini Anda dapat melihat:
- Versi model yang sedang aktif.
- Statistik eksekusi prompt (latensi time-to-first-token dan token per detik).
- Penggunaan VRAM/RAM sistem.
