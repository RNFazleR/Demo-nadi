// Definisi metrik harian: key copy -> field DailyMetric + ikon + cara menampilkan angka.
import { formatNumber } from './format.js'

// `chartValue`: nilai yang diplot di grafik (rasio aktif ditampilkan dalam persen).
// `deviation`: kapan satu hari dianggap "berbeda jauh dari biasanya". Hanya arah yang
// patut diperhatikan yang dihitung (tidur lebih singkat, aktif lebih sedikit, bangun lebih
// sering), karena jumlah bangun malam kecil sehingga selisih persen mudah terlihat besar.
export const METRICS = [
  {
    key: 'sleep',
    field: 'durasi_tidur_jam',
    icon: 'moon',
    display: (v) => formatNumber(v),
    chartValue: (v) => v,
    deviation: { direction: 'lower', threshold: 0.2 },
  },
  {
    key: 'activity',
    field: 'rasio_aktif',
    icon: 'walk',
    display: (v) => formatNumber(v * 100, 0),
    chartValue: (v) => v * 100,
    deviation: { direction: 'lower', threshold: 0.25 },
  },
  {
    key: 'wakeUps',
    field: 'jumlah_bangun_malam',
    icon: 'wake',
    display: (v) => formatNumber(v),
    chartValue: (v) => v,
    deviation: { direction: 'higher', threshold: 0.5 },
  },
]
