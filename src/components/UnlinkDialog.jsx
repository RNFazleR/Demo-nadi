import { useRef } from 'react'
import { copy } from '../data/copy.js'
import { useDialogFocus } from '../lib/useDialogFocus.js'

const t = copy.settings.account.unlinkConfirm

// Konfirmasi sebelum HP Cabang melepas tautan dari HP Pusat (error prevention).
// Fokus awal di "Batal", sama dengan ConfirmEmergencyDialog.
export default function UnlinkDialog({ nama, onConfirm, onCancel }) {
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)
  useDialogFocus(dialogRef, cancelRef, onCancel)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unlink-title"
        aria-describedby="unlink-body"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-phone rounded-t-sheet bg-surface px-gutter pb-8 pt-6 shadow-raised sm:rounded-sheet"
      >
        <h2 id="unlink-title" className="text-title text-ink">
          {t.title}
        </h2>
        <p id="unlink-body" className="mt-2 text-body-lg text-ink">
          {t.body(nama)}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" onClick={onConfirm} className="min-h-tap w-full rounded-btn bg-ink px-4 text-body-lg font-bold text-surface">
            {t.confirm}
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
