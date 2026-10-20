import { useEffect, useRef, useState } from 'react'
import PhoneFrame from './components/PhoneFrame.jsx'
import BottomNav from './components/BottomNav.jsx'
import Dashboard from './screens/Dashboard.jsx'
import Notifications from './screens/Notifications.jsx'
import History from './screens/History.jsx'
import Settings from './screens/Settings.jsx'
import ElderCheck from './screens/ElderCheck.jsx'
import Login from './screens/Login.jsx'
import { AlertsProvider } from './state/AlertsContext.jsx'
import { SensorProvider } from './state/SensorContext.jsx'
import { AuthProvider, useAuth } from './state/AuthContext.jsx'

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

// Belum masuk -> hanya layar login. Setelah masuk, app keluarga dimulai dari Beranda
// (FamilyApp dipasang ulang, jadi tab & tampilan kembali ke awal). State alert & sensor
// ada di atas gerbang ini, jadi tidak hilang saat keluar lalu masuk lagi.
function AuthGate() {
  const { user } = useAuth()
  if (!user) {
    return (
      <PhoneFrame>
        <main className="flex flex-1 flex-col">
          <Login />
        </main>
      </PhoneFrame>
    )
  }
  return <FamilyApp />
}

function FamilyApp() {
  const [tab, setTab] = useState('home')
  // 'family' = app keluarga, 'elder' = simulasi layar di HP lansia (fitur demo)
  const [view, setView] = useState('family')
  const mainRef = useRef(null)

  // Tiap pindah tab/tampilan mulai dari atas (window di HP, PhoneFrame di laptop)
  useEffect(() => {
    mainRef.current?.scrollIntoView({ block: 'start' })
  }, [tab, view])

  const backToFamily = () => {
    setTab('home')
    setView('family')
  }

  return (
    <PhoneFrame>
      {view === 'elder' ? (
        <main ref={mainRef} className="flex flex-1 flex-col">
          <ElderCheck onExit={backToFamily} />
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
