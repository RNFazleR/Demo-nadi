import { useRef, useState } from 'react'
import { copy } from '../data/copy.js'
import { useAuth } from '../state/AuthContext.jsx'
import Icon from '../components/Icon.jsx'

const t = copy.login
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FIELD =
  'block min-h-tap w-full rounded-btn border-2 bg-surface px-4 text-body-lg text-ink placeholder:text-ink-faint focus:border-brand-600'

// Layar masuk keluarga. Validasi dulu di sini (error prevention), lalu satu pesan netral
// kalau kombinasi email + kata sandi salah (tidak membocorkan mana yang salah).
export default function Login() {
  const { login, justSignedOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // { email?: key, password?: key, form?: key } -> kunci copy.login.errors
  const [errors, setErrors] = useState({})
  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (!email.trim()) next.email = 'emailEmpty'
    else if (!EMAIL_FORMAT.test(email.trim())) next.email = 'emailFormat'
    if (!password) next.password = 'passwordEmpty'

    if (!next.email && !next.password) {
      const result = login(email, password)
      if (!result) return
      next.form = result
      setPassword('')
    }
    setErrors(next)
    // Fokus ke field pertama yang perlu diperbaiki
    if (next.email || next.form) emailRef.current?.focus()
    else passwordRef.current?.focus()
  }

  const border = (hasError) => (hasError ? 'border-accent-700' : 'border-line')

  return (
    <div className="flex flex-1 flex-col px-gutter pb-8 pt-12">
      <div className="flex flex-col items-center text-center">
        <img src="favicon.svg" alt="" className="h-20 w-20 rounded-card shadow-card" />
        <p className="mt-3 text-title text-brand-700">{copy.app.name}</p>
        <h1 className="mt-6 text-heading text-ink">{t.title}</h1>
        <p className="mt-2 text-body-lg text-ink-soft">{t.subtitle}</p>
      </div>

      {justSignedOut && !errors.form && (
        <p role="status" className="mt-6 flex items-start gap-2 rounded-card bg-brand-50 p-4 text-body font-semibold text-brand-700">
          <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.4} />
          {t.signedOut}
        </p>
      )}

      <form noValidate onSubmit={submit} className="mt-6 flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
        {errors.form && (
          <p role="alert" className="flex items-start gap-2 rounded-chip border border-accent-500 bg-accent-100 p-3 text-body font-semibold text-ink">
            <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-accent-700" />
            {t.errors[errors.form]}
          </p>
        )}

        <div>
          <label htmlFor="login-email" className="text-body-lg font-bold text-ink">
            {t.email}
          </label>
          <input
            ref={emailRef}
            id="login-email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email || errors.form)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            className={`mt-1 ${FIELD} ${border(errors.email || errors.form)}`}
          />
          {errors.email && (
            <p id="login-email-error" role="alert" className="mt-1 text-body font-semibold text-accent-700">
              {t.errors[errors.email]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="login-password" className="text-body-lg font-bold text-ink">
            {t.password}
          </label>
          <div className="relative mt-1">
            <input
              ref={passwordRef}
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errors.password || errors.form)}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              className={`${FIELD} pr-14 ${border(errors.password || errors.form)}`}
            />
            {/* Area tekan 48px di dalam field */}
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              aria-label={t.showPassword}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-btn text-ink-soft hover:text-ink"
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-6 w-6" />
            </button>
          </div>
          {errors.password && (
            <p id="login-password-error" role="alert" className="mt-1 text-body font-semibold text-accent-700">
              {t.errors[errors.password]}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="mt-2 flex min-h-tap items-center justify-center rounded-btn bg-brand-600 px-5 text-body-lg font-bold text-surface hover:bg-brand-700"
        >
          {t.submit}
        </button>

        <details className="group">
          <summary className="flex min-h-tap cursor-pointer list-none items-center justify-center gap-1 rounded-btn text-body font-semibold text-brand-700">
            {t.forgot.question}
            <Icon name="chevronRight" className="h-5 w-5 transition-transform group-open:rotate-90" strokeWidth={2.4} />
          </summary>
          <p className="mt-1 text-center text-body text-ink-soft">{t.forgot.answer}</p>
        </details>
      </form>

      <p className="mt-auto pt-8 text-center text-body text-ink-soft">{copy.app.disclaimer}</p>
    </div>
  )
}
