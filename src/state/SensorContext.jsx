// Sumber data app: 'demo' (cerita dummy, demoNow) atau 'live' (penghubung sensor ESP32).
// Saat 'live', JSON terbaru diambil dengan polling; saat 'demo', tidak ada request apa pun.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  SENSOR_API_URL,
  SENSOR_FAILS_BEFORE_UNREACHABLE,
  SENSOR_POLL_MS,
  SENSOR_TIMEOUT_MS,
} from '../lib/sensor.js'

const SensorContext = createContext(null)

export function SensorProvider({ children }) {
  const [mode, setMode] = useState('demo')
  const [live, setLive] = useState({ apiStatus: 'connecting', data: null })

  useEffect(() => {
    if (mode !== 'live') return undefined
    let cancelled = false
    let timer
    let failures = 0
    let hadData = false
    setLive({ apiStatus: 'connecting', data: null })

    const tick = async () => {
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), SENSOR_TIMEOUT_MS)
      try {
        const res = await fetch(SENSOR_API_URL, { signal: ctrl.signal, cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        failures = 0
        hadData = true
        if (!cancelled) setLive({ apiStatus: 'ok', data })
      } catch {
        failures += 1
        // Belum pernah dapat data: langsung beri tahu. Sudah pernah: tunggu beberapa kegagalan
        // berturut-turut supaya tidak berkedip. Data lama tidak ditampilkan sebagai kondisi terkini.
        const limit = hadData ? SENSOR_FAILS_BEFORE_UNREACHABLE : 1
        if (!cancelled && failures >= limit) setLive({ apiStatus: 'unreachable', data: null })
      } finally {
        clearTimeout(timeout)
        if (!cancelled) timer = setTimeout(tick, SENSOR_POLL_MS)
      }
    }
    tick()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [mode])

  const value = useMemo(
    () => ({ mode, setMode, isLive: mode === 'live', apiUrl: SENSOR_API_URL, ...live }),
    [mode, live],
  )
  return <SensorContext.Provider value={value}>{children}</SensorContext.Provider>
}

export function useSensor() {
  const ctx = useContext(SensorContext)
  if (!ctx) throw new Error('useSensor harus dipakai di dalam <SensorProvider>')
  return ctx
}
