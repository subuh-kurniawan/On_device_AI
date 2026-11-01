# 🔗 Provider: OpenAI & LM Studio Custom Endpoints

Selain Gemini Nano dan Ollama, antarmuka percakapan juga mendukung standar industri **OpenAI-Compatible REST API**. Hal ini memungkinkan integrasi dengan berbagai perangkat lunak inferensi lokal maupun layanan cloud.

---

## 💻 1. LM Studio (Inferensi Lokal via Antarmuka Grafis)

**LM Studio** adalah aplikasi desktop populer untuk menjalankan model GGUF (Llama, Mistral, Phi-3, Command-R, dll) dengan akselerasi GPU lokal.

### Langkah Integrasi:
1. Pasang LM Studio dari [lmstudio.ai](https://lmstudio.ai).
2. Unduh model pilihan Anda di tab pencarian LM Studio.
3. Masuk ke tab **Local Server** (ikon panah dua arah `<->`).
4. Pastikan opsi **CORS** diaktifkan (centang *Enable CORS*).
5. Klik **Start Server**. Server lokal akan berjalan di:
   ```text
   http://localhost:1234/v1
   ```
6. Pada antarmuka obrolan playground:
   - Provider: **OpenAI / Custom Endpoint**
   - Base URL: `http://localhost:1234/v1`
   - Model Name: nama model yang dimuat di LM Studio
   - API Key: isi sembarang karakter (misal `lm-studio`)

---

## 🌐 2. Layanan Cloud OpenAI Resmi (GPT-4o / GPT-4o-mini)

Jika sewaktu-waktu Anda memerlukan perbandingan kemampuan antara model lokal dengan model cloud komersial tercanggih:

### Langkah Integrasi:
1. Dapatkan API Key Anda dari platform pengembang OpenAI: `https://platform.openai.com/api-keys`.
2. Pada menu **Settings** antarmuka obrolan:
   - Provider: **OpenAI / Custom Endpoint**
   - Base URL: `https://api.openai.com/v1`
   - Model Name: `gpt-4o-mini` atau `gpt-4o`
   - API Key: Masukkan kunci rahasia OpenAI Anda (`sk-...`)

> 🔒 **Jaminan Privasi Kunci API:** API Key yang Anda masukkan hanya disimpan secara lokal di `localStorage` peramban Anda dan tidak pernah dikirim ke server pihak ketiga mana pun selain langsung ke endpoint OpenAI yang Anda tentukan.
