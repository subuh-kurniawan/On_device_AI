# 🎙️ Gemini Live & Multimodal Voice

File: `percakapan-gemini-live.html`, `live-conversation.js`

Modul eksperimental ini mengeksplorasi antarmuka masa depan komunikasi manusia-mesin berbasis suara (audio), webcam, dan teks interaktif secara realtime.

---

## 🌟 Fitur Utama

1. **Komunikasi Suara Dua Arah (Voice-to-Voice):**
   - Menggunakan Web Audio API dan Speech Recognition / Web Speech API untuk menangkap suara pengguna secara langsung.
   - Respons model dapat disintesis kembali menjadi suara melalui SpeechSynthesis atau model Text-to-Speech (TTS) berlatensi rendah.
2. **Streaming Kamera & Masukan Multimodal Realtime:**
   - Menangkap frame visual dari kamera/webcam untuk didiskusikan langsung dengan AI secara bergulir.
3. **Visualizer Gelombang Suara (Audio Waveform):**
   - Menampilkan visualisasi gelombang frekuensi audio interaktif berbasis HTML5 Canvas yang berdenyut selaras dengan intonasi ucapan pengguna dan AI.
4. **Koneksi Aman Berbasis HTTPS:**
   - Karena browser modern mewajibkan konteks aman (*Secure Context*) untuk mengakses mikrofon dan kamera perangkat, halaman ini memanfaatkan sertifikat SSL lokal (`cert.pem`) yang telah disiapkan secara otomatis oleh skrip setup proyek.
