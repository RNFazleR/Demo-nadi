// Satu-satunya sumber data dummy NADI. Komponen TIDAK boleh menulis data sendiri.
// Tanggal sengaja statis supaya demo selalu menampilkan cerita yang sama.
// Cerita: pola Ibu Sri stabil, lalu 22 Sep tidurnya pendek, sering terbangun,
// dan siangnya kurang aktif (-> waspada). 23 Sep mulai pulih. Pagi 24 Sep ada
// periode tanpa aktivitas yang cukup panjang (-> darurat, sudah dicek keluarga,
// jadi tidak ada alert baru dan Dashboard tampil Normal).

/**
 * @typedef {Object} ElderProfile
 * @property {string} nama
 * @property {string} foto                  path gambar (placeholder)
 * @property {string} mulai_dipantau_sejak  ISO date
 */

/**
 * @typedef {Object} DailyMetric
 * @property {string} tanggal              ISO date
 * @property {number} durasi_tidur_jam     jam tidur malam sebelumnya
 * @property {number} rasio_aktif          0–1, porsi jam bangun yang terdeteksi aktif bergerak
 * @property {number} jumlah_bangun_malam  berapa kali terbangun antara 22.00–05.00
 */

/**
 * @typedef {'info' | 'waspada' | 'darurat'} TingkatAlert
 * @typedef {'baru' | 'dicek' | 'selesai'} StatusAlert
 *
 * @typedef {Object} AlertEvent
 * @property {string} id
 * @property {string} waktu       ISO datetime (WIB)
 * @property {TingkatAlert} tingkat
 * @property {string} deskripsi
 * @property {StatusAlert} status
 */

// Jam "sekarang" versi demo. Semua perhitungan relatif (menit lalu, hari ini) pakai ini,
// bukan jam asli, supaya cerita demo tidak berubah kapan pun dibuka.
export const demoNow = '2026-09-24T09:20:00+07:00'

// Waktu gerakan terakhir yang terdeteksi sensor (sebelum alert darurat 09.12).
export const aktivitasTerakhir = '2026-09-24T07:42:00+07:00'

/** @type {ElderProfile} */
export const elderProfile = {
  nama: 'Ibu Sri Wahyuni',
  panggilan: 'Bu Sri', // sapaan di layar HP lansia
  foto: '/avatar-placeholder.svg',
  mulai_dipantau_sejak: '2026-03-02',
  telepon: '0812-3456-7890', // fiktif, hanya untuk modal simulasi panggilan
}

// Kontak layanan darurat yang ditampilkan di modal simulasi (tidak benar-benar menelepon).
export const kontakDarurat = {
  nama: 'Layanan Darurat',
  nomor: '112',
}

// Kontak keluarga, urutan awal = urutan prioritas saat Darurat. Nomor fiktif.
export const kontakKeluarga = [
  { id: 'kontak-1', nama: 'Rina Wahyuni', hubungan: 'Anak', nomor: '0813-2468-1357' },
  { id: 'kontak-2', nama: 'Budi Santoso', hubungan: 'Menantu', nomor: '0857-1122-3344' },
  { id: 'kontak-3', nama: 'Bu Darmi', hubungan: 'Tetangga', nomor: '0821-9988-7766' },
]

/** @type {DailyMetric[]} urut dari terlama ke terbaru */
export const dailyMetrics = [
  { tanggal: '2026-09-18', durasi_tidur_jam: 7.2, rasio_aktif: 0.52, jumlah_bangun_malam: 1 },
  { tanggal: '2026-09-19', durasi_tidur_jam: 6.9, rasio_aktif: 0.49, jumlah_bangun_malam: 2 },
  { tanggal: '2026-09-20', durasi_tidur_jam: 7.4, rasio_aktif: 0.55, jumlah_bangun_malam: 1 },
  { tanggal: '2026-09-21', durasi_tidur_jam: 7.0, rasio_aktif: 0.5, jumlah_bangun_malam: 1 },
  // Hari menyimpang: tidur jauh lebih pendek, sering terbangun, siang kurang aktif
  { tanggal: '2026-09-22', durasi_tidur_jam: 4.3, rasio_aktif: 0.21, jumlah_bangun_malam: 5 },
  { tanggal: '2026-09-23', durasi_tidur_jam: 6.4, rasio_aktif: 0.41, jumlah_bangun_malam: 2 },
  { tanggal: '2026-09-24', durasi_tidur_jam: 7.1, rasio_aktif: 0.47, jumlah_bangun_malam: 1 },
]

/** @type {AlertEvent[]} urut dari terbaru ke terlama */
export const alertEvents = [
  {
    id: 'alrt-005',
    waktu: '2026-09-24T09:12:00+07:00',
    tingkat: 'darurat',
    deskripsi:
      'Belum ada gerakan terdeteksi selama 90 menit, padahal biasanya Ibu sedang beraktivitas di jam ini. Coba hubungi Ibu sekarang.',
    status: 'dicek',
  },
  {
    id: 'alrt-004',
    waktu: '2026-09-24T06:05:00+07:00',
    tingkat: 'info',
    deskripsi: 'Ibu sudah bangun dan mulai beraktivitas pagi seperti biasanya.',
    status: 'selesai',
  },
  {
    id: 'alrt-003',
    waktu: '2026-09-23T07:30:00+07:00',
    tingkat: 'info',
    deskripsi: 'Pola tidur semalam mulai kembali mendekati biasanya.',
    status: 'selesai',
  },
  {
    id: 'alrt-002',
    waktu: '2026-09-22T15:00:00+07:00',
    tingkat: 'waspada',
    deskripsi:
      'Aktivitas Ibu hari ini jauh lebih sedikit dari biasanya. Mungkin sedang kurang bertenaga, ada baiknya ditanyakan kabarnya.',
    status: 'dicek',
  },
  {
    id: 'alrt-001',
    waktu: '2026-09-22T05:20:00+07:00',
    tingkat: 'waspada',
    deskripsi:
      'Tidur Ibu semalam lebih pendek dan terbangun 5 kali, lebih sering dari biasanya. Perlu dicek.',
    status: 'selesai',
  },
]
