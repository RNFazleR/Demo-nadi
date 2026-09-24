import { useState } from 'react'
import { copy } from '../data/copy.js'
import { useAlerts } from '../state/AlertsContext.jsx'
import { sortNewestFirst } from '../lib/insights.js'
import AlertListItem from '../components/AlertListItem.jsx'
import AlertDetail from './AlertDetail.jsx'

// Tab Notifikasi: daftar alert, atau detail saat salah satu item dibuka.
export default function Notifications() {
  const { alerts } = useAlerts()
  const [openId, setOpenId] = useState(null)

  if (openId) return <AlertDetail alertId={openId} onBack={() => setOpenId(null)} />

  const sorted = sortNewestFirst(alerts)
  const newCount = alerts.filter((a) => a.status === 'baru').length

  return (
    <div className="flex flex-col gap-4 px-gutter pb-8 pt-6">
      <header>
        <h1 className="text-heading text-ink">{copy.notifications.title}</h1>
        <p className="text-body text-ink-soft">{copy.notifications.subtitle}</p>
        {newCount > 0 && (
          <p className="mt-2 inline-block rounded-full bg-accent-100 px-3 py-0.5 text-body font-semibold text-ink">
            {copy.notifications.newCount(newCount)}
          </p>
        )}
      </header>

      {sorted.length === 0 ? (
        <p className="text-body text-ink-soft">{copy.notifications.empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((alert) => (
            <li key={alert.id}>
              <AlertListItem alert={alert} onOpen={setOpenId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
