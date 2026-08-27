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




3. **Menjalankan File:**
* Cukup buka salah satu file `.html` (misalnya `vision_ulti.html` atau `claude.html`) langsung di browser Chrome Anda.



---

## 🤝 Kontribusi

Silakan buat *Pull Request* atau laporkan kendala jika Anda ingin mengembangkan eksperimen ini bersama-sama!

---

## 📄 Lisensi

Proyek ini bersifat open-source di bawah [MIT License](https://www.google.com/search?q=LICENSE).
