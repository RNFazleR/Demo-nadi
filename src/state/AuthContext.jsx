// Login keluarga (SIMULASI prototipe): akun dicocokkan dengan dummy.js, tanpa server.
// Sesi diingat lewat localStorage (hanya id akun, bukan kata sandi) supaya APK tidak
// meminta login tiap dibuka. Reset data demo tidak mengeluarkan pengguna.
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { akunKeluarga, kontakKeluarga } from '../data/dummy.js'
import { readStored, writeStored } from '../lib/storage.js'

const SESSION_KEY = 'nadi.session'
const AuthContext = createContext(null)

function toUser(akun) {
  if (!akun) return null
  const kontak = kontakKeluarga.find((k) => k.id === akun.kontakId)
  return { id: akun.id, email: akun.email, nama: kontak?.nama ?? akun.email }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => toUser(akunKeluarga.find((a) => a.id === readStored(SESSION_KEY))))
  // Feedback di layar login setelah keluar
  const [justSignedOut, setJustSignedOut] = useState(false)

  // Mengembalikan null kalau berhasil, atau kunci error dari copy.login.errors
  const login = useCallback((email, password) => {
    const akun = akunKeluarga.find((a) => a.email === email.trim().toLowerCase())
    if (!akun || akun.kataSandi !== password) return 'wrong'
    writeStored(SESSION_KEY, akun.id)
    setUser(toUser(akun))
    setJustSignedOut(false)
    return null
  }, [])

  const logout = useCallback(() => {
    writeStored(SESSION_KEY, null)
    setUser(null)
    setJustSignedOut(true)
  }, [])

  const value = useMemo(() => ({ user, login, logout, justSignedOut }), [user, login, logout, justSignedOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
