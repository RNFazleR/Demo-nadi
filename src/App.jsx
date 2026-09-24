import { useEffect, useRef, useState } from 'react'
import PhoneFrame from './components/PhoneFrame.jsx'
import BottomNav from './components/BottomNav.jsx'
import Dashboard from './screens/Dashboard.jsx'
import Notifications from './screens/Notifications.jsx'
import PlaceholderScreen from './screens/PlaceholderScreen.jsx'
import ElderCheck from './screens/ElderCheck.jsx'
import { AlertsProvider } from './state/AlertsContext.jsx'
import { copy } from './data/copy.js'

export default function App() {
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
    <AlertsProvider>
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
              {tab === 'history' && <PlaceholderScreen title={copy.nav.history} />}
            </main>
            <BottomNav active={tab} onChange={setTab} />
          </>
        )}
      </PhoneFrame>
    </AlertsProvider>
  )
}
