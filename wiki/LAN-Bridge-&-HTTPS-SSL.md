# 📡 LAN Bridge & Akses Multi-Device (HP/Tablet)

File: `start_lan_mac.command`, `start_lan_server.command`, `cert.pem`, `key.pem`

Ingin menikmati kecerdasan AI lokal di smartphone, iPad, atau tablet Android Anda tanpa harus menginstal model berukuran bergiga-giga di memori ponsel?

Dengan fitur **LAN AI Bridge**, komputer host Anda (Mac atau PC) bertindak sebagai penyedia komputasi AI (*processing hub*), sementara perangkat seluler Anda dapat terhubung secara nirkabel melalui jaringan Wi-Fi lokal.

---

## 🔒 Mengapa Memerlukan Sertifikat SSL (HTTPS)?

Peramban modern di perangkat seluler (seperti Safari di iOS atau Chrome di Android) menerapkan kebijakan keamanan ketat (*Web Secure Context*):
* Fitur seperti **WebGPU**, **Kamera (OCR/Vision)**, **Mikrofon (Voice)**, dan **Service Workers** **diblokir sepenuhnya** pada koneksi HTTP biasa jika diakses dari alamat IP non-localhost (misal: `http://192.168.1.15:8080`).
* Oleh karena itu, koneksi wajib diamankan dengan sertifikat SSL (**HTTPS**).

---

## 🛠️ Cara Kerja Pembuatan Sertifikat Otomatis

Skrip setup otomatis mendeteksi IP lokal komputer Anda dan membuat sertifikat mandiri (*self-signed certificate*) menggunakan OpenSSL dengan konfigurasi SAN (*Subject Alternative Name*):

```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$(IP_LAN)"
```

Berkas `cert.pem` (sertifikat publik) dan `key.pem` (kunci privat) ini digunakan oleh server relay lokal.

---

## 📱 Langkah Menghubungkan HP / Tablet ke Host AI

1. **Pastikan Komputer dan HP Berada di Jaringan Wi-Fi yang Sama.**
2. **Jalankan Server LAN:**
   - Di Mac: Klik ganda `start_lan_mac.command` atau jalankan GUI `jalankanserverFN.command`.
   - Di Terminal: `npm run serve` atau jalankan skrip Python HTTPS server.
3. **Pindai Kode QR atau Buka URL di HP:**
   - Di halaman web mana pun pada browser komputer Anda, klik tombol **QR HP** di sudut navigasi.
   - Buka aplikasi kamera di ponsel dan arahkan ke kode QR yang muncul.
   - Atau ketik alamat URL secara manual di browser HP: `https://[IP-Komputer-Anda]:1234`
4. **Menerima Sertifikat Mandiri (Hanya Sekali):**
   - Saat pertama kali membuka URL HTTPS lokal, browser HP akan menampilkan peringatan keamanan ("Koneksi Anda tidak privat").
   - Klik **Tingkat Lanjut (Advanced)** lalu pilih **Lanjutkan ke situs (Proceed / Accept Risk)**.
5. **Selesai!** HP atau tablet Anda sekarang dapat menggunakan seluruh fitur AI secara lancar tanpa membebani prosesor atau baterai ponsel.
