# 🚩 Konfigurasi Chrome Flags & Gemini Nano

Untuk memanfaatkan kemampuan **Chrome Built-in AI (Prompt API)** dan **WebGPU**, browser Google Chrome Anda perlu diaktifkan fiturnya melalui halaman konfigurasi internal browser (`chrome://flags`).

---

## 🛠️ Langkah Konfigurasi Manual

Ikuti 4 langkah mudah berikut:

### 1. Buka Menu Flags di Chrome
Ketik alamat berikut di address bar Chrome Anda dan tekan Enter:
```text
chrome://flags
```

### 2. Aktifkan Flags AI & WebGPU
Cari dan ubah konfigurasi pada 3 flag berikut:

1. **`Optimization Guide On Device Model`**
   - Cari kata kunci: `optimization guide on device`
   - Nilai: Ubah dari *Default* menjadi **`Enabled BypassPerfRequirement`**.
   - *Catatan: Opsi ini memungkinkan Chrome menjalankan Gemini Nano meskipun perangkat Anda memiliki spesifikasi RAM di bawah rekomendasi resmi Google.*

2. **`Prompt API for Gemini Nano`**
   - Cari kata kunci: `prompt api`
   - Nilai: Ubah dari *Default* menjadi **`Enabled`**.

3. **`Enables WebGPU`**
   - Cari kata kunci: `webgpu`
   - Nilai: Ubah menjadi **`Enabled`**.

### 3. Restart / Relaunch Chrome
Klik tombol biru **Relaunch** yang muncul di pojok kanan bawah jendela Chrome untuk menerapkan perubahan flags.

### 4. Pastikan Bobot Model Gemini Nano Terunduh
1. Buka tab baru di browser dan akses:
   ```text
   chrome://components
   ```
2. Cari komponen bernama **Optimization Guide On Device Model**.
3. Klik tombol **Check for update**.
4. Perhatikan statusnya:
   - Jika status menunjukkan **"Downloading..."**, tunggu beberapa menit hingga selesai (ukuran model berkisar antara 1.5 GB - 2.5 GB).
   - Jika status menunjukkan **"Up-to-date"**, model Gemini Nano sudah siap digunakan 100%!

---

## 🚀 Peluncur Otomatis Chrome AI (Tanpa Ubah Flags Manual)

Jika Anda tidak ingin mengubah flags satu per satu secara manual atau tidak ingin mengganggu profil Chrome kerja harian Anda, repositori ini telah menyediakan **Peluncur Chrome Otomatis Berisolasi**:

* **macOS:** Klik ganda berkas `launch_chrome_mac.command` atau jalankan `./launch_chrome_ai.sh`.
* **Windows:** Klik ganda berkas `launch_chrome_ai.bat`.

### Apa kelebihan peluncur otomatis ini?
1. Menggunakan direktori data pengguna terpisah (`/tmp/chrome-ai-profile` atau `%TEMP%\chrome-ai-profile`), sehingga tab kerja Anda tetap aman.
2. Otomatis menyuntikkan seluruh flags AI yang diperlukan langsung saat startup.
3. Otomatis mendeteksi varian Chrome terbaik yang terpasang di komputer Anda (memprioritaskan Chrome Canary > Dev > Beta > Stable).
4. Otomatis membuka tab aplikasi playground, tab `chrome://components`, dan tab diagnostik `chrome://on-device-internals`.
