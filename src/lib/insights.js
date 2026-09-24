// Turunan dari data dummy: status saat ini dan perbandingan metrik harian.
import { levelToStatus } from './status.js'

// Selisih dari rata-rata di bawah ambang ini dianggap "sama seperti biasanya".
const SAME_THRESHOLD = 0.1

// Alert "baru" paling baru menentukan status; tanpa alert baru berarti normal.
export function getCurrentStatus(alerts) {
  const latestNew = alerts
    .filter((a) => a.status === 'baru')
    .sort((a, b) => new Date(b.waktu) - new Date(a.waktu))[0]
  return {
    status: latestNew ? levelToStatus[latestNew.tingkat] : 'normal',
    alert: latestNew ?? null,
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

export function average(metrics, key) {
  return metrics.reduce((sum, m) => sum + m[key], 0) / metrics.length
}

// 'higher' | 'same' | 'lower' dibanding rata-rata
export function compareToAverage(value, avg) {
  const diff = (value - avg) / avg
  if (Math.abs(diff) < SAME_THRESHOLD) return 'same'
  return diff > 0 ? 'higher' : 'lower'
}
