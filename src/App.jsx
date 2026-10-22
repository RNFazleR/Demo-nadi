import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import PhoneFrame from './components/PhoneFrame.jsx'
import BottomNav from './components/BottomNav.jsx'
import Dashboard from './screens/Dashboard.jsx'
import Notifications from './screens/Notifications.jsx'
import History from './screens/History.jsx'
import Settings from './screens/Settings.jsx'
import ElderCheck from './screens/ElderCheck.jsx'
import Login from './screens/Login.jsx'
import LinkPusat from './screens/LinkPusat.jsx'
import PusatSetup from './screens/PusatSetup.jsx'
import PusatHome from './screens/PusatHome.jsx'
import PusatSettings from './screens/PusatSettings.jsx'
import { AlertsProvider } from './state/AlertsContext.jsx'
import { SensorProvider, useSensor } from './state/SensorContext.jsx'
import { readStored } from './lib/storage.js'
import { AuthProvider, useAuth } from './state/AuthContext.jsx'

// Alat bantu pengembang (Fase 0); dimuat terpisah supaya BLE/Firebase tidak masuk app utama
const UjiFase0 = lazy(() => import('./screens/UjiFase0.jsx'))

export default function App() {
  return (
    <AuthProvider>
      <AlertsProvider>
        <SensorProvider>
          <AuthGate />
        </SensorProvider>
      </AlertsProvider>
    </AuthProvider>
  )
}

// Dua sisi NADI, ditentukan oleh akun:
//   belum masuk                    -> Login
//   akun Pusat (HP orang tua)      -> PusatApp (setup sekali, lalu mode lansia)
//   akun Cabang belum tertaut      -> LinkPusat (masukkan kode keluarga)
//   akun Cabang tertaut            -> FamilyApp (app keluarga)
// State alert & sensor ada di atas gerbang ini, jadi tidak hilang saat keluar lalu masuk lagi
// (di prototipe, alert dari HP Pusat terlihat di Cabang pada perangkat yang sama).
function AuthGate() {
  const { user, linkedPusat } = useAuth()
  const [uji, setUji] = useState(false)
  if (user?.peran === 'pusat') return <PusatApp />
  if (user && linkedPusat) return <FamilyApp />
  return (
    <PhoneFrame>
      <main className="flex flex-1 flex-col">
        {user ? (
          <LinkPusat />
        ) : uji ? (
          <Suspense fallback={null}>
            <UjiFase0 onBack={() => setUji(false)} />
          </Suspense>
        ) : (
          <Login onOpenUji={() => setUji(true)} />
        )}
      </main>
    </PhoneFrame>
  )
}

// HP Pusat: setup oleh keluarga, lalu mode lansia. Pertanyaan konfirmasi dan pengaturan
// (lewat tekan lama + kata sandi) menggantikan layar utama sementara.
function PusatApp() {
  const { linkedPusat, pusatReady } = useAuth()
  const { setMode } = useSensor()
  // 'home' | 'question' | 'settings'
  const [view, setView] = useState('home')
  const lansia = linkedPusat.lansia

  // Saat app dibuka ulang, HP Pusat yang sudah disiapkan dengan alamat perangkat langsung membaca sensor
  useEffect(() => {
    if (pusatReady && readStored('nadi.sensorHost')) setMode('live')
  }, [pusatReady, setMode])

  return (
    <PhoneFrame>
      <main className="flex flex-1 flex-col">
        {!pusatReady ? (
          <PusatSetup lansia={lansia} />
        ) : view === 'question' ? (
          <ElderCheck context="pusat" onExit={() => setView('home')} />
        ) : view === 'settings' ? (
          <PusatSettings onBack={() => setView('home')} />
        ) : (
          <PusatHome lansia={lansia} onShowQuestion={() => setView('question')} onOpenSettings={() => setView('settings')} />
        )}
      </main>
    </PhoneFrame>
  )
}

function FamilyApp() {
  const { clearJustLinked } = useAuth()
  const { setMode } = useSensor()
  const [tab, setTab] = useState('home')
  // 'family' = app keluarga, 'elder' = simulasi layar di HP lansia (fitur demo)
  const [view, setView] = useState('family')
  const mainRef = useRef(null)

  // Tiap pindah tab/tampilan mulai dari atas (window di HP, PhoneFrame di laptop)
  useEffect(() => {
    mainRef.current?.scrollIntoView({ block: 'start' })
  }, [tab, view])

  // App keluarga selalu dimulai dari mode demo (seperti saat dimuat ulang), walau di perangkat
  // yang sama sebelumnya masuk sebagai HP Pusat yang membaca sensor
  useEffect(() => {
    setMode('demo')
  }, [setMode])

  // Catatan "Tertaut dengan HP …" cukup sekali, hilang saat pindah layar
  useEffect(() => {
    if (tab !== 'home' || view !== 'family') clearJustLinked()
  }, [tab, view, clearJustLinked])

  const backToFamily = () => {
    setTab('home')
    setView('family')
  }

  return (
    <PhoneFrame>
      {view === 'elder' ? (
        <main ref={mainRef} className="flex flex-1 flex-col">
          <ElderCheck context="preview" onExit={backToFamily} />
        </main>
      ) : (
        <>
          <main ref={mainRef} className="flex flex-1 flex-col">
            {tab === 'home' && <Dashboard onSimulateAnomaly={() => setView('elder')} />}
            {tab === 'notifications' && <Notifications />}
            {tab === 'history' && <History />}
            {tab === 'settings' && <Settings />}
          </main>
          <BottomNav active={tab} onChange={setTab} />
        </>
      )}
    </PhoneFrame>
  )
}
