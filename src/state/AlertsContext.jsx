// State bersama untuk AlertEvent. Semua screen membaca & mengubah status alert lewat sini,
// supaya perubahan (mis. ditandai "dicek") langsung terlihat di Dashboard dan Notifikasi.
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { alertEvents, demoNow } from '../data/dummy.js'

const AlertsContext = createContext(null)

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState(alertEvents)
  // id alert -> aksi yang dipilih keluarga ('markChecked' | 'callElder' | 'callEmergency')
  const [responses, setResponses] = useState({})

  // Mencatat respons keluarga; alert yang masih "baru" otomatis jadi "dicek".
  const respond = useCallback((id, action) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id && a.status === 'baru' ? { ...a, status: 'dicek' } : a)),
    )
    setResponses((prev) => ({ ...prev, [id]: action }))
  }, [])

  // Menambah AlertEvent baru (mis. hasil konfirmasi lansia). Waktunya = demoNow, dan
  // diletakkan paling depan supaya tetap dianggap paling baru walau jamnya sama.
  const nextId = useRef(1)
  const addAlert = useCallback(({ tingkat, deskripsi, status }) => {
    const alert = { id: `sim-${nextId.current++}`, waktu: demoNow, tingkat, deskripsi, status }
    setAlerts((prev) => [alert, ...prev])
    return alert
  }, [])

  const value = useMemo(
    () => ({ alerts, responses, respond, addAlert }),
    [alerts, responses, respond, addAlert],
  )

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export function useAlerts() {
  const ctx = useContext(AlertsContext)
  if (!ctx) throw new Error('useAlerts harus dipakai di dalam <AlertsProvider>')
  return ctx
}
