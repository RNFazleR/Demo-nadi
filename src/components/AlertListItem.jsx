import { copy } from '../data/copy.js'
import { demoNow } from '../data/dummy.js'
import { STATUS_STYLES, levelToStatus } from '../lib/status.js'
import { formatRelativeDayTime } from '../lib/format.js'
import LevelBadge from './LevelBadge.jsx'
import AlertStatusPill from './AlertStatusPill.jsx'
import Icon from './Icon.jsx'

// Satu baris di daftar Notifikasi. Alert "baru" diberi latar warna status + garis tebal.
export default function AlertListItem({ alert, onOpen }) {
  const isNew = alert.status === 'baru'
  const style = STATUS_STYLES[levelToStatus[alert.tingkat]]

  return (
    <button
      type="button"
      onClick={() => onOpen(alert.id)}
      className={`flex w-full items-start gap-3 rounded-card p-4 text-left transition-transform active:scale-[0.99] ${
        isNew ? `border-2 shadow-raised ${style.card}` : 'border border-line bg-surface shadow-card'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge tingkat={alert.tingkat} />
          <AlertStatusPill status={alert.status} />
        </div>
        <p className={`mt-2 line-clamp-2 text-body ${isNew ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
          {alert.deskripsi}
        </p>
        <p className="mt-1 text-body text-ink-soft">
          {formatRelativeDayTime(alert.waktu, demoNow, copy.time)}
        </p>
      </div>
      <Icon name="chevronRight" className="mt-1 h-5 w-5 shrink-0 text-ink-faint" />
    </button>
  )
}
