import { copy } from '../data/copy.js'
import { useSensor } from '../state/SensorContext.jsx'
import Icon from './Icon.jsx'

// Ditampilkan di layar yang masih berbasis data demo saat mode sensor langsung aktif,
// supaya data nyata dan cerita dummy tidak tercampur.
export default function LiveModeNotice({ pageTitle }) {
  const { setMode } = useSensor()
  const t = copy.sensor.notice
  return (
    <div className="flex flex-col gap-4 px-gutter pb-8 pt-6">
      <h1 className="text-heading text-ink">{pageTitle}</h1>
      <section className="rounded-card bg-surface p-5 shadow-card">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
            <Icon name="wifi" className="h-5 w-5" />
          </span>
          <h2 className="text-title text-ink">{t.title}</h2>
        </div>
        <p className="mt-2 text-body-lg text-ink">{t.body(pageTitle)}</p>
        <button
          type="button"
          onClick={() => setMode('demo')}
          className="mt-4 flex min-h-tap w-full items-center justify-center rounded-btn border-2 border-brand-600 px-4 text-body-lg font-bold text-brand-700"
        >
          {t.backToDemo}
        </button>
      </section>
    </div>
  )
}
