# Uji Fase 0 — panduan & catatan hasil

Tujuan: memastikan lima hal ini **bisa** di HP Android & ESP32-S3 sungguhan sebelum Fase 1–9
dibangun (lihat [plan-koneksi-langsung.md](plan-koneksi-langsung.md)). Semua kode uji bersifat
sementara dan dibuang setelah Fase 1.

| Bagian | Lokasi |
|---|---|
| Firmware uji (BLE + UDP + statistik) | `firmware/spike_fase0/` |
| Plugin UDP Android | `android/app/src/main/java/id/nadi/prototipe/UdpReceiverPlugin.java` |
| Layar uji di app | Layar **Masuk** → *Fitur demo* → **Uji Fase 0 (pengembang)** (`src/screens/UjiFase0.jsx`) |
| Dekoder paket UDP | `src/lib/csiPacket.js` |

## Persiapan

1. **Flash firmware uji** (terminal ESP-IDF v6.1 / PowerShell yang sudah menjalankan profil ESP-IDF):

   ```powershell
   cd firmware\spike_fase0
   idf.py -p COMx flash monitor      # cek nomor port: python sensor\csi_bridge.py --list-ports
   ```

   Terminal akan mencetak baris `STAT ...` tiap detik. Keluar dari monitor: `Ctrl+]`.
   Firmware uji **tidak butuh** `wifi_secrets.h`: nama & sandi hotspot dikirim lewat BLE dari app.

2. **Pasang APK** `android/app/build/outputs/apk/debug/app-debug.apk` di HP yang akan menjadi HP Pusat.

3. **Firebase** (untuk bagian 3):
   - Buat project di Firebase Console → aktifkan **Authentication → Email/Password** dan
     **Realtime Database** (mode terkunci).
   - Tambahkan Web app, salin `.env.example` menjadi `.env.local`, isi nilainya.
   - Buat satu akun uji di Authentication → Users.
   - Aturan Realtime Database sementara untuk uji (hanya pemilik yang boleh membaca/menulis datanya):

     ```json
     { "rules": { "uji": { "$uid": { ".read": "auth.uid === $uid", ".write": "auth.uid === $uid" } } } }
     ```

   - Build ulang APK setelah `.env.local` diisi: `npm run apk`.

## Langkah uji

### 1 & 2 — Pasang alat lewat BLE, lalu terima UDP

1. HP Pusat: nyalakan **hotspot 2,4 GHz**, matikan "hotspot mati otomatis".
2. Buka app → *Uji Fase 0* → bagian 1 **Mulai dengarkan**.
3. Bagian 2 **Cari alat** → pilih `NADI-XXXX` → isi nama & sandi hotspot → **Kirim ke alat**.
4. Status dari alat berubah `menunggu` → `tersambung ip=… gw=…`; bagian 1 mulai menghitung paket.
5. Catat angka setelah ±2 menit.

### 2b — Pengaruh BLE ke laju CSI

Di terminal monitor, perhatikan `csi_ap` & `csi_kirim` selama 30 detik dengan BLE menyala
(`ble=iklan` / `ble=terhubung`), lalu ketik **`b`** untuk mematikan BLE dan amati 30 detik lagi.
Perintah lain: `f` = lupakan hotspot, `c` = cetak baris `CSI_DATA` (beban serial seperti firmware utama).

### 3 — Firebase

Bagian 3: isi email & sandi akun uji → **Masuk & uji tulis-baca**. Ulangi 3×, catat waktunya.
Coba juga saat HP Pusat sedang menjadi hotspot (internet dari data seluler).

### 4 — Layar tetap menyala

Bagian 4 **Jaga layar tetap menyala**, biarkan app terbuka ±1 jam (boleh bersamaan dengan uji 1).

## Catatan hasil

Isi setelah diuji. HP: ______________ (merek, model, versi Android)

| Uji | Hasil | Angka | Lolos? |
|---|---|---|---|
| 1. UDP dari alat via hotspot | Diterima APK lewat plugin UDP, sama dengan yang dikirim alat (`udp_ok` ±43/dtk, BLE mati). Hotspot tidak mengisolasi klien | paket/dtk: **40–46** · hilang: **0%** (11.657 paket berturut-turut, ±4,5 mnt) · RSSI −51 dBm | **Ya** (22 Okt) |
| 2. Pasang lewat BLE | Nama & sandi terkirim dari app, alat tersambung ke hotspot (gateway HP `10.42.198.18`), `udp_err=0` | – | **Ya** (22 Okt) |
| 2b. CSI dengan BLE nyala vs mati | BLE nyala: CSI datang bergerombol (power save wajib saat BLE aktif). BLE mati: tepat 50/dtk | `csi_kirim`: **±22** vs **±43** /dtk | **Ya, dengan syarat**: BLE harus mati setelah pemasangan (sesuai plan Fase 1). Batas laju 18 ms ikut membuang ±7/dtk karena jitter → longgarkan di Fase 1 |
| 3. Firebase tulis-baca | Login email (Firebase Auth) + tulis-baca RTDB `asia-southeast1` dari WebView APK berhasil, juga saat HP menjadi hotspot (internet dari data seluler) | WiFi: **92 ms** · hotspot + data seluler: **146 ms** | **Ya** (22 Okt) |
| 4. Layar menyala ±1 jam | **Ditunda** (tidak ada waktu 1 jam). Risiko rendah: plugin memakai `FLAG_KEEP_SCREEN_ON` bawaan Android. Teruji alami saat mode lansia dipakai lama di Fase 5/9 | jeda terlama: ___ dtk | Ditunda |

### Kesimpulan (22 Okt 2026)

Arsitektur di plan **bisa dipakai tanpa perubahan besar**: alat → hotspot HP Pusat → UDP → APK,
pemasangan lewat BLE, dan Firebase lewat data seluler saat HP menjadi hotspot semuanya lolos.
Dua hal wajib dibawa ke Fase 1:

1. **BLE dimatikan setelah alat tersambung** (BLE aktif memaksa power save WiFi → CSI ±22/dtk; mati → ±43/dtk).
2. **Longgarkan batas laju CSI** (18 ms membuang ±7 paket/dtk karena jitter; balasan ping sudah tepat 50/dtk).

## Kalau gagal

| Gejala | Kemungkinan & langkah berikut |
|---|---|
| BLE tidak menemukan `NADI-XXXX` | Bluetooth/izin "Perangkat sekitar" belum diizinkan; alat terlalu jauh; cek log terminal `BLE menyala sebagai …` |
| Status alat `gagal:201` | Hotspot tidak ditemukan / 5 GHz / nama salah |
| Status alat `gagal:15` atau `gagal:202` | Sandi hotspot salah |
| Alat `tersambung` tapi UDP 0 paket, `udp_ok` di terminal naik | HP mengisolasi klien hotspot / firewall → rencana B: WebSocket server di ESP32 (HP yang menghubungi alat) |
| `udp_err` naik di terminal | Alat tidak bisa mengirim ke gateway; catat IP/gateway dari baris `STAT` |
| `csi_kirim` jauh di bawah 50 saat BLE nyala | Coexistence BLE/WiFi → BLE harus dimatikan setelah pemasangan (sudah direncanakan di Fase 1) |
| Firebase `auth/network-request-failed` | Tidak ada internet saat hotspot menyala → cek data seluler |
