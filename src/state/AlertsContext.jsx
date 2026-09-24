// State bersama untuk AlertEvent. Semua screen membaca & mengubah status alert lewat sini,
// supaya perubahan (mis. ditandai "dicek") langsung terlihat di Dashboard dan Notifikasi.
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { alertEvents } from '../data/dummy.js'

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

  const value = useMemo(() => ({ alerts, responses, respond }), [alerts, responses, respond])

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export function useAlerts() {
  const ctx = useContext(AlertsContext)
  if (!ctx) throw new Error('useAlerts harus dipakai di dalam <AlertsProvider>')
  return ctx
}
