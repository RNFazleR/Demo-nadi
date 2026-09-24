// Definisi metrik harian: key copy -> field DailyMetric + ikon + cara menampilkan angka.
import { formatNumber } from './format.js'

export const METRICS = [
  { key: 'sleep', field: 'durasi_tidur_jam', icon: 'moon', display: (v) => formatNumber(v) },
  { key: 'activity', field: 'rasio_aktif', icon: 'walk', display: (v) => formatNumber(v * 100, 0) },
  { key: 'wakeUps', field: 'jumlah_bangun_malam', icon: 'wake', display: (v) => formatNumber(v) },
]
