import { copy } from '../data/copy.js'
import { STATUS_STYLES, levelToStatus } from '../lib/status.js'

// Badge tingkat alert (info/waspada/darurat) dengan warna status yang sama seperti Dashboard.
export default function LevelBadge({ tingkat }) {
  const style = STATUS_STYLES[levelToStatus[tingkat]]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-body font-bold ${style.badge}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {copy.alertLevel[tingkat]}
    </span>
  )
}
