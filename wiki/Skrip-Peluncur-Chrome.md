# 🚀 Skrip Peluncur Chrome Otomatis

File: `launch_chrome_ai.sh`, `launch_chrome_mac.command`, `launch_chrome_ai.bat`

Mengaktifkan fitur AI On-Device di Chrome seringkali membingungkan karena pengguna harus mencari flags tersembunyi di `chrome://flags`, dan perubahan flags pada profil utama dapat mengganggu aktivitas browsing sehari-hari.

Untuk mengatasi hal tersebut, repositori ini menyertakan **Skrip Peluncur Chrome Otomatis** lintas platform.

---

## 🧠 Fitur Cerdas Peluncur Otomatis

### 1. Deteksi Edisi Chrome Terbaik
Skrip akan memindai komputer dan memilih varian browser Chrome dengan prioritas:
1. **Google Chrome Canary** (Prioritas Tertinggi - fitur AI eksperimental paling mutakhir)
2. **Google Chrome Dev**
3. **Google Chrome Beta**
4. **Google Chrome Biasa (Stable)**

### 2. Pengecekan Spesifikasi Perangkat Otomatis
Skrip membaca kapasitas RAM dan kapasitas ruang kosong hard drive:
* Jika RAM < 16 GB, skrip secara otomatis menyertakan flag `--enable-features=OptimizationGuideOnDeviceModel:compatible_on_device_performance_classes/*` atau setelan bypass performa agar Chrome tidak menonaktifkan model Gemini Nano karena batasan memori.

### 3. Profil Pengguna Terisolasi (Sandboxed Profile)
Skrip menjalankan browser dengan parameter `--user-data-dir`:
* macOS/Linux: `/tmp/chrome-ai-profile`
* Windows: `%TEMP%\chrome-ai-profile`

> 💡 **Manfaat:** Profil kerja harian Anda (bookmark, riwayat, tab aktif, ekstensi) sama sekali tidak terpengaruh, dan flags AI langsung aktif tanpa perlu me-restart Chrome utama Anda.

### 4. Otomasi Membuka Tab Esensial
Saat dijalankan, browser akan otomatis membuka:
1. Halaman portal utama: `http://localhost:8080/index.html`
2. Halaman unduhan model: `chrome://components`
3. Halaman diagnostik internal AI: `chrome://on-device-internals`

---

## 🏃 Cara Menggunakan

* **macOS:** Klik ganda berkas `launch_chrome_mac.command` di Finder, atau jalankan `./launch_chrome_ai.sh` di Terminal.
* **Linux:** Jalankan `bash launch_chrome_ai.sh` di Terminal.
* **Windows:** Klik ganda berkas `launch_chrome_ai.bat` di File Explorer.
