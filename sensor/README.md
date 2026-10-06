# Penghubung sensor NADI (ESP32-S3 → API lokal → frontend)

```
Hotspot HP 2,4 GHz ⇄ ESP32-S3 ──USB serial──▶ csi_bridge.py ──HTTP──▶ GET /api/sensor/latest ◀── React (polling 1 dtk)
```

`csi_bridge.py` adalah **satu-satunya** pemilik port serial. Jangan membuka port yang sama dari
serial monitor/`csi_check.py` saat penghubung berjalan. Frontend hanya membaca JSON, tidak pernah
mengurai output terminal.

| File | Isi |
|---|---|
| `csi_processing.py` | Pengolahan murni (parse, kalibrasi, skor gerak). Algoritma sama dengan `csi_check.py` + validasi. |
| `csi_bridge.py` | Pembaca serial (atau replay), status koneksi, server HTTP. |
| `make_fixture.py` | Membuat log CSI **sintetis** untuk uji tanpa perangkat. |
| `test_csi.py` | Unit test (tanpa perangkat). |

## Menjalankan

```bash
pip install -r requirements.txt          # hanya pyserial
python csi_bridge.py --list-ports        # cari port ESP32 di komputer INI (jangan asumsikan COM6)
python csi_bridge.py --port auto         # cari ESP32-S3 otomatis (USB VID 303A), ikut bila nomor COM berubah
python csi_bridge.py --port COM6         # atau sebut port-nya langsung (hasil --list-ports)
```

Lalu jalankan frontend (`npm run dev` di folder root), buka **Pengaturan → Sumber data → Sensor langsung**.

- Setelah mulai: **diamkan area pemantauan ±11 detik** (1 dtk mengenali format + 10 dtk baseline).
- Untuk demo di HP (satu jaringan dengan laptop): `python csi_bridge.py --port COM6 --host 0.0.0.0`,
  jalankan frontend dengan `npm run dev -- --host`, lalu buka `http://<IP-laptop>:5173` di HP.
  Frontend otomatis memanggil `http://<host-yang-sama>:8765/api/sensor/latest`
  (bisa ditimpa dengan `VITE_SENSOR_API_URL`). Link frontend publik (GitHub Pages, HTTPS) **tidak bisa**
  mengakses penghubung di laptop.
- Uji tanpa perangkat: `python make_fixture.py fixtures/sintetis.txt` lalu
  `python csi_bridge.py --replay fixtures/sintetis.txt` (tambah `--loop` untuk mengulang).
  UI menandainya **"Rekaman uji"**.

## Kontrak JSON `GET /api/sensor/latest`

| Field | Arti |
|---|---|
| `source` | `live` (serial) atau `replay` (fixture) |
| `connection` | `starting`, `port_not_found`, `port_busy`, `disconnected` (pernah tersambung lalu hilang), `error`, `waiting_data` (port terbuka, belum ada CSI), `streaming`, `stalled` (port terbuka, CSI berhenti > 3 dtk) |
| `calibration` | `waiting` → `format` → `baseline` → `ready`; `failed` bila tidak ada subcarrier aktif (lalu diulang) |
| `calibration_progress` | 0–1 untuk tahap berjalan |
| `generated_at`, `received_at`, `last_motion_at` | Waktu kalender dari laptop penghubung (ISO 8601). `received_at` = paket CSI valid terakhir |
| `motion_detected` | `true`/`false` **hanya** bila `streaming` + `ready` + skor ≤ 3 dtk; selain itu `null` |
| `motion_score`, `motion_threshold`, `baseline_mean` | Skor perubahan sinyal & ambang sesi ini (bukan %, bukan probabilitas) |
| `rssi_dbm`, `packets_in_window`, `window_seconds` | Hanya terisi saat `streaming` |
| `packets_dropped` | Celah nomor `seq` = paket yang terbuang di antrean perangkat |
| `invalid_lines`, `packets_wrong_length` | Baris CSI rusak / paket dengan panjang lain |
| `error` | Pesan teknis dari pyserial bila ada |

Port (dibuka ulang) → kalibrasi diulang. `seq` mundur (perangkat restart) → kalibrasi diulang.

## Pengujian

```bash
python -m unittest -v test_csi
```

Mencakup validasi baris, kalibrasi, deteksi per fase pada fixture, data basi setelah aliran berhenti,
kalibrasi gagal, restart perangkat, status port, dan klasifikasi pesan error pyserial.
Fixture **sintetis** hanya menguji alur perangkat lunak — bukan bukti akurasi deteksi.

## Batasan interpretasi (wajib dijaga di UI & laporan)

- Skor = rata-rata simpangan baku amplitudo ternormalisasi dalam 1 detik. Bukan persentase aktivitas.
- Ambang hasil kalibrasi sesi itu saja; bila ada gerakan saat baseline, ambang jadi terlalu tinggi.
- "Belum ada gerakan" tidak berarti ruangan kosong atau orang sedang tidur.
- Belum ada pengamatan berlabel, jadi akurasi belum terukur. Belum bisa: identitas orang, tidur,
  jumlah terbangun malam, maupun kondisi darurat. UI tidak mengubah label gerak menjadi Darurat.

## Firmware

Project firmware ada di [`firmware/csi_receiver`](../firmware/csi_receiver/README.md) (kredensial di
`wifi_secrets.h` yang tidak di-commit). Catatan yang tersisa:

1. **`first_word_invalid`** dari `wifi_csi_info_t` belum diteruskan. Bila `true`, 4 byte pertama CSI
   tidak valid. Saran: kirim sebagai field tambahan (format baru, mis. `CSI_DATA2`) atau nolkan 4 byte
   tersebut. Subcarrier tepi kemungkinan sudah tersaring kalibrasi subcarrier aktif, belum diverifikasi.
2. **Antrean penuh** membuang paket secara diam-diam, tetapi `seq` tetap naik — penghubung memakai celah
   `seq` ini sebagai `packets_dropped`.
3. `rx_ctrl.timestamp` = mikrodetik sejak perangkat menyala (32-bit, berputar ±71 menit), bukan waktu
   kalender; waktu kalender diberikan oleh penghubung.

## Hasil uji perangkat (6 Okt 2026, satu sesi singkat)

ESP32-S3 (USB Serial/JTAG, COM berubah 23 → 24 setelah dicolok ulang), hotspot HP 2,4 GHz.

| | Firmware awal | Firmware `firmware/csi_receiver` |
|---|---|---|
| Paket per detik | ±31 | ±50 |
| Paket hilang (celah `seq`) | ±38% | 0 dari 1.965 |
| Kalibrasi | baseline 0,225 / batas 0,518 (ada gerakan saat baseline) | baseline 0,039 / batas 0,085 |
| Skor diam / bergerak | – | 0,026–0,058 / 0,092–0,156 (`GERAK!`) |

Temuan:
- Hotspot di **5 GHz** atau mati otomatis → `[log ESP] reason 201`, status `waiting_data`/`stalled`
  (UI tidak menampilkan "diam"/"Normal" — perilaku yang benar).
- Saat bergerak, sebagian skor jatuh tepat di bawah batas (0,082–0,083) sehingga status berkedip
  GERAK/diam. Penghalusan (mis. menahan status gerak 2–3 dtk) belum diterapkan.
- Akurasi belum diukur: belum ada pengamatan berlabel. Uji cabut USB & akses dari HP belum dilakukan.

### Sesi kedua (6 Okt 2026, ±22.10, hotspot HP lain, 2,4 GHz ch 6)

- **UI dengan data asli terverifikasi**: Beranda (mode Sensor langsung, sumber "Perangkat (serial)") berganti
  "Gerakan terdeteksi" ↔ "Belum ada gerakan terdeteksi" mengikuti gerakan; waktu dari penghubung.
- **Nomor COM berubah sendiri** (23 → 24 → 23) mengikuti lubang/jalur USB. Gunakan `--port auto`
  (deteksi ESP32 lewat USB VID 303A, dicari ulang setiap tersambung kembali).
- **Hotspot sempat tidak terlihat** dari laptop maupun ESP32 walau di HP tampak menyala (`reason 201`);
  muncul kembali setelah hotspot dimatikan-nyalakan. Kemungkinan fitur hemat daya hotspot.
- **Laju CSI naik ke ±160–167 pkt/dtk** (sesi pertama ±50): firmware menangkap CSI dari semua frame
  hotspot, bukan hanya balasan ping. Akibatnya ±11% paket hilang dan baris rusak bertambah (235).
  Deteksi tetap berjalan (berbasis jendela waktu 1 dtk). Saran: batasi laju CSI di firmware (mis. ≤ 1 per 20 ms).
- **ESP32 sempat crash lalu restart sendiri** (log terakhir berupa backtrace `0x42088AFE:...`); penyebab
  belum diselidiki, kemungkinan terkait beban tinggi.
- Batas gerak hasil kalibrasi: 0,0815 dan 0,062 (dua kali kalibrasi), dekat dengan sesi pertama (0,085).
