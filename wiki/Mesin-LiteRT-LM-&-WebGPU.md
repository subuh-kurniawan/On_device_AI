# ⚡ Mesin LiteRT-LM & WebGPU Engine

File: `mesin-litert-lm.html`

Modul ini merupakan implementasi *state-of-the-art* dari inferensi model bahasa berformat biner langsung di browser dengan akselerasi penuh **WebGPU**, memanfaatkan framework resmi Google **LiteRT-LM** (sebelumnya TensorFlow Lite for LLM / MediaPipe GenAI).

---

## 🔬 Arsitektur Teknis

```
+-----------------------------------------------------------+
|                   mesin-litert-lm.html                    |
+-----------------------------------------------------------+
                             |
       +---------------------+---------------------+
       |                                           |
       v                                           v
[ @litert-lm/core (Utama) ]          [ @mediapipe/tasks-genai (Fallback) ]
       |                                           |
       +---------------------+---------------------+
                             |
                             v
               [ WebGPU Shaders & Compute ]
                             |
                             v
           [ GPU / NPU Hardware (VRAM Lokal) ]
```

### Library & Framework yang Digunakan:
1. **`@litert-lm/core`**: Pustaka modern runtime inferensi LLM di lingkungan browser via WebGPU.
2. **`@mediapipe/tasks-genai`**: Runtime pendamping dan fallback otomatis jika koneksi CDN utama mengalami kendala.

---

## 🌟 Fitur Utama Modul

1. **Dukungan Format Model Modern (`.litertlm` & `.bin`):**
   - Mendukung model-model ringan seperti **Gemma 2B / 4 E2B Instruct**, TinyLlama, dan model SLM lainnya yang telah dikompilasi ke format LiteRT-LM.
2. **Sumber Pemuatan Fleksibel:**
   - **Local File System:** Memuat model langsung dari hard drive lokal pengguna melalui input berkas browser tanpa perlu diunggah ke internet.
   - **Hugging Face Hub Direct Download:** Mengunduh model langsung dari repositori Hugging Face ke dalam cache browser lokal.
3. **Indikator Progres Real-Time:**
   - Menampilkan persentase unduhan bobot model, kecepatan transfer, dan alokasi memori VRAM secara transparan.
4. **Streaming Respons Cepat:**
   - Token kata dihasilkan dan ditampilkan seketika saat proses komputasi GPU berlangsung (*token-by-token streaming*).
5. **Multi-CDN Fallback Otomatis:**
   - Mencegah kegagalan inisialisasi jika salah satu penyedia CDN mengalami pemblokiran atau downtime.
