// Mode "Sensor langsung": alamat API penghubung (sensor/csi_bridge.py) dan penerjemahan
// JSON-nya menjadi satu keadaan tampilan. Data sensor TIDAK pernah dicampur dengan data demo.

// Default: laptop yang sama dengan halaman ini, port 8765. Untuk HP di jaringan yang sama,
// buka frontend lewat IP laptop (mis. http://192.168.1.5:5173) dan jalankan penghubung
// dengan --host 0.0.0.0. Bisa juga ditimpa lewat VITE_SENSOR_API_URL.
export const SENSOR_API_URL =
  import.meta.env.VITE_SENSOR_API_URL ||
  `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8765/api/sensor/latest`

export const SENSOR_POLL_MS = 1000
export const SENSOR_TIMEOUT_MS = 2000
// Berapa kali polling gagal berturut-turut sebelum dianggap tidak terjangkau (hindari kedip)
export const SENSOR_FAILS_BEFORE_UNREACHABLE = 2

const PROBLEM = new Set(['unreachable', 'port_not_found', 'port_busy', 'disconnected', 'error', 'stalled', 'waiting_data', 'calibration_failed'])

// apiStatus: 'connecting' | 'ok' | 'unreachable' (dari polling frontend)
// data: JSON terakhir dari penghubung, atau null
export function describeSensor(apiStatus, data) {
  let kind
  if (apiStatus === 'unreachable') kind = 'unreachable'
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
