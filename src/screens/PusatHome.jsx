import { useRef, useState } from 'react'
import { copy } from '../data/copy.js'
import { useSensor } from '../state/SensorContext.jsx'
import { describeSensor } from '../lib/sensor.js'
import Icon from '../components/Icon.jsx'
import PasswordDialog from '../components/PasswordDialog.jsx'

const t = copy.pusatHome
const HOLD_MS = 800

// HP Pusat, mode lansia: aturan layar lansia (teks >= 24px, latar putih, tanpa navigasi).
// Status perangkat memakai teks & ikon netral, bukan warna status (bukan status kesejahteraan).
export default function PusatHome({ lansia, onShowQuestion, onOpenSettings }) {
  const { isLive, apiStatus, data } = useSensor()
  const [unlocking, setUnlocking] = useState(false)
  const [holding, setHolding] = useState(false)
  const holdTimer = useRef(null)

  const device = !isLive ? 'demo' : describeSensor(apiStatus, data).isProblem ? 'problem' : 'live'
  const deviceIcon = { live: 'wifi', demo: 'sparkle', problem: 'wifiOff' }[device]

  // Pengaturan untuk keluarga: tekan & tahan (supaya orang tua tidak tersasar), lalu kata sandi.
  // Lewat keyboard (klik tanpa pointer, detail === 0) langsung ke dialog kata sandi.
  const startHold = () => {
    setHolding(true)
    holdTimer.current = setTimeout(() => {
      setHolding(false)
      setUnlocking(true)
    }, HOLD_MS)
  }
  const cancelHold = () => {
    clearTimeout(holdTimer.current)
    setHolding(false)
  }

  return (
    <div className="flex flex-1 flex-col bg-surface px-6 pb-8 pt-16 text-ink">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <img src="favicon.svg" alt="" className="h-24 w-24 rounded-card shadow-card" />
        <h1 className="text-elder-title">{t.greeting(lansia.panggilan)}</h1>
        <p className="text-elder-body">{t.body}</p>
        <p className="flex items-center gap-3 text-elder-body text-ink-soft">
          <Icon name={deviceIcon} className="h-8 w-8 shrink-0 text-brand-700" />
          {t.device[device]}
        </p>
      </div>

      {/* Kontrol demo, bukan bagian dari layar lansia yang sebenarnya */}
      <div className="mt-8 flex flex-col items-center gap-2 border-t border-dashed border-line pt-5">
        <span className="rounded-full bg-surface-muted px-3 py-0.5 text-body text-ink-soft">{t.demoTag}</span>
        <button
          type="button"
          onClick={onShowQuestion}
          className="flex min-h-tap w-full items-center justify-center gap-2 rounded-btn border-2 border-brand-500 px-4 text-body-lg font-bold text-brand-700"
        >
          <Icon name="bell" className="h-5 w-5" />
          {t.showQuestion}
        </button>
      </div>

      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => {
          if (e.detail === 0) setUnlocking(true)
        }}
        aria-describedby="pusat-settings-hint"
        className={`mt-6 flex min-h-tap w-full select-none flex-col items-center justify-center rounded-btn px-4 py-2 text-elder-body text-ink-soft transition-colors ${
          holding ? 'bg-surface-sunken' : ''
        }`}
      >
        <span className="flex items-center gap-2">
          <Icon name="settings" className="h-7 w-7" />
          {t.settings}
        </span>
        <span id="pusat-settings-hint" className="text-body text-ink-soft">
          {t.settingsHint}
        </span>
      </button>

      {unlocking && (
        <PasswordDialog
          onCancel={() => setUnlocking(false)}
          onUnlock={() => {
            setUnlocking(false)
            onOpenSettings()
          }}
        />
      )}
    </div>
  )
}
