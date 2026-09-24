import Icon from './Icon.jsx'

const TREND_ICON = { higher: 'arrowUp', same: 'equal', lower: 'arrowDown' }

// Kartu ringkasan satu metrik. Perbandingan sengaja netral (tanpa warna status).
export default function MetricCard({ icon, label, value, unit, trend, trendText, averageText }) {
  return (
    <article className="rounded-card bg-surface p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
          <Icon name={icon} />
        </span>
        <p className="min-w-0 flex-1 text-body-lg font-semibold text-ink">{label}</p>
        <p className="shrink-0 whitespace-nowrap">
          <span className="text-heading text-ink">{value}</span>
          <span className="ml-0.5 text-body text-ink-soft">{unit}</span>
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line pt-3">
        <span className="inline-flex items-center gap-1.5 text-body font-semibold text-ink">
          <Icon name={TREND_ICON[trend]} className="h-4 w-4 shrink-0 text-accent-500" strokeWidth={2.6} />
          {trendText}
        </span>
        <span className="text-body text-ink-soft">{averageText}</span>
      </div>
    </article>
  )
}
