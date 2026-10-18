// Turunan dari data dummy: status saat ini dan perbandingan metrik harian.
import { levelToStatus } from './status.js'

// Selisih dari rata-rata di bawah ambang ini dianggap "sama seperti biasanya".
const SAME_THRESHOLD = 0.1

// Urutan keseriusan tingkat alert (makin besar makin serius)
const SEVERITY = { info: 0, waspada: 1, darurat: 2 }

// Alert paling serius; kalau setara, yang paling baru
const mostSerious = (list) =>
  [...list].sort((a, b) => SEVERITY[b.tingkat] - SEVERITY[a.tingkat] || new Date(b.waktu) - new Date(a.waktu))[0]

// Status ditentukan alert "baru" yang PALING SERIUS, supaya Darurat yang belum ditanggapi
// tidak tertutup Waspada yang datang belakangan. Tanpa alert baru, Waspada/Darurat yang masih
// "dicek" (belum ditandai selesai) tetap ditampilkan (`handling`), supaya Dashboard tidak
// tampil "Normal" selagi keluarga masih memastikan keadaan beliau. Selain itu normal.
export function getCurrentStatus(alerts) {
  const fresh = mostSerious(alerts.filter((a) => a.status === 'baru'))
  if (fresh) return { status: levelToStatus[fresh.tingkat], alert: fresh, handling: false }
  const open = mostSerious(alerts.filter((a) => a.status === 'dicek' && a.tingkat !== 'info'))
  if (open) return { status: levelToStatus[open.tingkat], alert: open, handling: true }
  return { status: 'normal', alert: null, handling: false }
}

export function sortNewestFirst(alerts) {
  return [...alerts].sort((a, b) => new Date(b.waktu) - new Date(a.waktu))
}

// Nilai hari tertentu vs "pola biasanya" = rata-rata hari lain dalam data.
export function compareDayToUsual(metrics, dateKey, field) {
  const day = metrics.find((m) => m.tanggal === dateKey)
  if (!day) return null
  const usual = average(metrics.filter((m) => m !== day), field)
  return { value: day[field], usual, trend: compareToAverage(day[field], usual) }
}

// Apakah hasil compareDayToUsual menyimpang jauh sesuai aturan `deviation` metrik.
export function isDeviation({ value, usual }, { direction, threshold }) {
  const change = (value - usual) / usual
  return direction === 'lower' ? change <= -threshold : change >= threshold
}

export function average(metrics, key) {
  return metrics.reduce((sum, m) => sum + m[key], 0) / metrics.length
}

// 'higher' | 'same' | 'lower' dibanding rata-rata
function compareToAverage(value, avg) {
  const diff = (value - avg) / avg
  if (Math.abs(diff) < SAME_THRESHOLD) return 'same'
  return diff > 0 ? 'higher' : 'lower'
}
