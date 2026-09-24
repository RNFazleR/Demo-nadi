import { copy } from '../data/copy.js'
import { elderProfile, dailyMetrics, demoNow, aktivitasTerakhir } from '../data/dummy.js'
import { useAlerts } from '../state/AlertsContext.jsx'
import { getCurrentStatus, average, compareToAverage } from '../lib/insights.js'
import { formatNumber, minutesBetween } from '../lib/format.js'
import ProfileHeader from '../components/ProfileHeader.jsx'
import StatusCard from '../components/StatusCard.jsx'
import MetricCard from '../components/MetricCard.jsx'
import Icon from '../components/Icon.jsx'

// Metrik yang diringkas: key copy -> field DailyMetric + cara menampilkan angkanya.
const METRICS = [
  { key: 'sleep', field: 'durasi_tidur_jam', icon: 'moon', display: (v) => formatNumber(v) },
  { key: 'activity', field: 'rasio_aktif', icon: 'walk', display: (v) => formatNumber(v * 100, 0) },
  { key: 'wakeUps', field: 'jumlah_bangun_malam', icon: 'wake', display: (v) => formatNumber(v) },
]

export default function Dashboard() {
  const { alerts } = useAlerts()
  const { status, alert } = getCurrentStatus(alerts)
  const today = dailyMetrics[dailyMetrics.length - 1]
  const minutesSinceActivity = minutesBetween(aktivitasTerakhir, demoNow)

  return (
    <div className="flex flex-col gap-6 px-gutter pb-8 pt-6">
      <ProfileHeader profile={elderProfile} />

      <StatusCard status={status} alert={alert} />

      <section className="flex flex-col gap-3">
        <h2 className="text-title text-ink">{copy.dashboard.todaySummary}</h2>
        {METRICS.map(({ key, field, icon, display }) => {
          const avg = average(dailyMetrics, field)
          const trend = compareToAverage(today[field], avg)
          const { label, unit, withUnit } = copy.metrics[key]
          return (
            <MetricCard
              key={key}
              icon={icon}
              label={label}
              value={display(today[field])}
              unit={unit}
              trend={trend}
              trendText={copy.comparison[key][trend]}
              averageText={copy.comparison.average(withUnit(display(avg)))}
            />
          )
        })}
      </section>

      <p className="flex items-center justify-center gap-2 text-body text-ink-soft">
        <Icon name="pulse" className="h-5 w-5 text-brand-500" />
        {copy.dashboard.lastActivity(minutesSinceActivity)}
      </p>

      <p className="text-center text-body text-ink-soft">{copy.app.disclaimer}</p>
    </div>
  )
}
