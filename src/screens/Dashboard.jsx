import { useRef, useState } from 'react'
import { copy } from '../data/copy.js'
import { elderProfile, dailyMetrics, demoNow, aktivitasTerakhir } from '../data/dummy.js'
import { useAlerts } from '../state/AlertsContext.jsx'
import { useSensor } from '../state/SensorContext.jsx'
import SensorStatusCard from '../components/SensorStatusCard.jsx'
import { getCurrentStatus, compareDayToUsual } from '../lib/insights.js'
import { METRICS } from '../lib/metrics.js'
import { formatTime, minutesBetween } from '../lib/format.js'
import ProfileHeader from '../components/ProfileHeader.jsx'
import StatusCard from '../components/StatusCard.jsx'
import PausedCard from '../components/PausedCard.jsx'
import MetricCard from '../components/MetricCard.jsx'
import Icon from '../components/Icon.jsx'
import CallModal from '../components/CallModal.jsx'
import AlertDetail from './AlertDetail.jsx'

export default function Dashboard({ onSimulateAnomaly }) {
  const { alerts, monitoringPaused, addAlert, respond } = useAlerts()
  const { isLive } = useSensor()
  const [openAlertId, setOpenAlertId] = useState(null)
  const [calling, setCalling] = useState(false) // modal simulasi panggilan dari kartu Darurat
  const topRef = useRef(null)

  // Fitur demo: notifikasi Waspada langsung masuk, lalu gulir ke atas supaya kartu status
  // yang berubah langsung terlihat (feedback)
  const simulateWaspada = () => {
    addAlert({ tingkat: 'waspada', status: 'baru', deskripsi: copy.dashboard.simulate.waspadaAlert(elderProfile.nama) })
    topRef.current?.scrollIntoView({ block: 'start' })
  }

  // Mode sensor langsung: hanya data sensor, tanpa status/metrik/alert dari cerita demo
  if (isLive) {
    return (
      <div className="flex flex-col gap-6 px-gutter pb-8 pt-6">
        <ProfileHeader profile={elderProfile} />
        <p className="-mt-3 self-start rounded-full bg-brand-700 px-3 py-0.5 text-body font-bold text-surface">
          {copy.sensor.modeChip}
        </p>
        <SensorStatusCard />
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="text-body-lg font-bold text-ink">{copy.sensor.unavailableTitle}</h2>
          <p className="mt-1 text-body text-ink-soft">{copy.sensor.unavailableBody}</p>
        </section>
        <p className="text-center text-body text-ink-soft">{copy.app.disclaimer}</p>
      </div>
    )
  }

  if (openAlertId) return <AlertDetail alertId={openAlertId} onBack={() => setOpenAlertId(null)} />

  const { status, alert, handling } = getCurrentStatus(alerts)

  // Darurat: telepon langsung dari kartu status. Dicatat sebagai respons (alert -> "dicek"),
  // sama seperti menelepon dari halaman detail.
  const callElder = (id) => {
    respond(id, 'callElder')
    setCalling(true)
  }
  const today = dailyMetrics[dailyMetrics.length - 1]
  const minutesSinceActivity = minutesBetween(aktivitasTerakhir, demoNow)

  return (
    <div ref={topRef} className="flex flex-col gap-6 px-gutter pb-8 pt-6">
      <ProfileHeader profile={elderProfile} />

      {/* Saat dijeda, status "Normal" menyesatkan, jadi diganti kartu jeda. Alert yang
          belum ditanggapi tetap ditampilkan supaya tidak tersembunyi. */}
      {monitoringPaused && <PausedCard />}
      {(!monitoringPaused || status !== 'normal') && (
        <StatusCard status={status} alert={alert} handling={handling} onAct={setOpenAlertId} onCall={callElder} />
      )}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-title text-ink">{copy.dashboard.todaySummary}</h2>
          {/* Provenance: kapan & dari mana data berasal, dekat dengan angkanya (Gestalt proximity) */}
          <p className="text-body text-ink-soft">{copy.dashboard.provenance(formatTime(demoNow))}</p>
        </div>
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
        <button
          type="button"
          onClick={simulateWaspada}
          className="mt-2 flex min-h-tap items-center gap-2 rounded-btn border-2 border-ink px-5 text-body-lg font-bold text-ink"
        >
          <Icon name="bell" className="h-5 w-5" />
          {copy.dashboard.simulate.waspadaButton}
        </button>
        <p className="text-center text-body text-ink-soft">{copy.dashboard.simulate.waspadaHint}</p>
      </div>

      {calling && (
        <CallModal name={elderProfile.nama} number={elderProfile.telepon} onClose={() => setCalling(false)} />
      )}
    </div>
  )
}
