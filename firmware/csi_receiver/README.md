# Firmware CSI receiver (ESP32-S3)

Mengambil CSI dari paket balasan ping ke gateway hotspot HP, lalu mencetaknya lewat USB:

```
CSI_DATA,seq,rssi,timestamp,len,v0 v1 v2 ...
```

Dibaca oleh `sensor/csi_bridge.py`. Diuji dengan ESP-IDF **v6.1** pada ESP32-S3 (USB Serial/JTAG bawaan).

## Build & flash

1. Salin `main/wifi_secrets.example.h` menjadi `main/wifi_secrets.h`, lalu isi nama & password hotspot.
   File ini ada di `.gitignore` — **jangan di-commit**.
2. Hotspot HP **wajib band 2,4 GHz** dan sebaiknya matikan "hotspot mati otomatis".
3. Dari terminal ESP-IDF:

```powershell
idf.py set-target esp32s3     # sekali saja
idf.py -p COMx flash          # cek nomor port: python sensor/csi_bridge.py --list-ports
```

## Perbedaan dengan `csi_receiver.c` versi percobaan awal

| Perubahan | Alasan |
|---|---|
| Kredensial dipindah ke `wifi_secrets.h` | Supaya SSID/password tidak tertulis di kode yang dibagikan |
| `CONFIG_ESP_CONSOLE_USB_SERIAL_JTAG=y`, konsol sekunder dimatikan (`sdkconfig.defaults`) | Sebelumnya output juga dicetak ke UART0 115200 baud yang terlalu lambat → antrean penuh → **±38% paket hilang** (~31 dari 50 pkt/dtk). Setelah diubah: **0 paket hilang, ±50 pkt/dtk** (uji 6 Okt 2026) |
| `esp_wifi_set_country_code("ID", true)` | Memindai channel 1–13; hotspot di channel 12/13 tidak lagi gagal ditemukan |
| `CONFIG_ESP_WIFI_CSI_ENABLED=y` | Wajib agar `esp_wifi_set_csi()` berfungsi |

Logika CSI (filter BSSID hotspot, antrean, LLTF saja, ping 20 ms) tidak diubah.

## Pemecahan masalah

| Gejala (terminal `csi_bridge.py`) | Penyebab umum |
|---|---|
| `[log ESP] ... reason 201` | Hotspot tidak ditemukan: mati, band **5 GHz**, atau nama tidak persis sama |
| `reason 15` / `202` | Password salah |
| `port tidak ditemukan` | Nomor COM berubah setelah USB dicabut/pindah lubang — cek `--list-ports` |
| Build gagal acak (`ranlib: No such file`, `CMAKE_C_COMPILER not set`) di Windows | Biasanya antivirus memindai file baru; jalankan ulang perintah yang sama |
