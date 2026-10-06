// Format angka & waktu untuk locale Indonesia.

const LOCALE = 'id-ID'
const TIME_ZONE = 'Asia/Jakarta'

export function formatNumber(value, maxFractionDigits = 1) {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: maxFractionDigits }).format(value)
}

// "2 Maret 2026"
export function formatDateLong(iso) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).format(new Date(iso))
}

// "09.12"
export function formatTime(iso) {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  }).format(new Date(iso))
}

// "22 Sep"
export function formatDateShort(iso) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
    timeZone: TIME_ZONE,
  }).format(new Date(iso))
}

// "Sel" (nama hari singkat) untuk label sumbu grafik
export function formatWeekdayShort(iso) {
  return new Intl.DateTimeFormat(LOCALE, { weekday: 'short', timeZone: TIME_ZONE }).format(new Date(iso))
}

// "Selasa, 22 September"
export function formatDayDate(iso) {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TIME_ZONE,
  }).format(new Date(iso))
}

// "2026-09-24" menurut WIB, untuk mencocokkan dengan DailyMetric.tanggal
export function toDateKey(iso) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date(iso))
}

// Selisih hari kalender (WIB): 0 = hari yang sama dengan `nowIso`, 1 = kemarin, dst.
export function daysAgo(iso, nowIso) {
  return Math.round((new Date(toDateKey(nowIso)) - new Date(toDateKey(iso))) / 86400000)
}

// "Hari ini, 09.12" / "Kemarin, 07.30" / "22 Sep, 15.00" relatif terhadap `nowIso`
export function formatRelativeDayTime(iso, nowIso, labels) {
  const dayDiff = daysAgo(iso, nowIso)
  const day = dayDiff === 0 ? labels.today : dayDiff === 1 ? labels.yesterday : formatDateShort(iso)
  return labels.dayAndTime(day, formatTime(iso))
}

export function minutesBetween(fromIso, toIso) {
  return Math.round((new Date(toIso) - new Date(fromIso)) / 60000)
}
