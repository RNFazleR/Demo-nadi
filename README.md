# NADI — Prototipe Interaktif FP HMI

Prototipe interaktif NADI, konsep AI wellness agent untuk lansia, untuk Final Project mata kuliah HMI. Fokus pada UI/UX. Semua data dummy, tidak terhubung ke backend atau sensor.

## Cara menjalankan

Butuh [Node.js](https://nodejs.org) (versi 20 ke atas).

```bash
npm install
npm run dev
```

Buka alamat yang muncul di terminal (biasanya http://localhost:5173).

## Mode sensor langsung (opsional, ESP32-S3)

Di Pengaturan → Sumber data → **Sensor langsung**, Beranda membaca hasil gerak dari penghubung Python
di laptop. Cara menjalankan, kontrak API, dan batasannya ada di [sensor/README.md](sensor/README.md).

## Sebelum mengubah kode

Baca **AGENTS.md** dulu — isinya aturan project (copy non-medis, warna status, semua data di `src/data/dummy.js`, semua teks di `src/data/copy.js`).
