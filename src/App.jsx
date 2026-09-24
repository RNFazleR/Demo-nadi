import { useEffect, useRef, useState } from 'react'
import PhoneFrame from './components/PhoneFrame.jsx'
import BottomNav from './components/BottomNav.jsx'
import Dashboard from './screens/Dashboard.jsx'
import Notifications from './screens/Notifications.jsx'
import PlaceholderScreen from './screens/PlaceholderScreen.jsx'
import { AlertsProvider } from './state/AlertsContext.jsx'
import { copy } from './data/copy.js'

export default function App() {
  const [tab, setTab] = useState('home')
  const mainRef = useRef(null)

  // Tiap pindah tab mulai dari atas (window di HP, PhoneFrame di laptop)
  useEffect(() => {
    mainRef.current?.scrollIntoView({ block: 'start' })
  }, [tab])

  return (
    <AlertsProvider>
      <PhoneFrame>
        <main ref={mainRef} className="flex flex-1 flex-col">
          {tab === 'home' && <Dashboard />}
          {tab === 'notifications' && <Notifications />}
          {tab === 'history' && <PlaceholderScreen title={copy.nav.history} />}
        </main>
        <BottomNav active={tab} onChange={setTab} />
      </PhoneFrame>
    </AlertsProvider>
  )
}
