import { useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import tw from '../../tailwind.config.js'
import { copy } from '../data/copy.js'
import { dailyMetrics } from '../data/dummy.js'
import { useAlerts } from '../state/AlertsContext.jsx'
import { useSensor } from '../state/SensorContext.jsx'
import LiveModeNotice from '../components/LiveModeNotice.jsx'
import { METRICS } from '../lib/metrics.js'
import { STATUS_STYLES } from '../lib/status.js'
import { compareDayToUsual, isDeviation, sortNewestFirst } from '../lib/insights.js'
import { formatDateShort, formatDayDate, formatNumber, formatWeekdayShort, toDateKey } from '../lib/format.js'
import AlertListItem from '../components/AlertListItem.jsx'
import Icon from '../components/Icon.jsx'
import AlertDetail from './AlertDetail.jsx'

const colors = tw.theme.extend.colors
// Lebar sumbu Y & margin kanan plot. Deretan tombol hari di bawah grafik memakai padding
// yang sama, supaya tiap tombol sejajar dengan batangnya.
const Y_AXIS_WIDTH = 32
const PLOT_RIGHT = 4
// Gaya "hari terpilih", dipakai di tombol hari DAN chip di kartu detail supaya jelas berhubungan
const SELECTED_DAY = 'bg-brand-700 font-extrabold text-surface'
const CHART = {
  bar: colors.brand[500],
  deviation: STATUS_STYLES.waspada.hex,
  deviationMark: STATUS_STYLES.waspada.strongHex, // latar "!" putih, 4,96:1
  selectedStroke: colors.ink.DEFAULT,
  grid: colors.line,
  axisText: colors.ink.soft,
  baseline: colors.ink.soft,
}

// Tab Riwayat: grafik 7 hari per metrik + detail hari yang dipilih.
export default function History() {
  const { alerts } = useAlerts()
  const { isLive } = useSensor()
  const [metricKey, setMetricKey] = useState('sleep')
  const [selectedDate, setSelectedDate] = useState(dailyMetrics[dailyMetrics.length - 1].tanggal)
  const [openAlertId, setOpenAlertId] = useState(null)
  const tabRefs = useRef([])

  if (isLive) return <LiveModeNotice pageTitle={copy.history.title} />
  if (openAlertId) return <AlertDetail alertId={openAlertId} onBack={() => setOpenAlertId(null)} />

  const metric = METRICS.find((m) => m.key === metricKey)
  const { withUnit } = copy.metrics[metricKey]

  // Tiap hari dibandingkan dengan rata-rata hari LAIN (tanpa hari itu sendiri)
  const days = dailyMetrics.map((d) => {
    const result = compareDayToUsual(dailyMetrics, d.tanggal, metric.field)
    return {
      date: d.tanggal,
      value: metric.chartValue(d[metric.field]),
      result,
      deviates: isDeviation(result, metric.deviation),
    }
  })
  const selected = days.find((d) => d.date === selectedDate)
  // Garis "Pola biasanya" = baseline untuk hari yang sedang dipilih
  const baseline = metric.chartValue(selected.result.usual)
  const yTicks = niceTicks(Math.max(...days.map((d) => d.value), baseline) * 1.25)

  const dayAlerts = sortNewestFirst(alerts.filter((a) => toDateKey(a.waktu) === selectedDate))

  // Navigasi keyboard tab metrik
  function onTabKeyDown(e) {
    const current = METRICS.findIndex((m) => m.key === metricKey)
    const last = METRICS.length - 1
    const next = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    }[e.key]
    if (next === undefined) return
    e.preventDefault()
    setMetricKey(METRICS[next].key)
    tabRefs.current[next]?.focus()
  }

  const selectAt = (index) => {
    if (index != null && days[index]) setSelectedDate(days[index].date)
  }

  return (
    <div className="flex flex-col gap-5 px-gutter pb-8 pt-6">
      <header>
        <h1 className="text-heading text-ink">{copy.history.title}</h1>
        <p className="text-body text-ink-soft">{copy.history.subtitle}</p>
      </header>

      {/* Pilihan metrik = tab (pola WAI-ARIA, aktivasi otomatis): panah kiri/kanan pindah
          metrik, Home/End ke ujung; hanya tab aktif yang ada di urutan Tab (roving tabindex). */}
      <div
        role="tablist"
        aria-label={copy.history.metricTabsAria}
        onKeyDown={onTabKeyDown}
        className="grid grid-cols-3 gap-1 rounded-btn bg-surface-muted p-1"
      >
        {METRICS.map((m, i) => {
          const active = m.key === metricKey
          return (
            <button
              key={m.key}
              ref={(el) => (tabRefs.current[i] = el)}
              type="button"
              role="tab"
              id={`metric-tab-${m.key}`}
              aria-selected={active}
              aria-controls="metric-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => setMetricKey(m.key)}
              className={`min-h-tap rounded-chip px-1 text-body leading-tight transition-colors ${
                active ? 'bg-surface font-bold text-brand-700 shadow-card' : 'font-semibold text-ink-soft'
              }`}
            >
              {copy.history.metricTabs[m.key]}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id="metric-panel"
        aria-labelledby={`metric-tab-${metricKey}`}
        className="flex flex-col gap-5"
      >
        <section className="rounded-card bg-surface p-4 shadow-card">
          <p className="text-body text-ink">{copy.history.intro}</p>

          {/* Grafik hanya visual (disembunyikan dari pembaca layar); informasi & pemilihan hari
              yang bisa diakses keyboard/pembaca layar ada di deretan tombol hari di bawahnya. */}
          <div className="mt-4 h-52" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={days}
                accessibilityLayer={false}
                margin={{ top: 8, right: PLOT_RIGHT, bottom: 10, left: 0 }}
                barCategoryGap="22%"
                onClick={(state) => selectAt(state?.activeTooltipIndex != null ? Number(state.activeTooltipIndex) : null)}
              >
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="date" tick={false} tickLine={false} axisLine={{ stroke: CHART.grid }} height={1} />
                <YAxis
                  width={Y_AXIS_WIDTH}
                  domain={[0, yTicks[yTicks.length - 1]]}
                  ticks={yTicks}
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatNumber(v, 0)}
                  tick={{ fill: CHART.axisText, fontSize: 14 }}
                />
                <Tooltip
                  cursor={{ fill: colors.surface.muted }}
                  content={<ChartTooltip metric={metric} withUnit={withUnit} />}
                />
                <ReferenceLine
                  y={baseline}
                  stroke={CHART.baseline}
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                />
                {/* Tanpa animasi: penanda "!" dari LabelList baru dirender setelah animasi selesai,
                    jadi dengan animasi hari yang menyimpang sempat hanya ditandai warna. */}
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                  onClick={(_, index) => selectAt(index)}
                  className="cursor-pointer"
                >
                  {days.map((d) => (
                    <Cell
                      key={d.date}
                      fill={d.deviates ? CHART.deviation : CHART.bar}
                      stroke={d.date === selectedDate ? CHART.selectedStroke : 'none'}
                      strokeWidth={2}
                    />
                  ))}
                  {/* Penanda tambahan selain warna: lingkaran "!" di atas batang yang menyimpang */}
                  <LabelList dataKey="deviates" content={<DeviationMarker />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tombol hari = label sumbu X. Bisa difokus (Tab) dan dipilih (Enter/Spasi). */}
          <div
            role="group"
            aria-label={copy.history.chartAria(copy.history.metricTabs[metricKey])}
            className="grid grid-cols-7"
            style={{ paddingLeft: Y_AXIS_WIDTH, paddingRight: PLOT_RIGHT }}
          >
            {days.map((d) => {
              const isSelected = d.date === selectedDate
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelectedDate(d.date)}
                  aria-pressed={isSelected}
                  aria-controls="day-detail"
                  aria-label={copy.history.dayButtonLabel(
                    formatDayDate(d.date),
                    withUnit(metric.display(d.result.value)),
                    d.deviates ? copy.history.deviationBadge : null,
                  )}
                  className={`flex min-h-tap flex-col items-center justify-center rounded-chip text-caption leading-tight transition-colors ${
                    isSelected ? SELECTED_DAY : 'font-semibold text-ink-soft hover:bg-surface-muted'
                  }`}
                >
                  <span>{formatWeekdayShort(d.date)}</span>
                  <span>{formatDateShort(d.date).split(' ')[0]}</span>
                </button>
              )
            })}
          </div>

          {/* Legenda */}
          <ul className="mt-3 flex flex-col gap-1.5">
            <li className="flex items-center gap-2 text-body text-ink-soft">
              <svg width="24" height="8" aria-hidden="true">
                <line x1="0" y1="4" x2="24" y2="4" stroke={CHART.baseline} strokeWidth="2" strokeDasharray="6 4" />
              </svg>
              {copy.history.legendBaseline(
                formatDateShort(selected.date),
                withUnit(metric.display(selected.result.usual)),
              )}
            </li>
            <li className="pl-8 text-body text-ink-soft">
              {copy.history.baselineNote(dailyMetrics.length - 1, formatDateShort(selected.date))}
            </li>
            <li className="flex items-center gap-2 text-body text-ink-soft">
              <span
                aria-hidden="true"
                className={`grid h-5 w-5 place-items-center rounded-full text-caption font-extrabold ${STATUS_STYLES.waspada.solid}`}
              >
                {copy.history.deviationMark}
              </span>
              {copy.history.legendDeviation}
            </li>
          </ul>
          <p className="mt-3 text-body text-ink-soft">{copy.history.tapHint}</p>

        </section>

        <DayDetail
          day={selected}
          metric={metric}
          dayAlerts={dayAlerts}
          onOpenAlert={setOpenAlertId}
        />
      </div>
    </div>
  )
}

// Tick sumbu Y berkelipatan bulat (1, 2, 5, 10, 20, ...) dengan maksimal ~5 garis
function niceTicks(max) {
  const step = [1, 2, 5, 10, 20, 25, 50].find((s) => max / s <= 5) ?? 100
  const top = Math.ceil(max / step) * step
  return Array.from({ length: top / step + 1 }, (_, i) => i * step)
}

// Kartu detail hari yang dipilih
function DayDetail({ day, metric, dayAlerts, onOpenAlert }) {
  const { key, display } = metric
  const { shortLabel, withUnit, definition } = copy.metrics[key]
  const { value, usual, trend } = day.result
  const valueText = withUnit(display(value))
  const usualText = withUnit(display(usual))
  const diffText = copy.history.diffWithUnit[key](display(Math.abs(value - usual)))

  return (
    <section
      id="day-detail"
      aria-labelledby="day-detail-title"
      aria-live="polite"
      className="rounded-card border-2 border-brand-700 bg-surface p-5 shadow-card"
    >
      <span className={`inline-block rounded-chip px-2.5 py-0.5 text-body ${SELECTED_DAY}`}>
        {copy.history.selectedDayChip(formatWeekdayShort(day.date), formatDateShort(day.date))}
      </span>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h2 id="day-detail-title" className="text-title text-ink">{formatDayDate(day.date)}</h2>
        {day.deviates && (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-body font-bold ${STATUS_STYLES.waspada.badge}`}>
            <Icon name="alert" className="h-4 w-4" strokeWidth={2.4} />
            {copy.history.deviationBadge}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Icon name={metric.icon} className="h-5 w-5 text-brand-600" />
        <p className="text-body-lg font-semibold text-ink">{shortLabel}</p>
      </div>
      <p className="mt-1 text-body text-ink-soft">{definition}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-chip bg-surface-muted px-3 py-2">
          <p className="text-body text-ink-soft">{copy.alertDetail.thatDay}</p>
          <p className="text-title text-ink">{valueText}</p>
        </div>
        <div className="rounded-chip border border-line px-3 py-2">
          <p className="text-body text-ink-soft">{copy.alertDetail.usual}</p>
          <p className="text-title text-ink-soft">{usualText}</p>
        </div>
      </div>
      <p className="mt-3 text-body-lg font-semibold text-ink">
        {copy.history.sentence[key][trend](valueText, usualText, diffText)}
      </p>

      <h3 className="mt-5 text-body-lg font-bold text-ink">{copy.history.alertsTitle}</h3>
      {dayAlerts.length === 0 ? (
        <p className="mt-1 text-body text-ink-soft">{copy.history.noAlerts}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-3">
          {dayAlerts.map((a) => (
            <li key={a.id}>
              <AlertListItem alert={a} onOpen={onOpenAlert} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function DeviationMarker({ x, y, width, value }) {
  if (!value) return null
  const cx = x + width / 2
  const cy = y - 14
  return (
    <g aria-hidden="true">
      <circle cx={cx} cy={cy} r={10} fill={CHART.deviationMark} stroke={colors.surface.DEFAULT} strokeWidth={2} />
      <text x={cx} y={cy} dy={5} textAnchor="middle" fill={colors.surface.DEFAULT} fontSize={14} fontWeight={800}>
        {copy.history.deviationMark}
      </text>
    </g>
  )
}

function ChartTooltip({ active, payload, metric, withUnit }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-chip border border-line bg-surface px-3 py-2 shadow-raised">
      <p className="text-body font-bold text-ink">{formatDayDate(d.date)}</p>
      <p className="text-body text-ink">{withUnit(metric.display(d.result.value))}</p>
      {d.deviates && <p className={`text-body font-semibold ${STATUS_STYLES.waspada.text}`}>{copy.history.deviationBadge}</p>}
    </div>
  )
}
