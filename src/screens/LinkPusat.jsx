import { useRef, useState } from 'react'
import { copy } from '../data/copy.js'
import { useAuth } from '../state/AuthContext.jsx'
import Icon from '../components/Icon.jsx'

const t = copy.linkPusat

// HP Cabang yang belum tertaut: masukkan kode keluarga dari HP Pusat.
// Pola error sama dengan layar login (accent, role="alert", fokus kembali ke field).
export default function LinkPusat() {
  const { user, logout, linkToPusat } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const submit = (e) => {
    e.preventDefault()
    const result = linkToPusat(code)
    if (!result) return
    setError(result)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-1 flex-col px-gutter pb-8 pt-12">
      <div className="flex flex-col items-center text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-brand-700">
          <Icon name="users" className="h-10 w-10" />
        </span>
        <h1 className="mt-5 text-heading text-ink">{t.title}</h1>
        <p className="mt-2 text-body-lg text-ink-soft">{t.intro}</p>
      </div>

      <form noValidate onSubmit={submit} className="mt-6 flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
        <label htmlFor="link-code" className="text-body-lg font-bold text-ink">
          {t.codeLabel}
        </label>
        <input
          ref={inputRef}
          id="link-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'link-code-error link-code-where' : 'link-code-where'}
          className={`min-h-tap w-full rounded-btn border-2 bg-surface px-4 text-center text-title tracking-widest text-ink tabular-nums focus:border-brand-600 ${
            error ? 'border-accent-700' : 'border-line'
          }`}
        />
        {error && (
          <p id="link-code-error" role="alert" className="text-body font-semibold text-accent-700">
            {t.errors[error]}
          </p>
        )}
        <p id="link-code-where" className="text-body text-ink-soft">
          {t.where}
        </p>
        <button
          type="submit"
          className="mt-2 flex min-h-tap items-center justify-center rounded-btn bg-brand-600 px-5 text-body-lg font-bold text-surface hover:bg-brand-700"
        >
          {t.submit}
        </button>
      </form>

      <div className="mt-auto flex flex-col items-center gap-1 pt-8 text-center">
        <p className="text-body text-ink-soft">{t.signedInAs(user.nama)}</p>
        <button type="button" onClick={logout} className="min-h-tap rounded-btn px-3 text-body font-semibold text-brand-700">
          {t.switchAccount}
        </button>
      </div>
    </div>
  )
}
