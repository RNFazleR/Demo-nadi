import { copy } from '../data/copy.js'
import { useAlerts } from '../state/AlertsContext.jsx'
import { useSensor } from '../state/SensorContext.jsx'
import Icon from './Icon.jsx'

const TABS = [
  { id: 'home', icon: 'home' },
  { id: 'history', icon: 'history' },
  { id: 'notifications', icon: 'bell' },
  { id: 'settings', icon: 'settings' },
]

export default function BottomNav({ active, onChange }) {
  const { alerts } = useAlerts()
  const { isLive } = useSensor()
  // Badge berasal dari alert demo, jadi tidak ditampilkan di mode sensor langsung
  const newCount = isLive ? 0 : alerts.filter((a) => a.status === 'baru').length

  return (
    <nav className="sticky bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {/* Kolom fleksibel sesuai panjang label (bukan 4 kolom sama lebar), supaya "Pengaturan"
          tetap 16px dan tidak meluber di layar 320px. */}
      <ul className="flex">
        {TABS.map((tab) => {
          const isActive = tab.id === active
          const badge = tab.id === 'notifications' && newCount > 0 ? newCount : 0
          return (
            <li key={tab.id} className="flex-auto">
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={badge ? copy.nav.withBadge(copy.nav[tab.id], badge) : undefined}
                className={`flex min-h-tap w-full flex-col items-center justify-center gap-0.5 whitespace-nowrap px-1 py-2 text-body transition-colors focus-visible:[outline-offset:-3px] ${
                  isActive ? 'font-bold text-brand-600' : 'text-ink-soft hover:text-ink'
                }`}
              >
                <span className="relative">
                  <Icon name={tab.icon} strokeWidth={isActive ? 2.4 : 2} />
                  {badge > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-2.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-700 px-1 text-caption font-bold leading-none text-surface ring-2 ring-surface"
                    >
                      {badge}
                    </span>
                  )}
                </span>
                {/* Salinan tebal tak terlihat memesan lebar, supaya kolom tidak bergeser saat aktif */}
                <span className="grid">
                  <span aria-hidden="true" className="invisible col-start-1 row-start-1 font-bold">
                    {copy.nav[tab.id]}
                  </span>
                  <span className="col-start-1 row-start-1">{copy.nav[tab.id]}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
