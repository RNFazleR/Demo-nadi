import { copy } from '../data/copy.js'
import Icon from './Icon.jsx'

// Pengganti kartu status saat pemantauan dijeda. Sengaja netral, bukan warna status.
export default function PausedCard() {
  return (
    <section aria-live="polite" className="rounded-card border-2 border-line bg-surface-muted p-5 shadow-raised">
      <div className="flex items-center justify-between gap-3">
        <p className="text-body text-ink-soft">{copy.dashboard.statusCardTitle}</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-body font-bold text-surface">
          <Icon name="pause" className="h-4 w-4" strokeWidth={2.6} />
          {copy.paused.label}
        </span>
      </div>
      <div className="mt-4 flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-surface">
          <Icon name="pause" className="h-7 w-7" strokeWidth={2.6} />
        </span>
        <h2 className="text-title text-ink">{copy.paused.title}</h2>
      </div>
      <p className="mt-3 text-body-lg text-ink">{copy.paused.body}</p>
    </section>
  )
}
