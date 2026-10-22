# Plan: Alat langsung ke HP Pusat, hasil ke HP Cabang

Status: **Fase 0 selesai** ([hasil uji](uji-fase0.md)) · **Fase 1 (firmware) selesai** 22 Okt 2026
([README firmware](../firmware/csi_receiver/README.md)) · berikutnya Fase 3–5 (plugin Android, pengolahan JS, layar pemasangan)

## Tujuan

HP Pusat tersambung **langsung** ke alat (ESP32-S3), menerima data CSI mentah, mengolahnya sendiri,
lalu mengirim hasilnya ke HP Cabang lewat internet. Data asli menjadi default, bukan demo.
Laptop hanya menjadi **sumber daya + terminal** (menampilkan log, jeda/lanjut, kalibrasi ulang).

## Keputusan yang sudah disepakati

| Topik | Keputusan |
|---|---|
| Jalur data alat → HP Pusat | Hotspot 2,4 GHz **HP Pusat**. ESP32 mengirim CSI lewat **UDP ke alamat gateway** (= HP Pusat), jadi HP tidak perlu mencari IP alat |
| Pemasangan alat | Lewat **BLE**: HP Pusat menemukan alat, mengirim nama & sandi hotspot, lalu kalibrasi |
| HP Pusat → HP Cabang | **Firebase** (Realtime Database) lewat internet |
| Login | **Akun Firebase sungguhan** (Firebase Auth, email + sandi) |
| Notifikasi dari data asli | **Hanya soal alat** dulu (alat terputus, HP Pusat berhenti mengirim) + jawaban Ibu di layar konfirmasi. Belum ada Waspada dari pola gerak |
| On/off dari laptop | Perintah di terminal `csi_bridge.py` (jeda/lanjut, kalibrasi ulang) lewat USB. Cabut kabel = mati total |
| Berjalan di latar | Tidak. Selama mode lansia, app NADI terbuka & layar dijaga menyala |
| Mode demo | Data asli jadi default; demo tetap ada di "Fitur demo" sebagai cadangan presentasi |

## Arsitektur baru

```
                 USB (daya + log + perintah p/r)
   Laptop ◀───────────────────────────────▶ ESP32-S3
   csi_bridge.py (terminal)                   │  ▲
                                              │  │ BLE: pemasangan (nama & sandi hotspot, status)
                    WiFi 2,4 GHz (hotspot HP) │  │
                    UDP: paket CSI mentah     ▼  │
                                         HP Pusat (APK NADI)
                                         - terima UDP, olah CSI (JS)
                                         - kalibrasi, skor gerak, ringkasan per menit
                                              │  data seluler (internet)
                                              ▼
                                     Firebase (Auth + Realtime Database)
                                              │
                                              ▼
                                        HP Cabang (APK / web)
```

Catatan penting: saat HP Pusat menjadi hotspot, ia **tidak bisa sekaligus memakai WiFi** —
internet untuk Firebase datang dari **data seluler** HP Pusat. ESP32 tidak butuh internet.

---

## Fase 0 — Uji risiko dulu (spike, sebelum membangun penuh)

Masing-masing berupa uji kecil yang menjawab "bisa / tidak" di HP Android sungguhan:

1. **UDP di hotspot**: APK menerima paket UDP dari ESP32 yang tersambung ke hotspot HP itu sendiri
   (beberapa merek mengisolasi klien hotspot). Uji pakai firmware yang mengirim paket dummy.
2. **BLE + WiFi + CSI bersamaan** di ESP32-S3: apakah laju CSI turun saat BLE aktif (coexistence).
   Rencana: BLE dimatikan setelah WiFi tersambung, dinyalakan lagi bila hotspot hilang lama.
3. **Plugin BLE** (`@capacitor-community/bluetooth-le`) jalan di Capacitor 8 + izin Android 12+.
4. **Firebase JS SDK** di WebView Capacitor (`androidScheme: http`) — login & tulis/baca RTDB.
5. **WebView tetap jalan** ±1 jam dengan layar menyala (`@capacitor-community/keep-awake`).

Kalau salah satu gagal, plan disesuaikan sebelum lanjut (mis. UDP diganti WebSocket server di ESP32).

## Fase 1 — Firmware ESP32-S3 (`firmware/csi_receiver`)

- **BLE pemasangan (NimBLE, GATT sendiri)** — lebih sederhana untuk app daripada protokol
  `network_provisioning` ESP-IDF. Nama iklan `NADI-XXXX` (4 digit akhir MAC). Karakteristik:
  - `info` (baca): id alat, versi firmware
  - `wifi` (tulis): nama & sandi hotspot → disimpan di **NVS**
  - `perintah` (tulis): sambungkan / lupakan hotspot / kalibrasi ulang
  - `status` (baca + notify): `menunggu`, `menyambung`, `tersambung`, `gagal:<reason>` (201 = hotspot
    tak ditemukan/5 GHz, 15/202 = sandi salah)
  - BLE hanya aktif saat belum dipasang atau hotspot hilang > 30 dtk; mati setelah tersambung.
- `wifi_secrets.h` menjadi **opsional** (cadangan pengembangan). Kredensial produk dari BLE → NVS.
- **Kirim UDP** tiap paket CSI ke `gateway:5005`, format biner ringkas:
  `"NADI"` · versi · id alat · seq · rssi · timestamp · len · `int8[len]`.
  Tetap mencetak `CSI_DATA,...` ke USB untuk terminal laptop.
- **Batasi laju CSI ≤ 50/dtk** (temuan sesi 2: ±160 pkt/dtk → paket hilang & crash).
- **Perintah serial dari laptop**: `PAUSE`, `RESUME`, `RECAL` (dibaca dari USB Serial/JTAG).
  Status jeda ikut dikirim di header UDP supaya HP Pusat menampilkan "Pemantauan dijeda dari alat".
- Selidiki crash backtrace `0x42088AFE` setelah laju dibatasi.

## Fase 2 — Laptop (`sensor/csi_bridge.py`)

- Mode terminal tetap seperti sekarang (status, skor, `GERAK!`), ditambah **tombol keyboard**:
  `p` jeda/lanjut, `r` kalibrasi ulang, `q` keluar → dikirim ke ESP32 lewat serial.
- Server HTTP `/api/sensor/latest` tetap ada (untuk `npm run dev` di laptop & uji tanpa APK),
  tapi bukan jalur utama lagi.
- `csi_processing.py` tetap murni; tambah fixture hasil (`expected.json`) untuk menguji kesamaan
  dengan versi JS (Fase 4).

## Fase 3 — Android native (`android/`)

- **Plugin UDP kecil buatan sendiri** (Java, ±100 baris): `DatagramSocket` di port 5005, paket
  dikumpulkan lalu dikirim ke JS **per 100 ms** (bukan per paket) supaya jembatan WebView ringan.
- BLE: `@capacitor-community/bluetooth-le`; izin `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`
  (+ lokasi untuk Android ≤ 11).
- `@capacitor-community/keep-awake` aktif hanya di mode lansia (`PusatHome`).
- Di browser (`npm run dev`) plugin tidak ada → sumber data otomatis jatuh ke penghubung laptop (HTTP)
  atau replay fixture. Tidak ada kode yang mengandaikan selalu di APK.

## Fase 4 — Pengolahan di HP Pusat (`src/lib`, `src/state`)

- `src/lib/csiProcessing.js`: port **murni** dari `csi_processing.py` (parse biner, kalibrasi format
  + baseline 10 dtk, skor 1 dtk, ambang, data basi, celah `seq`). Waktu selalu dari pemanggil.
- Tes `node --test` memakai fixture yang sama dengan Python → hasil harus sama (paritas).
- `SensorContext` diperluas: sumber `device` (UDP), `bridge` (HTTP laptop, yang lama), `demo`.
  Sumber `device` menghasilkan **bentuk snapshot yang sama** dengan JSON `/api/sensor/latest`,
  jadi `describeSensor()` dan komponen yang ada tetap dipakai.
- Ringkasan di HP Pusat: per menit `ada gerakan ya/tidak/tidak-tersedia`, gerak terakhir,
  status alat. Ringkasan ini yang dikirim ke Firebase — **bukan data mentah**.
- Aturan waktu: di sumber `device`, HP Pusat **adalah** sumber data, jadi waktu kalender dari jam HP
  Pusat (dicatat sebagai `received_at`). AGENTS.md diperbarui untuk aturan ini.

## Fase 5 — Pemasangan di HP Pusat (`PusatSetup`, `PusatSettings`)

Langkah 1 "Perangkat" diganti alur bertahap (teks app keluarga biasa, karena dikerjakan keluarga):

1. **Siapkan hotspot** — petunjuk: nyalakan hotspot HP ini, pilih **2,4 GHz**, matikan "mati otomatis".
   Isi nama & sandi hotspot (Android tidak mengizinkan app membaca sandi hotspot).
2. **Cari alat** — izin Bluetooth → daftar `NADI-XXXX` → pilih.
3. **Sambungkan** — kirim nama & sandi lewat BLE, tampilkan status langkah demi langkah;
   pesan jelas untuk: Bluetooth mati, alat tak ditemukan, sandi salah, hotspot 5 GHz.
4. **Alat terhubung** — terkonfirmasi saat paket UDP pertama diterima (bukan hanya status BLE).
5. **Kalibrasi** — "Mohon ruangan dikosongkan/didiamkan ±10 detik", progres terlihat, lalu "Siap".
6. Kode keluarga → Mulai (langkah yang sudah ada).

Pengaturan HP Pusat: **Kalibrasi ulang**, **Ganti hotspot**, **Lupakan alat**. Prinsip UX: Norman
(feedback tiap langkah), Nielsen (error prevention & pesan yang bisa ditindaklanjuti), Hick (satu
tombol utama per langkah). Layar lansia (`PusatHome`) tidak berubah aturannya.

## Fase 6 — Firebase (Auth + Realtime Database)

- **Firebase Auth email + sandi** menggantikan pencocokan akun di `dummy.js`. `AuthContext` tetap
  menjadi satu-satunya pintu (`login`, `logout`, `user`, `peran`, tautan).
  Akun uji dibuat di Firebase Console; **sandi tidak ditulis di repo**.
- Konfigurasi Firebase lewat `VITE_FIREBASE_*` di `.env.local` (tidak di-commit) + `.env.example`.
- Struktur data (ringkas):
  - `pengguna/{uid}`: peran (`pusat`/`cabang`), nama, kontak
  - `pusat/{pusatId}`: `pemilik` (uid HP Pusat), `lansia`, `anggota/{uid}: true`
  - `pusat/{pusatId}/status`: koneksi alat, kalibrasi, `motion_detected`, `last_motion_at`, `updated_at`
  - `pusat/{pusatId}/menit/{tanggal}/{HH:mm}`: ringkasan per menit
  - `pusat/{pusatId}/alerts/{id}` + respons (dari ElderCheck & tindak lanjut Cabang)
  - `kodeKeluarga/{kode}`: `pusatId` (berlaku terbatas, dibuat ulang dari Pusat)
- **Aturan keamanan**: hanya `pemilik` yang menulis status/menit; hanya `anggota` yang membaca;
  Cabang menjadi anggota dengan menukar kode keluarga yang masih berlaku.
- HP Pusat menulis `status` saat berubah + tiap 30 dtk (detak), `menit` tiap menit.
- **Data basi di Cabang**: `updated_at` > 2 menit → "HP Pusat tidak mengirim data sejak …",
  **tidak pernah** "Normal"/"diam" (aturan yang sudah ada tetap berlaku).

## Fase 7 — App keluarga (HP Cabang) dengan data asli

- Beranda: kartu status alat + gerak terakhir dari Firebase, "Diperbarui … · dari HP Pusat".
- Riwayat: grafik **menit ada gerakan per jam** (label jujur: gerakan di ruangan, bukan aktivitas
  Ibu secara khusus). Tidur & terbangun malam tetap "belum tersedia".
- Notifikasi: alat terputus, HP Pusat berhenti mengirim, jawaban Ibu. **Tanpa** Waspada dari pola gerak.
- Label gerak tetap tanpa warna status (aturan lama). Status Normal/Waspada/Darurat hanya dari alert.

## Fase 8 — Mode demo & dokumentasi

- Default: data asli. Demo dipilih di **Fitur demo** (Pengaturan) — cerita dummy tetap utuh.
- Perbarui `AGENTS.md` (aliran Pusat→Cabang kini nyata lewat Firebase, sumber `device`, aturan waktu),
  `sensor/README.md`, `firmware/csi_receiver/README.md`, dan diagram di `docs/`.

## Fase 9 — Pengujian

- `python -m unittest test_csi` (tetap) + `node --test` paritas pengolahan JS.
- Uji perangkat: pasang dari nol, sandi salah, hotspot 5 GHz, cabut USB, hotspot dimatikan,
  jeda dari laptop, kalibrasi ulang, Cabang di jaringan lain, HP Pusat kehilangan sinyal seluler.
- Uji ulang alur UI (TestSprite) untuk login Firebase & pemasangan.

## Urutan kerja yang disarankan

Fase 0 → 1 → 3 → 4 → 5 (HP Pusat bisa jalan sendiri dengan alat) → 2 → 6 → 7 → 8 → 9.
Tiap fase berakhir dengan sesuatu yang bisa dicoba, jadi bisa berhenti di tengah dengan hasil utuh.

## Yang perlu disiapkan pengguna

- Project Firebase (Auth email/sandi + Realtime Database aktif) dan akun uji Pusat & Cabang.
- HP Android untuk Pusat (catat merek & versi Android — beberapa hotspot mengisolasi klien) dan
  paket data seluler.
- ESP-IDF v6.1 untuk build & flash firmware baru.

## Risiko yang diketahui

- BLE + WiFi berbagi radio di ESP32-S3 → laju CSI bisa turun saat BLE aktif (mitigasi: BLE mati setelah tersambung).
- Sandi hotspot dikirim lewat BLE tanpa enkripsi (cukup untuk prototipe; dibatasi hanya saat mode pemasangan).
- Pengolahan berhenti bila app ditutup/layar mati (sesuai keputusan: app selalu terbuka).
- Akurasi deteksi gerak belum terukur (belum ada pengamatan berlabel) — tetap disebut di UI & laporan.
