import { useEffect } from 'react'
import { copy } from '../data/copy.js'
import Icon from './Icon.jsx'

// Modal simulasi panggilan. Tidak ada panggilan sungguhan.
export default function CallModal({ name, number, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={name}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-phone rounded-t-sheet bg-surface px-gutter pb-8 pt-6 text-center shadow-raised sm:rounded-sheet"
      >
        <span className="inline-block rounded-full bg-surface-muted px-3 py-1 text-body text-ink-soft">
          {copy.callModal.simulationTag}
        </span>

        <div className="relative mx-auto mt-6 grid h-24 w-24 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-300 opacity-50" />
          <span className="relative grid h-24 w-24 place-items-center rounded-full bg-brand-500 text-surface">
            <Icon name="phone" className="h-10 w-10" />
          </span>
        </div>

        <p className="mt-5 text-body-lg text-ink-soft">{copy.callModal.calling}</p>
        <h2 className="text-heading text-ink">{name}</h2>
        <p className="text-body-lg text-ink-soft">{number}</p>

        <p className="mx-auto mt-5 max-w-xs text-body text-ink-soft">{copy.callModal.note}</p>

        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-6 min-h-tap w-full rounded-btn bg-ink text-body-lg font-bold text-surface"
        >
          {copy.callModal.end}
        </button>
      </div>
    </div>
  )
}
