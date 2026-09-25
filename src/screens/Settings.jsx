import { useState } from 'react'
import { copy } from '../data/copy.js'
import { useAlerts } from '../state/AlertsContext.jsx'
import Icon from '../components/Icon.jsx'

const PRIVACY_POINTS = [
  { key: 'noCamera', icon: 'cameraOff' },
  { key: 'wifiOnly', icon: 'wifi' },
  { key: 'wellness', icon: 'heart' },
]

const ORDER_BTN =
  'grid h-12 w-12 place-items-center rounded-btn border border-line text-ink transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'

// Tab Pengaturan: urutan kontak keluarga, privasi & jeda pemantauan, reset demo.
export default function Settings() {
  const { contacts, moveContact, monitoringPaused, setMonitoringPaused, resetDemo } = useAlerts()
  const [resetDone, setResetDone] = useState(false)
  const t = copy.settings

  const handleReset = () => {
    resetDemo()
    setResetDone(true)
  }

  return (
    <div className="flex flex-col gap-5 px-gutter pb-8 pt-6">
      <h1 className="text-heading text-ink">{t.title}</h1>

      {/* Kontak keluarga */}
      <section className="rounded-card bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Icon name="users" className="h-6 w-6 text-brand-600" />
          <h2 className="text-title text-ink">{t.contacts.title}</h2>
        </div>
        <p className="mt-1 text-body text-ink-soft">{t.contacts.explainer}</p>

        <ol className="mt-4 flex flex-col gap-3">
          {contacts.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 rounded-card border border-line p-3">
              <span
                aria-label={t.contacts.priority(i + 1)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-body-lg font-extrabold text-brand-700"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-lg font-bold text-ink">{c.nama}</p>
                <p className="text-body text-ink-soft">{c.hubungan}</p>
                <p className="text-body text-ink-soft tabular-nums">{c.nomor}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveContact(c.id, -1)}
                  disabled={i === 0}
                  aria-label={t.contacts.moveUp(c.nama)}
                  className={ORDER_BTN}
                >
                  <Icon name="arrowUp" className="h-5 w-5" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => moveContact(c.id, 1)}
                  disabled={i === contacts.length - 1}
                  aria-label={t.contacts.moveDown(c.nama)}
                  className={ORDER_BTN}
                >
                  <Icon name="arrowDown" className="h-5 w-5" strokeWidth={2.4} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Privasi & Data */}
      <section className="rounded-card bg-surface p-5 shadow-card">
        <h2 className="text-title text-ink">{t.privacy.title}</h2>
        <p className="mt-1 text-body text-ink-soft">{t.privacy.intro}</p>
        <ul className="mt-4 flex flex-col gap-3">
          {PRIVACY_POINTS.map(({ key, icon }) => (
            <li key={key} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Icon name={icon} className="h-5 w-5" />
              </span>
              <p className="pt-2 text-body text-ink">{t.privacy.points[key]}</p>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-line pt-5">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p id="pause-label" className="text-body-lg font-bold text-ink">
                {t.privacy.pauseTitle}
              </p>
              <p className="text-body text-ink-soft">{t.privacy.pauseHint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={monitoringPaused}
              aria-labelledby="pause-label"
              onClick={() => setMonitoringPaused(!monitoringPaused)}
              className={`relative mt-1 h-8 w-14 shrink-0 rounded-full transition-colors ${
                monitoringPaused ? 'bg-brand-600' : 'bg-surface-sunken'
              }`}
            >
              <span
                className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-surface shadow-card transition-transform ${
                  monitoringPaused ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
          <p className="mt-3 flex items-center gap-2 text-body font-semibold text-ink">
            <Icon name={monitoringPaused ? 'pause' : 'pulse'} className="h-5 w-5 text-brand-600" />
            {monitoringPaused ? t.privacy.pauseOn : t.privacy.pauseOff}
          </p>
        </div>
      </section>

      {/* Kontrol khusus demo */}
      <section className="flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-line p-4">
        <span className="rounded-full bg-surface-muted px-3 py-0.5 text-body font-semibold text-ink-soft">
          {t.reset.tag}
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="flex min-h-tap items-center gap-2 rounded-btn bg-ink px-5 text-body-lg font-bold text-surface"
        >
          <Icon name="refresh" className="h-5 w-5" />
          {t.reset.button}
        </button>
        <p className="text-center text-body text-ink-soft">{t.reset.hint}</p>
        {resetDone && (
          <p role="status" className="flex items-center gap-2 text-body font-semibold text-brand-700">
            <Icon name="check" className="h-5 w-5" strokeWidth={2.4} />
            {t.reset.done}
          </p>
        )}
      </section>
    </div>
  )
}
