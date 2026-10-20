// Login & dua sisi NADI (SIMULASI prototipe): akun dicocokkan dengan dummy.js, tanpa server.
// Peran akun menentukan sisi app: 'pusat' (HP orang tua, tersambung ke perangkat) atau
// 'cabang' (HP keluarga, ditautkan ke Pusat lewat kode undangan). Sesi, tautan, dan status
// "Pusat sudah disiapkan" diingat lewat localStorage (hanya id, bukan kata sandi).
// Reset data demo tidak mengeluarkan pengguna dan tidak melepas tautan.
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { akun, kontakKeluarga, pusat, tautanAwal } from '../data/dummy.js'
import { readStored, writeStored } from '../lib/storage.js'

const SESSION_KEY = 'nadi.session'
const LINKS_KEY = 'nadi.links'
const PUSAT_READY_KEY = 'nadi.pusatReady'
const AuthContext = createContext(null)

function toUser(a) {
  if (!a) return null
  if (a.peran === 'pusat') {
    const p = pusat.find((x) => x.id === a.pusatId)
    return { id: a.id, peran: 'pusat', email: a.email, nama: p?.lansia.nama ?? a.email, pusatId: a.pusatId }
  }
  const kontak = kontakKeluarga.find((k) => k.id === a.kontakId)
  return { id: a.id, peran: 'cabang', email: a.email, nama: kontak?.nama ?? a.email }
}

function readLinks() {
  try {
    return JSON.parse(readStored(LINKS_KEY)) ?? tautanAwal
  } catch {
    return tautanAwal
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => toUser(akun.find((a) => a.id === readStored(SESSION_KEY))))
  // Feedback di layar login setelah keluar
  const [justSignedOut, setJustSignedOut] = useState(false)
  // id akun Cabang -> id Pusat
  const [links, setLinks] = useState(readLinks)
  const [pusatReady, setPusatReadyState] = useState(() => readStored(PUSAT_READY_KEY) === '1')
  // Feedback sekali di Beranda setelah Cabang berhasil tertaut
  const [justLinked, setJustLinked] = useState(false)

  // Mengembalikan null kalau berhasil, atau kunci error dari copy.login.errors
  const login = useCallback((email, password) => {
    const found = akun.find((a) => a.email === email.trim().toLowerCase())
    if (!found || found.kataSandi !== password) return 'wrong'
    writeStored(SESSION_KEY, found.id)
    setUser(toUser(found))
    setJustSignedOut(false)
    return null
  }, [])

  const logout = useCallback(() => {
    writeStored(SESSION_KEY, null)
    setUser(null)
    setJustSignedOut(true)
    setJustLinked(false)
  }, [])

  // Untuk membuka pengaturan dari mode lansia di HP Pusat
  const verifyPassword = useCallback(
    (password) => akun.find((a) => a.id === user?.id)?.kataSandi === password,
    [user],
  )

  const saveLinks = (next) => {
    writeStored(LINKS_KEY, JSON.stringify(next))
    return next
  }

  // Cabang: tautkan ke Pusat lewat kode undangan. null = berhasil, atau kunci copy.linkPusat.errors
  const linkToPusat = useCallback(
    (code) => {
      const clean = code.replace(/\s/g, '')
      if (!clean) return 'empty'
      if (!/^\d{6}$/.test(clean)) return 'format'
      const target = pusat.find((p) => p.kodeUndangan === clean)
      if (!target) return 'wrong'
      setLinks((prev) => saveLinks({ ...prev, [user.id]: target.id }))
      setJustLinked(true)
      return null
    },
    [user],
  )

  const unlinkPusat = useCallback(() => {
    setLinks((prev) => {
      const next = { ...prev }
      delete next[user.id]
      return saveLinks(next)
    })
  }, [user])

  const setPusatReady = useCallback((ready) => {
    writeStored(PUSAT_READY_KEY, ready ? '1' : null)
    setPusatReadyState(ready)
  }, [])

  // Pusat yang tertaut dengan Cabang aktif, atau Pusat milik akun Pusat aktif
  const linkedPusat = useMemo(() => {
    const id = user?.peran === 'pusat' ? user.pusatId : links[user?.id]
    return pusat.find((p) => p.id === id) ?? null
  }, [user, links])

  // Daftar keluarga (Cabang) yang tertaut ke sebuah Pusat
  const cabangOf = useCallback(
    (pusatId) => akun.filter((a) => links[a.id] === pusatId).map(toUser),
    [links],
  )

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      justSignedOut,
      verifyPassword,
      linkedPusat,
      linkToPusat,
      unlinkPusat,
      cabangOf,
      pusatReady,
      setPusatReady,
      justLinked,
      clearJustLinked: () => setJustLinked(false),
    }),
    [user, login, logout, justSignedOut, verifyPassword, linkedPusat, linkToPusat, unlinkPusat, cabangOf, pusatReady, setPusatReady, justLinked],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
