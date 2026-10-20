import { useEffect, useRef } from 'react'
import { copy } from '../data/copy.js'
import { useAuth } from '../state/AuthContext.jsx'
import { useSensor } from '../state/SensorContext.jsx'
import Icon from '../components/Icon.jsx'
import SensorHostForm from '../components/SensorHostForm.jsx'
import DeviceStatus from '../components/DeviceStatus.jsx'
import InviteCode from '../components/InviteCode.jsx'

const t = copy.pusatSettings

// Pengaturan HP Pusat untuk keluarga (dibuka dari mode lansia dengan kata sandi).
export default function PusatSettings({ onBack }) {
  const { user, logout, linkedPusat } = useAuth()
  const { mode, setMode } = useSensor()
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-5 px-gutter pb-8 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-tap items-center gap-2 self-start rounded-btn px-2 text-body-lg font-semibold text-brand-700"
      >
        <Icon name="chevronLeft" className="h-5 w-5" strokeWidth={2.4} />
        {t.backToElder}
      </button>
      <h1 ref={headingRef} tabIndex={-1} className="text-heading text-ink">
        {t.title}
      </h1>

      <section className="rounded-card bg-surface p-4 shadow-card">
        <h2 className="text-title text-ink">{t.deviceTitle}</h2>
        <fieldset className="mt-2">
          <legend className="sr-only">{copy.sensor.source.title}</legend>
          {['demo', 'live'].map((value) => (
            <label key={value} className="flex min-h-tap cursor-pointer items-center gap-3 rounded-btn px-2 hover:bg-surface-muted">
              <input
                type="radio"
                name="pusat-data-source"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
                className="h-5 w-5 shrink-0 accent-brand-600"
              />
              <span className="text-body-lg text-ink">{value === 'demo' ? copy.sensor.source.demo : copy.pusatHome.device.live}</span>
            </label>
          ))}
        </fieldset>
        {mode === 'live' && (
          <div className="mt-3">
            <SensorHostForm id="pusat-sensor-host" />
            <DeviceStatus />
          </div>
        )}
      </section>

      <section className="rounded-card bg-surface p-4 shadow-card">
        <h2 className="text-title text-ink">{t.codeTitle}</h2>
        <p className="mt-1 text-body text-ink-soft">{copy.pusatSetup.code.body}</p>
        <InviteCode code={linkedPusat.kodeUndangan} pusatId={linkedPusat.id} />
      </section>

      <section className="rounded-card bg-surface p-4 shadow-card">
        <h2 className="text-title text-ink">{copy.settings.account.title}</h2>
        <p className="mt-1 text-body text-ink-soft">{copy.settings.account.signedInAs}</p>
        <p className="break-all text-body-lg font-bold text-ink">{user.email}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-3 flex min-h-tap items-center gap-2 rounded-btn border-2 border-line px-5 text-body-lg font-bold text-ink hover:bg-surface-muted"
        >
          <Icon name="logout" className="h-5 w-5" />
          {t.logout}
        </button>
      </section>
    </div>
  )
}
