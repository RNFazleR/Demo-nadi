import { copy } from '../data/copy.js'
import { useSensor } from '../state/SensorContext.jsx'
import { describeSensor } from '../lib/sensor.js'
import { formatNumber, formatTimeSeconds } from '../lib/format.js'
import Icon from './Icon.jsx'

const t = copy.sensor

// Kartu status sensor langsung. Sengaja TIDAK memakai warna Normal/Waspada/Darurat:
// label gerak bukan status kesejahteraan dan tidak boleh langsung menjadi Darurat.
export default function SensorStatusCard() {
  const { apiStatus, data, apiUrl } = useSensor()
  const view = describeSensor(apiStatus, data)
  const text = t.states[view.kind] ?? t.states.error
  const icon = view.isProblem ? 'wifiOff' : view.kind === 'motion' ? 'pulse' : 'wifi'
  const pct = view.progress != null ? Math.round(view.progress * 100) : null

  return (
    <section className={`rounded-card border-2 p-5 shadow-raised ${view.isProblem ? 'border-ink-faint bg-surface-muted' : 'border-brand-100 bg-surface'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-body text-ink-soft">{t.cardTitle}</p>
        {view.isReplay && (
          <span className="rounded-full bg-ink px-3 py-0.5 text-body font-bold text-surface">{t.replayChip}</span>
        )}
      </div>

      {/* Hanya judul yang diumumkan pembaca layar (berubah saat keadaan berubah, bukan tiap detik) */}
      <div className="mt-3 flex items-start gap-3">
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${
            view.isProblem ? 'bg-ink text-surface' : view.kind === 'motion' ? 'bg-brand-700 text-surface' : 'bg-brand-50 text-brand-700'
          }`}
        >
          <Icon name={icon} className="h-7 w-7" strokeWidth={2.2} />
        </span>
        <h2 aria-live="polite" className="text-title text-ink">
          {text.title}
        </h2>
      </div>
      <p className="mt-2 text-body-lg text-ink">{text.body}</p>

      {view.isCalibrating && pct != null && (
        <div className="mt-3">
          <p className="text-body font-semibold text-ink">{t.progress(pct)}</p>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={t.progress(pct)}
            className="mt-1 h-3 overflow-hidden rounded-full bg-surface-sunken"
          >
            <div className="h-full rounded-full bg-brand-600 transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Waktu dari sumber data (penghubung), bukan jam demo */}
      {data && (
        <dl className="mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <div className="rounded-chip bg-surface-muted px-3 py-2">
            <dt className="text-body text-ink-soft">{t.lastMotion}</dt>
            <dd className="text-body-lg font-bold text-ink tabular-nums">
              {data.last_motion_at ? formatTimeSeconds(data.last_motion_at) : t.noMotionYet}
            </dd>
          </div>
          <div className="rounded-chip bg-surface-muted px-3 py-2">
            <dt className="text-body text-ink-soft">{t.lastUpdate}</dt>
            <dd className="text-body-lg font-bold text-ink tabular-nums">
              {data.received_at ? formatTimeSeconds(data.received_at) : t.noDataYet}
            </dd>
          </div>
        </dl>
      )}

      <TechnicalDetails data={data} apiUrl={apiUrl} />
    </section>
  )
}

function TechnicalDetails({ data, apiUrl }) {
  const tt = t.technical
  const num = (v, digits) => (v == null ? tt.empty : formatNumber(v, digits))
  const rows = [
    [tt.score, num(data?.motion_score, 3)],
    [tt.threshold, num(data?.motion_threshold, 3)],
    [tt.rssi, data?.rssi_dbm == null ? tt.empty : tt.rssiValue(data.rssi_dbm)],
    [tt.packets, num(data?.packets_in_window, 0)],
    [tt.dropped, num(data?.packets_dropped, 0)],
    [tt.invalid, num(data?.invalid_lines, 0)],
    [tt.port, data?.port ?? tt.empty],
    [tt.source, data ? (data.source === 'replay' ? tt.sourceReplay : tt.sourceLive) : tt.empty],
    [tt.api, apiUrl],
  ]
  if (data?.error) rows.push([tt.error, data.error])
  if (data?.device_log) rows.push([tt.deviceLog(data.device_log_at ? formatTimeSeconds(data.device_log_at) : tt.empty), data.device_log])

  return (
    <details className="group mt-4 rounded-chip border border-line">
      <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-2 px-3 text-body font-semibold text-ink">
        {tt.summary}
        <Icon name="chevronRight" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-90" strokeWidth={2.4} />
      </summary>
      <div className="border-t border-line px-3 py-2">
        <dl className="divide-y divide-line">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-wrap justify-between gap-x-3 py-1.5">
              <dt className="text-body text-ink-soft">{label}</dt>
              <dd className="break-all text-right text-body font-semibold text-ink tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-body text-ink-soft">{tt.note}</p>
      </div>
    </details>
  )
}
