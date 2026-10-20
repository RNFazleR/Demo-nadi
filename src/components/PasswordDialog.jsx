import { useRef, useState } from 'react'
import { copy } from '../data/copy.js'
import { useAuth } from '../state/AuthContext.jsx'
import { useDialogFocus } from '../lib/useDialogFocus.js'

const t = copy.pusatUnlock

// Dialog kata sandi sebelum membuka pengaturan HP Pusat dari mode lansia (error prevention:
// orang tua tidak tersasar ke pengaturan, tapi keluarga tetap punya jalan masuk).
export default function PasswordDialog({ onUnlock, onCancel }) {
  const { verifyPassword } = useAuth()
  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const [password, setPassword] = useState('')
  const [wrong, setWrong] = useState(false)
  useDialogFocus(dialogRef, inputRef, onCancel)

  const submit = (e) => {
    e.preventDefault()
    if (verifyPassword(password)) {
      onUnlock()
      return
    }
    setWrong(true)
    setPassword('')
    inputRef.current?.focus()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-title"
        aria-describedby="unlock-body"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-phone rounded-t-sheet bg-surface px-gutter pb-8 pt-6 shadow-raised sm:rounded-sheet"
      >
        <h2 id="unlock-title" className="text-title text-ink">
          {t.title}
        </h2>
        <p id="unlock-body" className="mt-1 text-body-lg text-ink-soft">
          {t.body}
        </p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <label htmlFor="unlock-password" className="text-body-lg font-bold text-ink">
            {t.password}
          </label>
          <input
            ref={inputRef}
            id="unlock-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={wrong}
            aria-describedby={wrong ? 'unlock-error' : undefined}
            className={`min-h-tap w-full rounded-btn border-2 bg-surface px-4 text-body-lg text-ink focus:border-brand-600 ${
              wrong ? 'border-accent-700' : 'border-line'
            }`}
          />
          {wrong && (
            <p id="unlock-error" role="alert" className="text-body font-semibold text-accent-700">
              {t.wrong}
            </p>
          )}
          <button type="submit" className="mt-2 min-h-tap w-full rounded-btn bg-brand-600 px-4 text-body-lg font-bold text-surface hover:bg-brand-700">
            {t.submit}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-tap w-full rounded-btn border-2 border-line px-4 text-body-lg font-bold text-ink"
          >
            {t.cancel}
          </button>
        </form>
      </div>
    </div>
  )
}
