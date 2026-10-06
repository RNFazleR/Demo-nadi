import { useState } from 'react'
import { copy } from '../data/copy.js'
import { demoNow } from '../data/dummy.js'
import { useAlerts } from '../state/AlertsContext.jsx'
import { sortNewestFirst } from '../lib/insights.js'
import { daysAgo } from '../lib/format.js'
import AlertListItem from '../components/AlertListItem.jsx'
import AlertDetail from './AlertDetail.jsx'

// Kelompok daftar (Miller + Gestalt common region): yang perlu ditanggapi selalu di atas,
// sisanya dipotong per hari supaya tidak jadi satu daftar panjang.
const GROUPS = [
  { key: 'needsResponse', match: (a) => a.status === 'baru' },
  { key: 'today', match: (a) => daysAgo(a.waktu, demoNow) === 0 },
  { key: 'yesterday', match: (a) => daysAgo(a.waktu, demoNow) === 1 },
  { key: 'earlier', match: () => true },
]

function groupAlerts(alerts) {
  const groups = GROUPS.map((g) => ({ key: g.key, items: [] }))
  for (const alert of sortNewestFirst(alerts)) {
    const i = GROUPS.findIndex((g) => g.match(alert))
    groups[i].items.push(alert)
  }
  return groups.filter((g) => g.items.length > 0)
}

// Tab Notifikasi: daftar alert, atau detail saat salah satu item dibuka.
export default function Notifications() {
  const { alerts } = useAlerts()
  const [openId, setOpenId] = useState(null)

  if (openId) return <AlertDetail alertId={openId} onBack={() => setOpenId(null)} />

  const groups = groupAlerts(alerts)

  return (
    <div className="flex flex-col gap-6 px-gutter pb-8 pt-6">
      <header>
        <h1 className="text-heading text-ink">{copy.notifications.title}</h1>
        <p className="text-body text-ink-soft">{copy.notifications.subtitle}</p>
      </header>

      {groups.length === 0 ? (
        <p className="text-body text-ink-soft">{copy.notifications.empty}</p>
      ) : (
        groups.map(({ key, items }) => (
          <section key={key} aria-labelledby={`group-${key}`} className="flex flex-col gap-3">
            <h2 id={`group-${key}`} className="text-body-lg font-bold text-ink">
              {copy.notifications.groups[key](items.length)}
            </h2>
            <ul className="flex flex-col gap-3">
              {items.map((alert) => (
                <li key={alert.id}>
                  <AlertListItem alert={alert} onOpen={setOpenId} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
