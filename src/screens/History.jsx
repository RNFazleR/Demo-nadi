import { useState } from 'react'
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
import { METRICS } from '../lib/metrics.js'
import { STATUS_STYLES } from '../lib/status.js'
import { compareDayToUsual, isDeviation, sortNewestFirst } from '../lib/insights.js'
import { formatDateShort, formatDayDate, formatNumber, formatWeekdayShort, toDateKey } from '../lib/format.js'
import AlertListItem from '../components/AlertListItem.jsx'
import Icon from '../components/Icon.jsx'
import AlertDetail from './AlertDetail.jsx'

const colors = tw.theme.extend.colors
const CHART = {
  bar: colors.brand[500],
  deviation: STATUS_STYLES.waspada.hex,
  selectedStroke: colors.ink.DEFAULT,
  grid: colors.line,
  axisText: colors.ink.soft,
  baseline: colors.ink.soft,
}

// Tab Riwayat: grafik 7 hari per metrik + detail hari yang dipilih.
export default function History() {
  const { alerts } = useAlerts()
  const [metricKey, setMetricKey] = useState('sleep')
  const [selectedDate, setSelectedDate] = useState(dailyMetrics[dailyMetrics.length - 1].tanggal)
  const [openAlertId, setOpenAlertId] = useState(null)

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

  const selectAt = (index) => {
    if (index != null && days[index]) setSelectedDate(days[index].date)
  }

  return (
    <div className="flex flex-col gap-5 px-gutter pb-8 pt-6">
      <header>
        <h1 className="text-heading text-ink">{copy.history.title}</h1>
        <p className="text-body text-ink-soft">{copy.history.subtitle}</p>
      </header>

      {/* Pilihan metrik */}
      <div role="tablist" aria-label={copy.history.metricTabsAria} className="grid grid-cols-3 gap-1 rounded-btn bg-surface-muted p-1">
        {METRICS.map((m) => {
          const active = m.key === metricKey
          return (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={active}
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

      <section className="rounded-card bg-surface p-4 shadow-card">
        <p className="text-body text-ink">{copy.history.intro}</p>

        <div className="mt-4 h-60" role="img" aria-label={copy.history.chartAria(copy.history.metricTabs[metricKey])}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={days}
              margin={{ top: 8, right: 4, bottom: 0, left: -16 }}
              barCategoryGap="22%"
              onClick={(state) => selectAt(state?.activeTooltipIndex != null ? Number(state.activeTooltipIndex) : null)}
            >
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: CHART.grid }}
                interval={0}
                height={44}
                tick={<DayTick selectedDate={selectedDate} />}
              />
              <YAxis
                domain={[0, yTicks[yTicks.length - 1]]}
                ticks={yTicks}
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

        {/* Legenda */}
        <ul className="mt-3 flex flex-col gap-1.5">
          <li className="flex items-center gap-2 text-body text-ink-soft">
            <svg width="24" height="8" aria-hidden="true">
              <line x1="0" y1="4" x2="24" y2="4" stroke={CHART.baseline} strokeWidth="2" strokeDasharray="6 4" />
            </svg>
            {copy.history.legendBaseline(withUnit(metric.display(selected.result.usual)))}
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

        {/* Versi tabel untuk pembaca layar */}
        <div className="sr-only">
          <table>
            <caption>{copy.history.chartAria(copy.history.metricTabs[metricKey])}</caption>
            <tbody>
              {days.map((d) => (
                <tr key={d.date}>
                  <th scope="row">{formatDayDate(d.date)}</th>
                  <td>{withUnit(metric.display(d.result.value))}</td>
                  <td>{d.deviates ? copy.history.deviationBadge : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DayDetail
        day={selected}
        metric={metric}
        dayAlerts={dayAlerts}
        onOpenAlert={setOpenAlertId}
      />
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
  const { shortLabel, withUnit } = copy.metrics[key]
  const { value, usual, trend } = day.result
  const valueText = withUnit(display(value))
  const usualText = withUnit(display(usual))
  const diffText = copy.history.diffWithUnit[key](display(Math.abs(value - usual)))

  return (
    <section className="rounded-card bg-surface p-5 shadow-card" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-title text-ink">{formatDayDate(day.date)}</h2>
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

// Label sumbu X: nama hari singkat + tanggal; hari terpilih ditebalkan
function DayTick({ x, y, payload, selectedDate }) {
  const isSelected = payload.value === selectedDate
  const fill = isSelected ? CHART.selectedStroke : CHART.axisText
  const weight = isSelected ? 800 : 600
  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={16} textAnchor="middle" fill={fill} fontSize={14} fontWeight={weight}>
        {formatWeekdayShort(payload.value)}
      </text>
      <text dy={34} textAnchor="middle" fill={fill} fontSize={14} fontWeight={weight}>
        {formatDateShort(payload.value).split(' ')[0]}
      </text>
    </g>
  )
}

function DeviationMarker({ x, y, width, value }) {
  if (!value) return null
  const cx = x + width / 2
  const cy = y - 14
  return (
    <g aria-hidden="true">
      <circle cx={cx} cy={cy} r={10} fill={CHART.deviation} stroke={colors.surface.DEFAULT} strokeWidth={2} />
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
