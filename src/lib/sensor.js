// Mode "Sensor langsung": alamat API penghubung (sensor/csi_bridge.py) dan penerjemahan
// JSON-nya menjadi satu keadaan tampilan. Data sensor TIDAK pernah dicampur dengan data demo.

// Alamat penghubung. Di browser defaultnya laptop yang sama dengan halaman ini, port 8765
// (HP di WiFi yang sama: buka frontend lewat IP laptop dan jalankan penghubung dengan
// --host 0.0.0.0). Di APK (Capacitor) halaman ada di HP sendiri, jadi alamat harus diisi
// pengguna di Pengaturan. VITE_SENSOR_API_URL menimpa default.
const isNativeApp = typeof window !== 'undefined' && Boolean(window.Capacitor?.isNativePlatform?.())

export const DEFAULT_SENSOR_HOST = isNativeApp || typeof window === 'undefined' ? '' : window.location.hostname

// "192.168.1.5", "192.168.1.5:8765", atau "http://192.168.1.5/..." -> URL API lengkap; kosong -> null
export function sensorApiUrl(host) {
  const h = (host ?? '').trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
  if (!h) return null
  return `http://${/:\d+$/.test(h) ? h : `${h}:8765`}/api/sensor/latest`
}

export const DEFAULT_SENSOR_API_URL = import.meta.env.VITE_SENSOR_API_URL || sensorApiUrl(DEFAULT_SENSOR_HOST)

export const SENSOR_POLL_MS = 1000
export const SENSOR_TIMEOUT_MS = 2000
// Berapa kali polling gagal berturut-turut sebelum dianggap tidak terjangkau (hindari kedip)
export const SENSOR_FAILS_BEFORE_UNREACHABLE = 2

const PROBLEM = new Set(['unset', 'unreachable', 'port_not_found', 'port_busy', 'disconnected', 'error', 'stalled', 'waiting_data', 'calibration_failed'])

// apiStatus: 'unset' | 'connecting' | 'ok' | 'unreachable' (dari polling frontend)
// data: JSON terakhir dari penghubung, atau null
export function describeSensor(apiStatus, data) {
  let kind
  if (apiStatus === 'unset') kind = 'unset'
  else if (apiStatus === 'unreachable') kind = 'unreachable'
  else if (!data) kind = 'connecting'
  else if (data.connection !== 'streaming') kind = data.connection // starting, waiting_data, stalled, port_*, disconnected, error
  else if (data.calibration === 'failed') kind = 'calibration_failed'
  else if (data.calibration === 'waiting' || data.calibration === 'format') kind = 'calibrating_format'
  else if (data.calibration === 'baseline') kind = 'calibrating_baseline'
  else if (data.motion_detected === true) kind = 'motion'
  else if (data.motion_detected === false) kind = 'still'
  else kind = 'processing' // siap, tapi belum ada skor segar

  return {
    kind,
    isProblem: PROBLEM.has(kind),
    isCalibrating: kind === 'calibrating_format' || kind === 'calibrating_baseline',
    hasDecision: kind === 'motion' || kind === 'still',
    progress: data?.calibration_progress ?? null,
    isReplay: data?.source === 'replay',
  }
}
