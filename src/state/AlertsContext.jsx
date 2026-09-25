// State bersama app: AlertEvent, respons keluarga, urutan kontak, dan jeda pemantauan.
// Semua screen membaca & mengubahnya lewat sini, supaya perubahan langsung terlihat di mana pun.
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { alertEvents, demoNow, kontakKeluarga } from '../data/dummy.js'

const AlertsContext = createContext(null)

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState(alertEvents)
  // id alert -> aksi yang dipilih keluarga ('markChecked' | 'callElder' | 'callEmergency')
  const [responses, setResponses] = useState({})
  // Urutan = prioritas dihubungi saat Darurat
  const [contacts, setContacts] = useState(kontakKeluarga)
  const [monitoringPaused, setMonitoringPaused] = useState(false)

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

  // Geser kontak satu posisi (-1 = naik, +1 = turun)
  const moveContact = useCallback((id, delta) => {
    setContacts((prev) => {
      const from = prev.findIndex((c) => c.id === id)
      const to = from + delta
      if (from < 0 || to < 0 || to >= prev.length) return prev
      const next = [...prev]
      ;[next[from], next[to]] = [next[to], next[from]]
      return next
    })
  }, [])

  // Kembalikan semua state ke nilai awal dari dummy.js (fitur demo)
  const resetDemo = useCallback(() => {
    setAlerts(alertEvents)
    setResponses({})
    setContacts(kontakKeluarga)
    setMonitoringPaused(false)
    nextId.current = 1
  }, [])

  const value = useMemo(
    () => ({
      alerts,
      responses,
      respond,
      addAlert,
      contacts,
      moveContact,
      monitoringPaused,
      setMonitoringPaused,
      resetDemo,
    }),
    [alerts, responses, respond, addAlert, contacts, moveContact, monitoringPaused, resetDemo],
  )

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export function useAlerts() {
  const ctx = useContext(AlertsContext)
  if (!ctx) throw new Error('useAlerts harus dipakai di dalam <AlertsProvider>')
  return ctx
}
