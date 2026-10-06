import { copy } from '../data/copy.js'
import { elderProfile, dailyMetrics, demoNow, aktivitasTerakhir } from '../data/dummy.js'
import { useAlerts } from '../state/AlertsContext.jsx'
import { getCurrentStatus, compareDayToUsual } from '../lib/insights.js'
import { METRICS } from '../lib/metrics.js'
import { minutesBetween } from '../lib/format.js'
import ProfileHeader from '../components/ProfileHeader.jsx'
import StatusCard from '../components/StatusCard.jsx'
import PausedCard from '../components/PausedCard.jsx'
import MetricCard from '../components/MetricCard.jsx'
import Icon from '../components/Icon.jsx'

export default function Dashboard({ onSimulateAnomaly }) {
  const { alerts, monitoringPaused } = useAlerts()
  const { status, alert } = getCurrentStatus(alerts)
  const today = dailyMetrics[dailyMetrics.length - 1]
  const minutesSinceActivity = minutesBetween(aktivitasTerakhir, demoNow)

  return (
    <div className="flex flex-col gap-6 px-gutter pb-8 pt-6">
      <ProfileHeader profile={elderProfile} />

      {/* Saat dijeda, status "Normal" menyesatkan, jadi diganti kartu jeda. Alert yang
          belum ditanggapi tetap ditampilkan supaya tidak tersembunyi. */}
      {monitoringPaused && <PausedCard />}
      {(!monitoringPaused || status !== 'normal') && <StatusCard status={status} alert={alert} />}

      <section className="flex flex-col gap-3">
        <h2 className="text-title text-ink">{copy.dashboard.todaySummary}</h2>
        {METRICS.map(({ key, field, icon, display }) => {
          // Sama dengan Riwayat & Detail Alert: hari ini vs rata-rata hari LAIN
          const { value, usual, trend } = compareDayToUsual(dailyMetrics, today.tanggal, field)
          const { label, unit, withUnit } = copy.metrics[key]
          return (
            <MetricCard
              key={key}
              icon={icon}
              label={label}
              value={display(value)}
              unit={unit}
              trend={trend}
              trendText={copy.comparison[key][trend]}
              averageText={copy.comparison.average(withUnit(display(usual)))}
            />
          )
        })}
      </section>

      <p className="flex items-center justify-center gap-2 text-body text-ink-soft">
        <Icon name="pulse" className="h-5 w-5 text-brand-500" />
        {copy.dashboard.lastActivity(minutesSinceActivity)}
      </p>

      <p className="text-center text-body text-ink-soft">{copy.app.disclaimer}</p>

      {/* Kontrol khusus demo: membuka layar konfirmasi di HP lansia */}
      <div className="flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-line p-4">
        <span className="rounded-full bg-surface-muted px-3 py-0.5 text-body font-semibold text-ink-soft">
          {copy.dashboard.simulate.tag}
        </span>
        <button
          type="button"
          onClick={onSimulateAnomaly}
          className="flex min-h-tap items-center gap-2 rounded-btn bg-ink px-5 text-body-lg font-bold text-surface"
        >
          <Icon name="phone" className="h-5 w-5" />
          {copy.dashboard.simulate.button}
        </button>
        <p className="text-center text-body text-ink-soft">{copy.dashboard.simulate.hint}</p>
      </div>
    </div>
  )
}
