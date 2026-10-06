import { copy } from '../data/copy.js'
import Icon from './Icon.jsx'

// Status tindak lanjut (baru/dicek/selesai). Sengaja tidak memakai warna status.
const STYLES = {
  baru: { className: 'bg-accent-700 text-surface', icon: null }, // 4,78:1
  dicek: { className: 'bg-surface-muted text-ink-soft', icon: 'eye' },
  selesai: { className: 'bg-surface-muted text-ink-soft', icon: 'check' },
}

export default function AlertStatusPill({ status }) {
  const { className, icon } = STYLES[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-body font-semibold ${className}`}>
      {icon && <Icon name={icon} className="h-4 w-4" strokeWidth={2.4} />}
      {copy.alertStatus[status]}
    </span>
  )
}
