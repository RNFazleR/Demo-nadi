import { useEffect, useRef, useState } from 'react'
import { copy } from '../data/copy.js'
import { useAuth } from '../state/AuthContext.jsx'
import { useSensor } from '../state/SensorContext.jsx'
import Icon from '../components/Icon.jsx'
import SensorHostForm from '../components/SensorHostForm.jsx'
import DeviceStatus from '../components/DeviceStatus.jsx'
import InviteCode from '../components/InviteCode.jsx'

const t = copy.pusatSetup
const TOTAL = 3

// Menyiapkan HP Pusat (dikerjakan keluarga, sekali): perangkat -> kode keluarga -> mulai.
// Setelah "Mulai", HP ini masuk mode lansia (PusatHome).
export default function PusatSetup({ lansia }) {
  const { user, logout, linkedPusat, setPusatReady } = useAuth()
  const { setMode } = useSensor()
  const [step, setStep] = useState(1)
  const headingRef = useRef(null)

  // Tiap ganti langkah, fokus ke judul supaya pembaca layar tahu isinya berganti
  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  const titles = { 1: t.device.title, 2: t.code.title, 3: t.start.title }

  return (
    <div className="flex flex-1 flex-col gap-5 px-gutter pb-8 pt-8">
      <div>
        <p className="text-body font-semibold text-brand-700">{t.stepOf(step, TOTAL)}</p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-1 text-heading text-ink">
          {titles[step]}
        </h1>
        {step === 1 && <p className="mt-2 text-body-lg text-ink-soft">{t.intro(lansia.nama)}</p>}
      </div>

      {step === 1 && (
        <section className="rounded-card bg-surface p-4 shadow-card">
          <p className="text-body text-ink">{t.device.body}</p>
          <div className="mt-4">
            <SensorHostForm id="setup-sensor-host" onSaved={() => setMode('live')} />
          </div>
          <DeviceStatus />
          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-4 flex min-h-tap w-full items-center justify-center rounded-btn bg-brand-600 px-5 text-body-lg font-bold text-surface hover:bg-brand-700"
          >
            {t.device.next}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('demo')
              setStep(2)
            }}
            className="mt-2 flex min-h-tap w-full items-center justify-center rounded-btn border-2 border-line px-5 text-body-lg font-bold text-ink"
          >
            {t.device.skip}
          </button>
          <p className="mt-2 text-center text-body text-ink-soft">{t.device.skipNote}</p>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-card bg-surface p-4 shadow-card">
          <p className="text-body text-ink">{t.code.body}</p>
          <InviteCode code={linkedPusat.kodeUndangan} pusatId={linkedPusat.id} />
          <button
            type="button"
            onClick={() => setStep(3)}
            className="mt-4 flex min-h-tap w-full items-center justify-center rounded-btn bg-brand-600 px-5 text-body-lg font-bold text-surface hover:bg-brand-700"
          >
            {t.code.next}
          </button>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-card bg-surface p-4 shadow-card">
          <ul className="flex flex-col gap-3">
            {t.start.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-body-lg text-ink">
                <Icon name="check" className="mt-1 h-5 w-5 shrink-0 text-brand-600" strokeWidth={2.4} />
                {point}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setPusatReady(true)}
            className="mt-5 flex min-h-tap w-full items-center justify-center rounded-btn bg-brand-600 px-5 text-body-lg font-bold text-surface hover:bg-brand-700"
          >
            {t.start.button}
          </button>
        </section>
      )}

      {step > 1 && (
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="flex min-h-tap items-center gap-2 self-start rounded-btn px-2 text-body-lg font-semibold text-brand-700"
        >
          <Icon name="chevronLeft" className="h-5 w-5" strokeWidth={2.4} />
          {t.back}
        </button>
      )}

      <div className="mt-auto flex flex-col items-center gap-1 pt-4 text-center">
        <p className="text-body text-ink-soft">{copy.linkPusat.signedInAs(user.email)}</p>
        <button type="button" onClick={logout} className="min-h-tap rounded-btn px-3 text-body font-semibold text-brand-700">
          {copy.linkPusat.switchAccount}
        </button>
      </div>
    </div>
  )
}
