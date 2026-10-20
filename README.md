# NADI — Prototipe Interaktif FP HMI

Prototipe interaktif NADI, konsep AI wellness agent untuk lansia, untuk Final Project mata kuliah HMI. Fokus pada UI/UX. Mode demo memakai data dummy; mode sensor langsung (opsional) membaca ESP32-S3 lewat penghubung Python lokal.

## Cara menjalankan

Butuh [Node.js](https://nodejs.org) (versi 20 ke atas).

```bash
npm install
npm run dev
```

Buka alamat yang muncul di terminal (biasanya http://localhost:5173).

## Akun demo & dua sisi (Pusat / Cabang)

App diawali layar **Masuk**. Login ini **simulasi prototipe**: akun dicocokkan dengan
`src/data/dummy.js` (`akun`), tanpa server. Kredensial sengaja tidak ditampilkan di layar.
Peran akun menentukan sisi app:

| Email          | Kata sandi | Peran  | Keterangan                                              |
|----------------|------------|--------|---------------------------------------------------------|
| `sri@nadi.id`  | `nadi1234` | Pusat  | HP Ibu Sri di rumah: setup sekali, lalu mode lansia     |
| `rina@nadi.id` | `nadi1234` | Cabang | Rina Wahyuni (Anak), **sudah tertaut**, langsung Beranda |
| `budi@nadi.id` | `nadi1234` | Cabang | Budi Santoso (Menantu), **belum tertaut**               |

- **Kode keluarga** untuk menautkan Cabang: `482 917`. Kode ini terlihat di setup HP Pusat dan di Pengaturan HP Pusat.
- **Membuka pengaturan dari mode lansia:** tekan & tahan "Pengaturan (untuk keluarga)", lalu masukkan kata sandi `sri@nadi.id`.
- **Aliran data Pusat → Cabang disimulasikan** di satu perangkat. Contoh demo: masuk sebagai Sri → "Tampilkan pertanyaan konfirmasi" → "Butuh bantuan" → buka pengaturan → keluar → masuk sebagai Rina. Alert Darurat baru sudah ada di Beranda.

Sesi dan tautan diingat di perangkat. Keluar lewat Pengaturan → Akun → **Keluar**.

## Membuka di HP

- **Lewat WiFi yang sama:** `npm run dev -- --host`, lalu buka alamat "Network" dari terminal di browser HP.
- **Sebagai aplikasi Android (APK):** lihat di bawah.

## Membuat APK Android

Butuh Android Studio (untuk Android SDK dan JDK bawaannya). Di PowerShell:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
npm run apk
```

Pertama kali, buat `android/local.properties` berisi `sdk.dir=C:/Users/<nama>/AppData/Local/Android/Sdk`.
Hasilnya ada di `android/app/build/outputs/apk/debug/app-debug.apk`. Kirim file itu ke HP (WhatsApp, Drive,
atau kabel USB), buka, lalu izinkan "Instal dari sumber tidak dikenal". APK dibuat dengan
[Capacitor](https://capacitorjs.com) dari hasil `vite build`; konfigurasinya di `capacitor.config.json`.

**Mode sensor langsung dari APK:** jalankan penghubung dengan `--host 0.0.0.0`, pastikan HP dan laptop
di WiFi yang sama, lalu isi IP laptop di HP Pusat (langkah "Sambungkan perangkat" saat setup, atau
Pengaturan HP Pusat → Perangkat). Untuk mencoba di HP Cabang: Pengaturan → Sumber data → Sensor langsung (Fitur demo).

## Mode sensor langsung (opsional, ESP32-S3)

Di Pengaturan → Sumber data → **Sensor langsung**, Beranda membaca hasil gerak dari penghubung Python
di laptop. Cara menjalankan, kontrak API, dan batasannya ada di [sensor/README.md](sensor/README.md).

## Sebelum mengubah kode

Baca **AGENTS.md** dulu — isinya aturan project (copy non-medis, warna status, semua data di `src/data/dummy.js`, semua teks di `src/data/copy.js`).
