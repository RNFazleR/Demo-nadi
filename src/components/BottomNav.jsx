import { copy } from '../data/copy.js'
import Icon from './Icon.jsx'

export const TABS = [
  { id: 'home', icon: 'home' },
  { id: 'history', icon: 'history' },
  { id: 'notifications', icon: 'bell' },
  { id: 'settings', icon: 'settings' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="sticky bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const isActive = tab.id === active
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-tap w-full flex-col items-center justify-center gap-0.5 py-2 text-body transition-colors ${
                  isActive ? 'font-bold text-brand-600' : 'text-ink-soft hover:text-ink'
                }`}
              >
                <Icon name={tab.icon} strokeWidth={isActive ? 2.4 : 2} />
                {copy.nav[tab.id]}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
