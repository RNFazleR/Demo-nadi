import { useCallback, useEffect, useRef, useState } from 'react'
import { copy } from '../data/copy.js'
import { elderProfile } from '../data/dummy.js'
import { useAlerts } from '../state/AlertsContext.jsx'
import { STATUS_STYLES } from '../lib/status.js'
import Icon from '../components/Icon.jsx'

// Untuk demo cukup 20 detik. Di produk asli waktunya jauh lebih panjang
// (mis. beberapa menit) supaya lansia tidak terburu-buru menjawab.
const COUNTDOWN_SECONDS = 20

// Hasil konfirmasi -> AlertEvent yang dibuat untuk keluarga
const OUTCOMES = {
  ok: { tingkat: 'info', status: 'selesai', deskripsi: () => copy.elderCheck.generated.ok(elderProfile.nama) },
  help: { tingkat: 'darurat', status: 'baru', deskripsi: () => copy.elderCheck.generated.help(elderProfile.nama) },
  timeout: {
    tingkat: 'darurat',
    status: 'baru',
    deskripsi: () => copy.elderCheck.generated.timeout(elderProfile.nama, COUNTDOWN_SECONDS),
  },
}

// Ring hitung mundur (SVG)
const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Layar di HP lansia: teks sangat besar, satu pertanyaan, dua tombol, tanpa navigasi.
export default function ElderCheck({ onExit }) {
  const { addAlert } = useAlerts()
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS)
  const [outcome, setOutcome] = useState(null) // 'ok' | 'help' | 'timeout'
  const resolved = useRef(false)

  const resolve = useCallback(
    (key) => {
      if (resolved.current) return
      resolved.current = true
      const { tingkat, status, deskripsi } = OUTCOMES[key]
      addAlert({ tingkat, status, deskripsi: deskripsi() })
      setOutcome(key)
    },
    [addAlert],
  )

  // Hitung mundur dari waktu yang benar-benar berlalu (bukan jumlah tick), supaya tetap
  // tepat 20 detik walau browser memperlambat timer. Berhenti begitu ada jawaban.
  useEffect(() => {
    if (outcome) return
    const start = performance.now()
    const id = setInterval(() => {
      const left = Math.max(0, COUNTDOWN_SECONDS - Math.floor((performance.now() - start) / 1000))
      setRemaining(left)
      if (left === 0) {
        clearInterval(id)
        resolve('timeout')
      }
    }, 250)
    return () => clearInterval(id)
  }, [outcome, resolve])

  if (outcome) {
    const text = outcome === 'ok' ? copy.elderCheck.result.ok : copy.elderCheck.result.help
    const title = typeof text.title === 'function' ? text.title(elderProfile.panggilan) : text.title
    return (
      <div className="flex flex-1 flex-col bg-surface px-6 pb-8 pt-16 text-ink">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <span className="grid h-28 w-28 place-items-center rounded-full bg-brand-700 text-surface">
            <Icon name={outcome === 'ok' ? 'check' : 'phone'} className="h-14 w-14" strokeWidth={2.6} />
          </span>
          <h1 className="text-elder-title">{title}</h1>
          <p className="text-elder-body text-ink">{text.body}</p>
        </div>

        {/* Kontrol demo, bukan bagian dari layar lansia yang sebenarnya */}
        <div className="mt-8 flex flex-col items-center gap-2 border-t border-dashed border-line pt-5">
          <span className="rounded-full bg-surface-muted px-3 py-0.5 text-body text-ink-soft">
            {copy.elderCheck.demoTag}
          </span>
          <button
            type="button"
            onClick={onExit}
            className="flex min-h-tap w-full items-center justify-center gap-2 rounded-btn border-2 border-brand-500 px-4 text-body-lg font-bold text-brand-700"
          >
            <Icon name="chevronLeft" className="h-5 w-5" strokeWidth={2.4} />
            {copy.elderCheck.backToFamily}
          </button>
        </div>
      </div>
    )
  }

  const progress = remaining / COUNTDOWN_SECONDS

  return (
    <div className="flex flex-1 flex-col bg-surface px-6 pb-8 pt-12 text-ink">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div
          className="relative grid h-36 w-36 place-items-center"
          role="timer"
          aria-label={copy.elderCheck.countdownAria(remaining)}
        >
          <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="10" className="stroke-surface-sunken" />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              className="stroke-brand-600 transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-elder-count tabular-nums">{remaining}</span>
            <span className="text-elder-body text-ink-soft">{copy.elderCheck.secondsUnit}</span>
          </div>
        </div>

        <h1 className="text-elder-title">{copy.elderCheck.question(elderProfile.panggilan)}</h1>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <button
          type="button"
          onClick={() => resolve('ok')}
          className="flex min-h-tap-elder w-full items-center justify-center gap-3 rounded-card bg-brand-700 px-5 text-elder-btn text-surface active:bg-brand-600"
        >
          <Icon name="check" className="h-9 w-9 shrink-0" strokeWidth={3} />
          {copy.elderCheck.yes}
        </button>
        <button
          type="button"
          onClick={() => resolve('help')}
          className={`flex min-h-tap-elder w-full items-center justify-center gap-3 rounded-card px-5 text-elder-btn ${STATUS_STYLES.darurat.solid}`}
        >
          <Icon name="phone" className="h-9 w-9 shrink-0" strokeWidth={2.6} />
          {copy.elderCheck.help}
        </button>
      </div>
    </div>
  )
}
