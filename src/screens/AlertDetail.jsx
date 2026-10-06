import { useEffect, useRef, useState } from 'react'
import { copy } from '../data/copy.js'
import { elderProfile, dailyMetrics, kontakDarurat, demoNow } from '../data/dummy.js'
import { useAlerts } from '../state/AlertsContext.jsx'
import { STATUS_STYLES, levelToStatus } from '../lib/status.js'
import { compareDayToUsual } from '../lib/insights.js'
import { METRICS } from '../lib/metrics.js'
import { formatDateShort, formatRelativeDayTime, toDateKey } from '../lib/format.js'
import LevelBadge from '../components/LevelBadge.jsx'
import AlertStatusPill from '../components/AlertStatusPill.jsx'
import FeedbackNote from '../components/FeedbackNote.jsx'
import CallModal from '../components/CallModal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Icon from '../components/Icon.jsx'

const PRIMARY_BTN =
  'flex min-h-tap w-full items-center justify-center gap-2 rounded-btn bg-brand-600 px-4 text-body-lg font-bold text-surface transition-colors hover:bg-brand-700'
const SECONDARY_BTN =
  'flex min-h-tap w-full items-center justify-center gap-2 rounded-btn px-4 text-body-lg font-bold'

export default function AlertDetail({ alertId, onBack }) {
  const { alerts, responses, respond } = useAlerts()
  const [call, setCall] = useState(null) // { name, number } saat modal simulasi terbuka
  const [confirmEmergency, setConfirmEmergency] = useState(false)
  const topRef = useRef(null)

  // Buka detail dari atas (juga saat konten di-scroll di dalam PhoneFrame di laptop)
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start' })
  }, [alertId])

  const alert = alerts.find((a) => a.id === alertId)
  if (!alert) return null

  const style = STATUS_STYLES[levelToStatus[alert.tingkat]]
  const dateKey = toDateKey(alert.waktu)
  const comparisons = METRICS.map((m) => ({ ...m, result: compareDayToUsual(dailyMetrics, dateKey, m.field) }))
  const hasMetric = comparisons.some((c) => c.result)
  const responded = Boolean(responses[alert.id])

  const startCall = (action, contact) => {
    respond(alert.id, action)
    setCall(contact)
  }

  return (
    <div ref={topRef} className="flex flex-col gap-5 px-gutter pb-8 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 flex min-h-tap items-center gap-1 self-start rounded-btn px-2 text-body-lg font-semibold text-brand-600"
      >
        <Icon name="chevronLeft" className="h-5 w-5" strokeWidth={2.4} />
        {copy.alertDetail.back}
      </button>

      {/* Apa yang terdeteksi */}
      <section className={`rounded-card border-2 p-5 shadow-card ${style.card}`}>
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge tingkat={alert.tingkat} />
          <AlertStatusPill status={alert.status} />
        </div>
        <p className="mt-2 text-body text-ink-soft">
          {formatRelativeDayTime(alert.waktu, demoNow, copy.time)}
        </p>
        <h1 className="mt-4 text-title text-ink">{copy.alertDetail.detectedTitle}</h1>
        <p className="mt-1 text-body-lg text-ink">{alert.deskripsi}</p>
        <p className={`mt-3 text-body font-semibold ${style.text}`}>
          {copy.alertDetail.levelNote[alert.tingkat]}
        </p>
      </section>

      {/* Dibandingkan pola biasanya */}
      <section className="rounded-card bg-surface p-5 shadow-card">
        <h2 className="text-title text-ink">{copy.alertDetail.compareTitle}</h2>
        {hasMetric ? (
          <>
            <p className="mt-1 text-body text-ink-soft">
              {copy.alertDetail.compareSubtitle(formatDateShort(alert.waktu))}
            </p>
            <ul className="mt-4 divide-y divide-line">
              {comparisons.map(({ key, icon, display, result }) => {
                if (!result) return null
                const { shortLabel, withUnit } = copy.metrics[key]
                return (
                  <li key={key} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Icon name={icon} className="h-5 w-5 text-brand-600" />
                      <p className="text-body-lg font-semibold text-ink">{shortLabel}</p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="rounded-chip bg-surface-muted px-3 py-2">
                        <p className="text-body text-ink-soft">{copy.alertDetail.thatDay}</p>
                        <p className="text-title text-ink">{withUnit(display(result.value))}</p>
                      </div>
                      <div className="rounded-chip border border-line px-3 py-2">
                        <p className="text-body text-ink-soft">{copy.alertDetail.usual}</p>
                        <p className="text-title text-ink-soft">{withUnit(display(result.usual))}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-body font-semibold text-ink">
                      {copy.comparison[key][result.trend]}
                    </p>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-body text-ink-soft">{copy.alertDetail.noMetric}</p>
        )}
      </section>

      {/* Tindak lanjut: info tidak punya tombol aksi */}
      {alert.tingkat !== 'info' && (
        <section className="flex flex-col gap-3">
          <h2 className="text-title text-ink">{copy.alertDetail.actionsTitle}</h2>

          {alert.tingkat === 'waspada' && alert.status === 'baru' && (
            <button type="button" onClick={() => respond(alert.id, 'markChecked')} className={PRIMARY_BTN}>
              <Icon name="check" strokeWidth={2.4} />
              {copy.actions.markChecked}
            </button>
          )}

          {alert.tingkat === 'darurat' && (
            <>
              <button
                type="button"
                onClick={() =>
                  startCall('callElder', { name: elderProfile.nama, number: elderProfile.telepon })
                }
                className={PRIMARY_BTN}
              >
                <Icon name="phone" />
                {copy.actions.callElder(elderProfile.nama)}
              </button>
              <button
                type="button"
                onClick={() => setConfirmEmergency(true)}
                className={`${SECONDARY_BTN} ${STATUS_STYLES.darurat.badge}`}
              >
                <Icon name="siren" />
                {copy.actions.callEmergency}
              </button>
            </>
          )}

          {responded ? (
            <FeedbackNote />
          ) : (
            alert.status !== 'baru' && (
              <p className="rounded-card bg-surface-muted p-4 text-body text-ink-soft">
                {copy.actions.alreadyHandled}
              </p>
            )
          )}
        </section>
      )}

      {/* Error prevention: panggilan 112 dikonfirmasi dulu supaya tidak terpanggil karena salah ketuk */}
      {confirmEmergency && (
        <ConfirmDialog
          title={copy.actions.confirmEmergency.title(kontakDarurat.nomor)}
          body={copy.actions.confirmEmergency.body}
          confirmLabel={copy.actions.confirmEmergency.confirm(kontakDarurat.nomor)}
          cancelLabel={copy.actions.confirmEmergency.cancel}
          confirmClassName={STATUS_STYLES.darurat.solid}
          onCancel={() => setConfirmEmergency(false)}
          onConfirm={() => {
            setConfirmEmergency(false)
            startCall('callEmergency', { name: kontakDarurat.nama, number: kontakDarurat.nomor })
          }}
        />
      )}

      {call && <CallModal name={call.name} number={call.number} onClose={() => setCall(null)} />}
    </div>
  )
}
