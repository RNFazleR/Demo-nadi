// Sumber data app: 'demo' (cerita dummy, demoNow) atau 'live' (penghubung sensor ESP32).
// Saat 'live', JSON terbaru diambil dengan polling; saat 'demo', tidak ada request apa pun.
// Alamat penghubung yang diisi pengguna disimpan di localStorage (penting untuk APK).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_SENSOR_API_URL,
  DEFAULT_SENSOR_HOST,
  SENSOR_FAILS_BEFORE_UNREACHABLE,
  SENSOR_POLL_MS,
  SENSOR_TIMEOUT_MS,
  sensorApiUrl,
} from '../lib/sensor.js'
import { readStored, writeStored } from '../lib/storage.js'

const HOST_KEY = 'nadi.sensorHost'
const SensorContext = createContext(null)

export function SensorProvider({ children }) {
  const [mode, setMode] = useState('demo')
  const [live, setLive] = useState({ apiStatus: 'connecting', data: null })
  // null = belum pernah diisi pengguna -> pakai default (laptop yang sama / VITE_SENSOR_API_URL)
  const [savedHost, setSavedHost] = useState(() => readStored(HOST_KEY))
  const apiUrl = savedHost != null ? sensorApiUrl(savedHost) : DEFAULT_SENSOR_API_URL

  const setSensorHost = useCallback((host) => {
    const value = host.trim()
    writeStored(HOST_KEY, value)
    setSavedHost(value)
  }, [])

  useEffect(() => {
    if (mode !== 'live') return undefined
    // Tanpa alamat tidak ada yang bisa dibaca: tampilkan "belum diatur", bukan diam/Normal
    if (!apiUrl) {
      setLive({ apiStatus: 'unset', data: null })
      return undefined
    }
    let cancelled = false
    let timer
    let failures = 0
    let hadData = false
    setLive({ apiStatus: 'connecting', data: null })

    const tick = async () => {
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), SENSOR_TIMEOUT_MS)
      try {
        const res = await fetch(apiUrl, { signal: ctrl.signal, cache: 'no-store' })
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
  }, [mode, apiUrl])

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isLive: mode === 'live',
      apiUrl,
      sensorHost: savedHost ?? DEFAULT_SENSOR_HOST,
      setSensorHost,
      ...live,
    }),
    [mode, live, apiUrl, savedHost, setSensorHost],
  )
  return <SensorContext.Provider value={value}>{children}</SensorContext.Provider>
}

export function useSensor() {
  const ctx = useContext(SensorContext)
  if (!ctx) throw new Error('useSensor harus dipakai di dalam <SensorProvider>')
  return ctx
}
