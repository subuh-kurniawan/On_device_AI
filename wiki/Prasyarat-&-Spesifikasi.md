# 📋 Prasyarat & Spesifikasi Hardware

Sebelum menjalankan **On_device_AI Playground**, pastikan sistem operasi dan perangkat keras Anda memenuhi spesifikasi minimum berikut agar performa inferensi AI berjalan optimal.

---

## 💻 Kebutuhan Sistem Minimum & Rekomendasi

| Komponen | Spesifikasi Minimum | Spesifikasi Rekomendasi |
| :--- | :--- | :--- |
| **Sistem Operasi** | macOS 12 Monterey / Windows 10 (64-bit) / Ubuntu 20.04 LTS | macOS 14 Sonoma (Apple Silicon) / Windows 11 / Linux terkini |
| **Browser** | Google Chrome Desktop v128+ | Google Chrome Dev atau Google Chrome Canary (v131+) |
| **RAM Sistem** | 8 GB (dapat mengaktifkan flag Bypass Perf) | 16 GB atau lebih (sangat disarankan 16 GB+) |
| **Ruang Disk Bebas** | Min. 10 GB ruang kosong (untuk cache model Gemini Nano & model ONNX) | 25 GB SSD ruang kosong |
| **GPU / Akselerator** | GPU terintegrasi yang mendukung WebGPU | GPU diskrit (NVIDIA RTX / AMD Radeon) atau Apple Silicon M-Series GPU/NPU |

---

## 🌐 Kebutuhan Perangkat Lunak (Tools)

Untuk menjalankan server lokal dan skrip automasi, pastikan utilitas berikut tersedia di sistem Anda:

1. **Python 3** (`python3 >= 3.8`): Digunakan untuk menjalankan HTTP server lokal dan verifikator integritas model AI (`verify_assets.py`).
2. **Node.js & NPM** (`node >= 18.0.0`): Opsional/direkomendasikan untuk menjalankan server HTTP via npx dan relay WebSocket.
3. **OpenSSL**: Diperlukan untuk men-generate sertifikat SSL (`cert.pem` dan `key.pem`) agar fitur kamera, mikrofon, dan akses LAN HTTPS dapat berjalan tanpa pemblokiran browser security policy.
4. **Git & Git LFS (Large File Storage)**: Diperlukan untuk mendownload bobot model ONNX lokal berukuran besar.

> 💡 **Kabar Baik:** Anda tidak perlu menginstal peralatan di atas satu per satu secara manual! Skrip automasi proyek (`setup.sh`, `setup_mac.command`, atau `setup.bat`) akan mendeteksi dan menginstalnya secara otomatis untuk Anda.
