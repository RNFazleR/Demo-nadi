import { copy } from '../data/copy.js'
import { useSensor } from '../state/SensorContext.jsx'
import { describeSensor } from '../lib/sensor.js'
import Icon from './Icon.jsx'

// Satu baris keadaan penghubung sensor untuk setup/pengaturan HP Pusat. Netral (bukan warna
// status) dan memakai teks yang sama dengan kartu sensor di Beranda.
export default function DeviceStatus() {
  const { isLive, apiStatus, data } = useSensor()
  if (!isLive) return null
  const view = describeSensor(apiStatus, data)
  const text = copy.sensor.states[view.kind] ?? copy.sensor.states.error
  return (
    <div className="mt-3 flex items-start gap-3 rounded-chip bg-surface-muted p-3">
      <Icon name={view.isProblem ? 'wifiOff' : 'wifi'} className="mt-0.5 h-6 w-6 shrink-0 text-brand-700" />
      <div>
        <p aria-live="polite" className="text-body-lg font-bold text-ink">
          {text.title}
        </p>
        <p className="text-body text-ink-soft">{text.body}</p>
      </div>
    </div>
  )
}
