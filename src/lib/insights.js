// Turunan dari data dummy: status saat ini dan perbandingan metrik harian.
import { levelToStatus } from './status.js'

// Selisih dari rata-rata di bawah ambang ini dianggap "sama seperti biasanya".
const SAME_THRESHOLD = 0.1

// Urutan keseriusan tingkat alert (makin besar makin serius)
const SEVERITY = { info: 0, waspada: 1, darurat: 2 }

// Status Dashboard = alert terbuka yang PALING SERIUS, dari gabungan "baru" dan Waspada/Darurat
// yang masih "dicek" (belum ditandai selesai). Jadi Darurat yang sedang dicek tetap mengungguli
// Waspada baru, dan Info baru tidak bisa menutupinya. Kalau setara: yang "baru" dulu (belum
// ditanggapi siapa pun), lalu yang paling baru. `handling` = alert terpilih sudah ditanggapi.
// Tanpa alert terbuka berarti normal.
export function getCurrentStatus(alerts) {
  const open = alerts.filter((a) => a.status === 'baru' || (a.status === 'dicek' && a.tingkat !== 'info'))
  const top = [...open].sort(
    (a, b) =>
      SEVERITY[b.tingkat] - SEVERITY[a.tingkat] ||
      (a.status === 'baru' ? 0 : 1) - (b.status === 'baru' ? 0 : 1) ||
      new Date(b.waktu) - new Date(a.waktu),
  )[0]
  return {
    status: top ? levelToStatus[top.tingkat] : 'normal',
    alert: top ?? null,
    handling: top?.status === 'dicek',
  }
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
