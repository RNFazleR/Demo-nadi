# NADI — Prototipe UI Demo

NADI adalah **AI wellness agent untuk lansia**, dijual operator telekomunikasi sebagai add-on layanan broadband. Project ini adalah **demo visual untuk pitch lomba**: data dummy, **tidak** terhubung ke backend atau sensor asli.

## Positioning (wajib dipegang)

- NADI adalah **wellness monitoring**, **BUKAN alat medis**.
- NADI mengamati *pola keseharian* (tidur, aktivitas, terbangun malam) dan memberi tahu keluarga kalau ada yang berubah dari biasanya. NADI tidak mendiagnosis apa pun.

## Aturan copy

- Bahasa UI: **Bahasa Indonesia**, nada ramah, hangat, tidak kaku (seperti anggota keluarga yang peduli, bukan petugas rumah sakit).
- **Dilarang** memakai istilah medis/diagnostik, misalnya: "detak jantung abnormal", "gejala", "diagnosis", "penyakit", "kondisi kritis", "pasien", "terapi", "jatuh" sebagai klaim deteksi.
- **Pakai** bahasa netral: "pola berubah dari biasanya", "perlu dicek", "lebih sedikit dari biasanya", "coba hubungi", "ada baiknya ditanyakan kabarnya".
- Sebut lansia dengan panggilan hormat (mis. "Ibu", "Bapak"), bukan "pengguna" atau "pasien".

## Tiga tingkat status

| Status  | Arti                                   | Token Tailwind                          |
|---------|----------------------------------------|-----------------------------------------|
| Normal  | Semua seperti biasanya                  | `normal`, `normal-bg`, `normal-border`, `normal-ink`   |
| Waspada | Ada pola berubah, perlu dicek           | `waspada`, `waspada-bg`, `waspada-border`, `waspada-ink` |
| Darurat | Butuh perhatian sekarang                | `darurat`, `darurat-bg`, `darurat-border`, `darurat-ink` |

- Warna status **hanya** diambil lewat `src/lib/status.js` (`STATUS_STYLES`), jangan menulis kelas warna status sendiri-sendiri di komponen.
- `AlertEvent.tingkat = 'info'` ditampilkan dengan warna Normal (lihat `levelToStatus`).
- Jangan pakai warna status untuk dekorasi lain, supaya maknanya tidak kabur.

## Aturan data & teks

- **Semua data** diambil dari `src/data/dummy.js`. Tidak ada data (nama, angka, tanggal, isi alert) yang di-hardcode di komponen.
- **Semua teks UI** (label, judul, pesan, tombol, empty state) ada di `src/data/copy.js`. Komponen tidak boleh menulis string UI langsung. Tujuannya: nanti tinggal menambah versi Bahasa Inggris dengan struktur key yang sama.
- Kalau butuh teks/data baru, tambahkan dulu ke file tersebut, baru dipakai di komponen.
- Teks yang berisi angka/variabel ditulis sebagai fungsi di `copy.js` (mis. `copy.dashboard.lastActivity(98)`), jangan dirangkai di komponen.
- **Jangan pakai jam asli** (`new Date()` tanpa argumen). Waktu "sekarang" di demo = `demoNow` dari `dummy.js`, supaya cerita demo selalu sama.
- **Status alert yang bisa berubah** (baru → dicek, atau alert baru dari simulasi) dibaca/diubah lewat `useAlerts()` (`respond`, `addAlert`) dari `src/state/AlertsContext.jsx`, bukan langsung dari `alertEvents` di dummy.js. Data dummy hanya nilai awal.
- Logika turunan dari data (status saat ini, rata-rata, perbandingan) ada di `src/lib/insights.js`; format angka/tanggal Indonesia di `src/lib/format.js`.

## Desain

- Mobile-first, lebar acuan **390px**. Di laptop konten tetap di tengah dengan lebar maks `max-w-phone` (430px) di dalam `PhoneFrame`.
- Nuansa hangat & menenangkan (krem, sage, peach), bukan kesan rumah sakit yang dingin.
- Pakai **design token** dari `tailwind.config.js`; jangan pakai hex/px lepas di komponen.
  - Teks: `text-body` (16px, minimum untuk teks isi), `text-body-lg`, `text-title`, `text-heading`, `text-display`. `text-caption` (14px) hanya untuk label sumbu grafik / keterangan non-esensial.
  - Warna teks: `text-ink`, `text-ink-soft`; `text-ink-faint` hanya untuk teks ≥18px atau ikon.
  - Radius: `rounded-chip`, `rounded-btn`, `rounded-card`, `rounded-sheet`. Bayangan: `shadow-card`, `shadow-raised`.
  - Target sentuh minimal `min-h-tap` (48px). Padding samping layar `px-gutter`.
- **Layar lansia** (`ElderCheck`, tampilan di HP lansia) punya aturan sendiri, berbeda dari app keluarga:
  - Teks minimum 24px: pakai `text-elder-body`, `text-elder-btn`, `text-elder-title`, `text-elder-count`. Latar putih (`bg-surface`) + teks `text-ink` untuk kontras tinggi.
  - Maksimal 1 kalimat pertanyaan, hanya 2 tombol besar (`min-h-tap-elder`, 88px), tanpa navigasi/menu.
  - Kontrol demo (mis. "Kembali ke app keluarga") selalu diberi label "Fitur demo" dan dipisah garis putus-putus.
- Grafik pakai **Recharts**. Untuk warna di Recharts, ambil hex dari `STATUS_STYLES[x].hex` atau import dari `tailwind.config.js`.

## Stack & perintah

- React + Vite, Tailwind CSS v3, Recharts.
- `npm run dev` — jalankan dev server
- `npm run build` — build produksi

## Struktur folder

```
src/
  main.jsx            entry React
  App.jsx             root: state tab aktif, tampilan keluarga/lansia, BottomNav
  index.css           Tailwind + style dasar body
  components/         komponen UI yang dipakai ulang (PhoneFrame, Icon, StatusCard, MetricCard, BottomNav, ...)
  screens/            satu file per layar (Dashboard, Notifications, AlertDetail, ElderCheck, PlaceholderScreen)
  lib/                helper non-UI: status.js, insights.js, format.js, metrics.js
  state/              React Context bersama (AlertsContext: status alert + respons keluarga)
  data/
    dummy.js          SATU-SATUNYA sumber data dummy
    copy.js           SEMUA teks UI
public/               aset statis (favicon, foto placeholder)
```
