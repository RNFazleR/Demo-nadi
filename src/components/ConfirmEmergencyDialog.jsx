import { useRef } from 'react'
import { copy } from '../data/copy.js'
import { kontakDarurat } from '../data/dummy.js'
import { STATUS_STYLES } from '../lib/status.js'
import { useDialogFocus } from '../lib/useDialogFocus.js'

const t = copy.actions.confirmEmergency

// Konfirmasi sebelum menghubungi layanan darurat (error prevention).
// Fokus awal di tombol "Batal", supaya Enter yang tidak disengaja tidak langsung menelepon.
export default function ConfirmEmergencyDialog({ onConfirm, onCancel }) {
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)
  useDialogFocus(dialogRef, cancelRef, onCancel)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-phone rounded-t-sheet bg-surface px-gutter pb-8 pt-6 shadow-raised sm:rounded-sheet"
      >
        <h2 id="confirm-title" className="text-title text-ink">
          {t.title(kontakDarurat.nomor)}
        </h2>
        <p id="confirm-body" className="mt-2 text-body-lg text-ink">
          {t.body}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-tap w-full rounded-btn px-4 text-body-lg font-bold ${STATUS_STYLES.darurat.solid}`}
          >
            {t.confirm(kontakDarurat.nomor)}
          </button>
          <button
            type="button"
            ref={cancelRef}
            onClick={onCancel}
            className="min-h-tap w-full rounded-btn border-2 border-line px-4 text-body-lg font-bold text-ink"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  )
}
