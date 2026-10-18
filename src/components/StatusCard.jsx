import { copy } from '../data/copy.js'
import { demoNow, elderProfile } from '../data/dummy.js'
import { STATUS_STYLES } from '../lib/status.js'
import { formatRelativeDayTime, formatTime } from '../lib/format.js'
import Icon from './Icon.jsx'
import LevelBadge from './LevelBadge.jsx'
import AlertStatusPill from './AlertStatusPill.jsx'

const STATUS_ICON = { waspada: 'alert', darurat: 'alert' }
const BTN = 'flex min-h-tap w-full items-center justify-center gap-2 rounded-btn px-4 text-body-lg font-bold'

// Kartu status di Dashboard.
// Normal: ringkas (badge + satu kalimat) supaya ringkasan metrik cepat terlihat.
// Waspada/Darurat baru: lengkap dan paling menonjol (ikon, judul, penjelasan, jam).
// Sedang dicek (`handling`): alert sudah ditanggapi tapi belum selesai; netral, tapi tetap
// menyebut tingkat alert-nya supaya tidak terbaca sebagai "Normal".
export default function StatusCard({ status, alert, handling, onAct, onCall, actionRef }) {
  const style = STATUS_STYLES[status]
  const text = copy.status[status]

  if (handling) {
    return (
      <section aria-live="polite" className="rounded-card border-2 border-line bg-surface p-5 shadow-raised">
        <div className="flex items-center justify-between gap-3">
          <p className="text-body text-ink-soft">{copy.dashboard.statusCardTitle}</p>
          <AlertStatusPill status={alert.status} />
        </div>

        <div className="mt-4 flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-muted text-ink">
            <Icon name="eye" className="h-7 w-7" strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="text-title text-ink">{copy.dashboard.handling.title}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-body text-ink-soft">
              <LevelBadge tingkat={alert.tingkat} />
              {formatRelativeDayTime(alert.waktu, demoNow, copy.time)}
            </p>
          </div>
        </div>

        <p className="mt-3 text-body-lg text-ink">{alert.deskripsi}</p>
        <p className="mt-2 text-body text-ink-soft">{copy.dashboard.handling.hint}</p>

        <button
          ref={actionRef}
          type="button"
          onClick={() => onAct(alert.id)}
          className={`${BTN} mt-4 border-2 border-ink text-ink`}
        >
          {copy.dashboard.statusAction}
          <Icon name="chevronRight" className="h-5 w-5" strokeWidth={2.6} />
        </button>
      </section>
    )
  }

  if (status === 'normal') {
    return (
      <section aria-live="polite" className={`rounded-card border-2 p-4 shadow-card ${style.card}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-body text-ink-soft">{copy.dashboard.statusCardTitle}</p>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-body font-bold ${style.solid}`}>
            <Icon name="check" className="h-4 w-4" strokeWidth={2.6} />
            {text.label}
          </span>
        </div>
        <p className="mt-2 text-body-lg text-ink">{alert ? alert.deskripsi : copy.dashboard.normalSentence}</p>
      </section>
    )
  }

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
              <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-surface opacity-75" />
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
        {alert.deskripsi}
      </p>

      <p className="mt-2 text-body text-ink-soft">{copy.dashboard.alertAt(formatTime(alert.waktu))}</p>

      {/* Hick + Fitts: satu langkah berikutnya yang direkomendasikan, besar & di dalam kartu.
          Darurat: langsung menelepon (tanpa harus membuka detail dulu); detail jadi pilihan kedua.
          `actionRef` (target fokus setelah modal panggilan ditutup) sengaja di "Lihat detail",
          bukan "Hubungi", supaya Enter yang tidak disengaja tidak langsung menelepon lagi. */}
      {status === 'darurat' ? (
        <>
          <button type="button" onClick={() => onCall(alert.id)} className={`${BTN} mt-4 ${style.solid}`}>
            <Icon name="phone" className="h-5 w-5" />
            {copy.actions.callElder(elderProfile.nama)}
          </button>
          <button
            ref={actionRef}
            type="button"
            onClick={() => onAct(alert.id)}
            className={`${BTN} mt-3 border-2 border-line bg-surface ${style.text}`}
          >
            {copy.dashboard.statusDetail}
            <Icon name="chevronRight" className="h-5 w-5" strokeWidth={2.6} />
          </button>
        </>
      ) : (
        <button ref={actionRef} type="button" onClick={() => onAct(alert.id)} className={`${BTN} mt-4 ${style.solid}`}>
          {copy.dashboard.statusAction}
          <Icon name="chevronRight" className="h-5 w-5" strokeWidth={2.6} />
        </button>
      )}
    </section>
  )
}
