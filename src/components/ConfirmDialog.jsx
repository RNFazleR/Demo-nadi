import { useRef } from 'react'
import { useDialogFocus } from '../lib/useDialogFocus.js'

// Dialog konfirmasi (error prevention) untuk aksi yang berisiko bila salah ketuk.
// Fokus awal di tombol "Batal", supaya Enter yang tidak disengaja tidak langsung menjalankan aksi.
export default function ConfirmDialog({ title, body, confirmLabel, cancelLabel, confirmClassName, onConfirm, onCancel }) {
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
          {title}
        </h2>
        <p id="confirm-body" className="mt-2 text-body-lg text-ink">
          {body}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-tap w-full rounded-btn px-4 text-body-lg font-bold ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            ref={cancelRef}
            onClick={onCancel}
            className="min-h-tap w-full rounded-btn border-2 border-line px-4 text-body-lg font-bold text-ink"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
