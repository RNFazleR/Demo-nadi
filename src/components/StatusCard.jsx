import { copy } from '../data/copy.js'
import { STATUS_STYLES } from '../lib/status.js'
import { formatTime } from '../lib/format.js'
import Icon from './Icon.jsx'

const STATUS_ICON = { normal: 'check', waspada: 'alert', darurat: 'alert' }

// Kartu paling menonjol di Dashboard: status saat ini + satu penjelasan netral.
export default function StatusCard({ status, alert }) {
  const style = STATUS_STYLES[status]
  const text = copy.status[status]

  return (
    <section
      aria-live="polite"
      className={`rounded-card border-2 p-5 shadow-raised ${style.card}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-body text-ink-soft">{copy.dashboard.statusCardTitle}</p>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-body font-bold ${style.solid}`}
        >
          {status === 'darurat' && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-surface opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-surface" />
            </span>
          )}
          {text.label}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${style.solid}`}>
          <Icon name={STATUS_ICON[status]} className="h-7 w-7" strokeWidth={2.4} />
        </span>
        <h2 className={`text-title ${style.text}`}>{text.summary}</h2>
      </div>

      <p className="mt-3 text-body-lg text-ink">
        {alert ? alert.deskripsi : copy.dashboard.noNewAlert}
      </p>

      {alert && (
        <p className="mt-2 text-body text-ink-soft">{copy.dashboard.alertAt(formatTime(alert.waktu))}</p>
      )}
    </section>
  )
}
