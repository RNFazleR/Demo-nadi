# Firmware NADI (ESP32-S3) — Fase 1

Alat dipasang ke **HP Pusat lewat BLE**, lalu mengirim CSI mentah langsung ke HP Pusat lewat
**UDP** di hotspot HP itu. Laptop hanya sumber daya + terminal (baris `CSI_DATA` tetap dicetak ke USB
untuk `sensor/csi_bridge.py`). Diuji dengan ESP-IDF **v6.1**. Latar belakang: [docs/uji-fase0.md](../../docs/uji-fase0.md).

## Alur

1. Boot → BLE beriklan sebagai `NADI-XXXX` (4 digit akhir MAC).
2. App mengirim `nama\tsandi` hotspot ke karakteristik **wifi** → disimpan di NVS → alat menyambung.
3. Tersambung → ping gateway (= HP Pusat) tiap 20 ms → CSI tiap balasan → UDP ke `gateway:5005`.
4. **5 dtk setelah tersambung BLE dimatikan** (BLE aktif memaksa power save WiFi: CSI ±22/dtk → ±43–50/dtk).
5. Hotspot hilang > 30 dtk → BLE menyala lagi untuk dipasang ulang. Restart → tersambung lagi dari NVS.

## BLE (layanan `4e414449-0000-4000-8000-00000000a000`)

| Karakteristik | UUID akhiran | Isi |
|---|---|---|
| status | `…a001` baca + notify | `menunggu`, `menyambung`, `tersambung ip=… gw=…`, `gagal:<reason>` (201 = hotspot tak ketemu/5 GHz, 15/202 = sandi salah) |
| wifi | `…a002` tulis | `nama\tsandi` hotspot |
| cmd | `…a003` tulis | `PAUSE`, `RESUME`, `RECAL`, `FORGET` |

## Perintah lewat USB (satu baris, diakhiri Enter)

`PAUSE` / `RESUME` (jeda/lanjut; saat jeda dikirim paket UDP kosong ber-flag tiap 1 dtk),
`RECAL` (nomor sesi kalibrasi di header naik → pengolah kalibrasi ulang), `FORGET` (lupakan hotspot, BLE menyala).

## Paket UDP

Header 24 byte little-endian: `"NADI"` · versi `1` · flag (bit0 = jeda) · MAC (6) · seq u32 · rssi i8 ·
sesi kalibrasi u8 · timestamp u32 · len u16, lalu `int8[len]` (pasangan [imag, real]). Dekoder: `src/lib/csiPacket.js`.
Laju dibatasi rata-rata ≤ 50/dtk (token bucket, toleran jitter). 4 byte awal dinolkan bila `first_word_invalid`.

## Build & flash

```powershell
idf.py set-target esp32s3     # sekali saja
idf.py -p COMx flash          # cek nomor port: python sensor/csi_bridge.py --list-ports
```

`main/wifi_secrets.h` **opsional** (cadangan pengembangan, di `.gitignore`): bila ada dan NVS kosong,
alat memakai kredensial itu. Hotspot HP **wajib 2,4 GHz**.

## Pemecahan masalah

| Gejala | Penyebab umum |
|---|---|
| Status BLE `gagal:201` / log `reason 201` | Hotspot mati, band **5 GHz**, atau nama tidak persis sama |
| `gagal:15` / `gagal:202` | Sandi salah |
| `NADI-XXXX` tidak muncul di HP | Alat sudah tersambung (BLE sengaja mati) → kirim `FORGET` lewat USB atau matikan hotspot > 30 dtk |
| `port tidak ditemukan` | Nomor COM berubah setelah USB dicabut/pindah lubang — cek `--list-ports` |
| Build gagal acak di Windows | Biasanya antivirus memindai file baru; jalankan ulang perintah yang sama |
