# NADI — Prototipe Interaktif FP HMI

NADI adalah konsep **AI wellness agent untuk lansia** yang membaca pola keseharian dari sinyal WiFi di rumah dan mengabari keluarga. Project ini adalah **prototipe interaktif untuk Final Project mata kuliah HMI (Interaksi Manusia dan Komputer)**. Titik tekannya **UI/UX**: alur, tata letak, keterbacaan, dan aksesibilitas untuk keluarga dan lansia. Bukan produk, bukan untuk lomba. **Mode demo** memakai data dummy. **Mode sensor langsung** (opsional) membaca ESP32-S3 lewat penghubung Python lokal di `sensor/` — lihat bagian "Mode sensor langsung".

- Kontrol berlabel "Fitur demo" (simulasi anomali, reset data, kembali ke app keluarga) adalah kontrol fasilitator saat prototipe dicoba/diuji, bukan bagian dari produk.

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
- Status di Dashboard = alert berstatus "baru" yang **paling serius** (darurat > waspada > info); kalau setara, yang paling baru. Lihat `getCurrentStatus` di `src/lib/insights.js`.
- Jangan pakai warna status untuk dekorasi lain, supaya maknanya tidak kabur.
- **Kontras:** teks putih hanya di atas warna yang lolos ≥4,5:1: `*-strong` (lewat `STATUS_STYLES[x].solid`), `brand-600/700`, `accent-700`, `ink`. Warna status `DEFAULT` dan `accent-500` hanya untuk grafik/ikon/dekorasi, bukan latar teks.

## Aturan data & teks

- **Semua data** diambil dari `src/data/dummy.js`. Tidak ada data (nama, angka, tanggal, isi alert) yang di-hardcode di komponen.
- **Semua teks UI** (label, judul, pesan, tombol, empty state) ada di `src/data/copy.js`. Komponen tidak boleh menulis string UI langsung. Tujuannya: nanti tinggal menambah versi Bahasa Inggris dengan struktur key yang sama.
- Kalau butuh teks/data baru, tambahkan dulu ke file tersebut, baru dipakai di komponen.
- Teks yang berisi angka/variabel ditulis sebagai fungsi di `copy.js` (mis. `copy.dashboard.lastActivity(98)`), jangan dirangkai di komponen.
- **Jangan pakai jam asli** (`new Date()` tanpa argumen). Waktu "sekarang" di demo = `demoNow` dari `dummy.js`, supaya cerita demo selalu sama.
- **State yang bisa berubah** dibaca/diubah lewat `useAlerts()` dari `src/state/AlertsContext.jsx`, bukan langsung dari dummy.js (data dummy hanya nilai awal): status alert & alert baru (`respond`, `addAlert`), urutan kontak (`contacts`, `moveContact`), jeda pemantauan (`monitoringPaused`), dan `resetDemo` untuk mengembalikan semuanya ke awal. State baru yang dibagi antar-screen ditambahkan di sini juga, dan ikut di-reset di `resetDemo`.
- "Pola biasanya" untuk satu hari = rata-rata hari **lain** (tanpa hari itu), lewat `compareDayToUsual`. Aturan "berbeda jauh dari biasanya" per metrik ada di `deviation` di `src/lib/metrics.js`.
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
  - Teks minimum 24px: pakai `text-elder-body`, `text-elder-btn`, `text-elder-title`. Pertanyaan adalah elemen paling dominan; hitung mundur tetap terlihat tapi sekunder. Latar putih (`bg-surface`) + teks `text-ink` untuk kontras tinggi.
  - Maksimal 1 kalimat pertanyaan, hanya 2 tombol besar (`min-h-tap-elder`, 88px), tanpa navigasi/menu.
  - Kontrol demo (mis. "Kembali ke app keluarga") selalu diberi label "Fitur demo" dan dipisah garis putus-putus.
- Grafik: hari yang berbeda jauh dari biasanya diberi warna Waspada **dan** penanda "!" + legenda, jangan hanya warna.
- Interaksi di grafik (mis. memilih hari) wajib punya padanan yang bisa dipakai keyboard & pembaca layar. Di Riwayat: deretan tombol hari di bawah grafik (`aria-pressed`, `aria-controls` ke kartu detail, label berisi nilai), SVG grafiknya `aria-hidden`. Pilihan metrik memakai pola tab WAI-ARIA (panah, Home/End, `tabpanel`).
- **Fokus & gerak:** indikator `:focus-visible` global ada di `src/index.css`, jangan dihilangkan. Animasi berulang pakai `motion-safe:`; `prefers-reduced-motion` dihormati secara global.
- Toggle/kontrol kecil tetap punya area tekan minimal 48px (`min-h-tap`), walau bentuk visualnya lebih kecil.
- Grafik pakai **Recharts**. Untuk warna di Recharts, ambil hex dari `STATUS_STYLES[x].hex` atau import dari `tailwind.config.js`.

## Prinsip UX (materi HMI: UX laws & teori)

Setiap perubahan UI dicek terhadap prinsip ini. Contoh penerapannya di NADI ada di kurung.

- **Jakob** – pakai pola yang sudah familiar (bottom nav, tombol Kembali kiri atas, daftar → detail, badge jumlah di Notifikasi).
- **Fitts** – aksi utama besar & mudah dijangkau; target ≥48px, tombol lansia 88px di bawah layar.
- **Hick** – satu langkah berikutnya yang direkomendasikan (tombol "Lihat & tindak lanjuti" di kartu Waspada/Darurat; layar lansia hanya 2 pilihan).
- **Miller** – kelompokkan informasi (3 kartu metrik; Notifikasi dikelompokkan "Perlu ditanggapi / Hari ini / Kemarin / Sebelumnya").
- **Norman** – affordance & signifier jelas (chevron, petunjuk ketuk), **feedback** setiap aksi ("Respons tercatat", pesan reset, pengumuman urutan kontak), **mapping** kontrol ↔ hasil (▲▼ = urutan).
- **Nielsen** – visibilitas status (badge, kartu status, "Diperbarui … · dari sinyal WiFi"), bahasa sehari-hari, **error prevention** (112 dikonfirmasi dulu), recognition over recall (definisi metrik di Riwayat), penjelasan langkah aman berikutnya.
- **Krug** – jawaban terpenting di bagian atas kartu; satu nama untuk satu hal (mis. selalu "Waktu aktif", bukan "Rasio aktif").
- **Gestalt** – proximity (label, nilai, satuan, waktu berdekatan), similarity (warna status konsisten), common region (kartu & kelompok).
- **"So what?"** – setiap angka disertai konteks: dibanding pola biasanya, definisinya, dan kalau perlu tindakan berikutnya.

## Mode sensor langsung (ESP32-S3 + `sensor/csi_bridge.py`)

- Sumber data dipilih di Pengaturan (`useSensor()` dari `src/state/SensorContext.jsx`): `demo` atau `live`. **Data sensor tidak pernah dicampur dengan cerita demo**: di mode langsung Beranda hanya menampilkan kartu sensor; Riwayat & Notifikasi menampilkan pemberitahuan `LiveModeNotice`; badge & simulasi demo disembunyikan.
- Frontend hanya membaca JSON `GET /api/sensor/latest` (kontrak di `sensor/README.md`), terjemahkan lewat `describeSensor()` di `src/lib/sensor.js`. Jangan mengurai output terminal.
- Waktu di mode langsung berasal dari sumber data (`received_at`, `last_motion_at`), bukan `demoNow` dan bukan jam browser.
- Data tidak tersedia/basi (`stalled`, port bermasalah, API tak terjangkau) **tidak boleh** tampil sebagai "diam" atau "Normal".
- Label gerak **bukan** status kesejahteraan: jangan ubah menjadi Waspada/Darurat dan jangan pakai warna status. Skor bukan persentase/probabilitas.
- Tidur, waktu aktif harian, dan terbangun malam belum bisa dihitung dari sensor ini — tampilkan sebagai "belum tersedia", jangan diisi.
- Kredensial WiFi firmware hanya di `firmware/csi_receiver/main/wifi_secrets.h` (di-.gitignore); tidak boleh masuk repository atau frontend.
- Python: `csi_processing.py` tetap murni (tanpa serial/jaringan/jam) supaya bisa diuji; jalankan `python -m unittest test_csi` di `sensor/`.

## Stack & perintah

- React + Vite, Tailwind CSS v3, Recharts.
- `npm run dev` — jalankan dev server
- `npm run build` — build produksi
- `python sensor/csi_bridge.py --port COMx` — penghubung sensor (`--replay <file>` untuk uji tanpa perangkat)

## Struktur folder

```
src/
  main.jsx            entry React
  App.jsx             root: state tab aktif, tampilan keluarga/lansia, BottomNav
  index.css           Tailwind + style dasar body
  components/         komponen UI yang dipakai ulang (PhoneFrame, Icon, StatusCard, MetricCard, BottomNav, ...)
  screens/            satu file per layar (Dashboard, Notifications, AlertDetail, History, Settings, ElderCheck)
  lib/                helper non-UI: status.js, insights.js, format.js, metrics.js, sensor.js, useDialogFocus.js
  state/              React Context bersama (AlertsContext: alert, respons, kontak, jeda, reset demo; SensorContext: sumber data & polling sensor)
  data/
    dummy.js          SATU-SATUNYA sumber data dummy
    copy.js           SEMUA teks UI
public/               aset statis (favicon, foto placeholder)
sensor/               penghubung Python ESP32-S3 → API lokal (pengolahan, bridge, fixture, unit test)
firmware/csi_receiver project ESP-IDF v6.1 untuk ESP32-S3 (kredensial di main/wifi_secrets.h, tidak di-commit)
```
