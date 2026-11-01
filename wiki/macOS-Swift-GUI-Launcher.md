# 🍏 macOS Native Swift GUI Launcher

File: `jalankanserverFN.command`, `jalankanserverFN_gui.swift`

Bagi pengguna platform macOS, proyek ini menyediakan antarmuka kontrol server berbasis grafis (**Native macOS App**) yang ditulis menggunakan bahasa pemrograman **Swift** murni tanpa ketergantungan framework berat seperti Electron.

---

## ⚡ Cara Menjalankan

Cukup klik ganda (double-click) pada berkas:
```text
jalankanserverFN.command
```
di Finder macOS Anda.

> 💡 **Kompilasi Otomatis:** Saat pertama kali dijalankan, skrip shell akan memeriksa apakah biner `jalankanserverFN_gui` sudah ada. Jika belum, skrip akan mengompilasi berkas `jalankanserverFN_gui.swift` secara otomatis menggunakan kompiler bawaan macOS `swiftc`.

---

## 🖥️ Fitur-Fitur Antarmuka GUI

```
+--------------------------------------------------------------+
|        🚀 Chrome On-Device AI Server Controller (macOS)      |
+--------------------------------------------------------------+
| Status Server:  🟢 BERJALAN (Running)                        |
| Port Server:    8080 (HTTP) / 1234 (HTTPS SSL Relay)         |
| Status SSL:     🔒 Aktif (cert.pem & key.pem Terverifikasi)  |
|                                                              |
| [ ▶️ Nyalakan Server ]  [ ⏹️ Hentikan Server ]  [ 🌐 Buka Browser ] |
+--------------------------------------------------------------+
| 📱 Akses LAN Smartphone / Tablet                             |
|    Pindai kode QR berikut untuk membuka di HP:               |
|    [   ████████   ]   URL: https://192.168.1.5:1234/        |
|    [   ██ QR ██   ]                                          |
|    [   ████████   ]                                          |
+--------------------------------------------------------------+
| 📜 Log Aktivitas Server Realtime                             |
| 127.0.0.1 - - [02/Nov/2026 03:00:01] "GET /index.html 200"   |
| 192.168.1.10 - - [02/Nov/2026 03:00:05] "GET /mesin.html 200"|
+--------------------------------------------------------------+
```

1. **Kendali Server Sekali Klik:** Tombol untuk menyalakan (*start*), mematikan (*stop*), dan me-restart server lokal tanpa perlu membuka terminal atau mengingat sintaks perintah.
2. **Indikator Port & SSL:** Memantau ketersediaan sertifikat SSL dan mengecek apakah port 8080/1234 sedang terpakai oleh aplikasi lain.
3. **Kode QR LAN Terintegrasi:** Menghasilkan kode QR ASCII/grafis yang mengarah ke alamat IP lokal komputer host, memudahkan pengujian dari perangkat mobile.
4. **Log Konsol Realtime:** Menampilkan setiap permintaan HTTP dan status kode (200, 404, dsb) secara langsung di jendela aplikasi.
