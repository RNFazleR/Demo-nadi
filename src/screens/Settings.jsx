import { useEffect, useRef, useState } from 'react'
import { copy } from '../data/copy.js'
import { useAlerts } from '../state/AlertsContext.jsx'
import { useSensor } from '../state/SensorContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import Icon from '../components/Icon.jsx'
import SensorHostForm from '../components/SensorHostForm.jsx'
import UnlinkDialog from '../components/UnlinkDialog.jsx'

const PRIVACY_POINTS = [
  { key: 'noCamera', icon: 'cameraOff' },
  { key: 'wifiOnly', icon: 'wifi' },
  { key: 'wellness', icon: 'heart' },
]

const ORDER_BTN =
  'grid h-12 w-12 place-items-center rounded-btn border border-line text-ink transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'

// Tab Pengaturan: akun, urutan kontak keluarga, privasi & jeda pemantauan, sumber data, reset demo.
export default function Settings() {
  const { contacts, moveContact, monitoringPaused, setMonitoringPaused, resetDemo } = useAlerts()
  const { mode, setMode, isLive } = useSensor()
  const { user, logout, linkedPusat, unlinkPusat } = useAuth()
  const [confirmUnlink, setConfirmUnlink] = useState(false)
  // Jeda hanya berlaku untuk cerita demo. Di mode sensor langsung pembacaan tetap berjalan,
  // jadi switch dinonaktifkan dan tidak boleh tampil "dijeda".
  const paused = monitoringPaused && !isLive
  const [resetDone, setResetDone] = useState(false)
  const [orderNote, setOrderNote] = useState('') // diumumkan lewat aria-live
  // Tombol ▲▼ per kontak; dipakai untuk menjaga fokus keyboard setelah urutan berubah
  const orderButtons = useRef({})
  const [refocus, setRefocus] = useState(null) // kunci tombol yang perlu difokus ulang

  const move = (contact, index, delta) => {
    const newIndex = index + delta
    moveContact(contact.id, delta)
    setOrderNote(t.contacts.moved(contact.nama, newIndex + 1))
    // Di ujung urutan tombol yang ditekan jadi nonaktif dan kehilangan fokus,
    // jadi fokus dipindah ke tombol arah sebaliknya milik kontak yang sama.
    if (newIndex === 0) setRefocus(`${contact.id}:down`)
    else if (newIndex === contacts.length - 1) setRefocus(`${contact.id}:up`)
  }

  useEffect(() => {
    if (!refocus) return
    orderButtons.current[refocus]?.focus()
    setRefocus(null)
  }, [refocus, contacts])
  const t = copy.settings

  const handleReset = () => {
    resetDemo()
    setResetDone(true)
    setOrderNote('')
  }

  return (
    <div className="flex flex-col gap-5 px-gutter pb-8 pt-6">
      <h1 className="text-heading text-ink">{t.title}</h1>

      {/* Akun keluarga yang sedang masuk */}
      <section className="rounded-card bg-surface p-4 shadow-card">
        <h2 className="text-title text-ink">{t.account.title}</h2>
        <p className="mt-1 text-body text-ink-soft">{t.account.signedInAs}</p>
        <p className="break-words text-body-lg font-bold text-ink">{user.nama}</p>
        <p className="break-all text-body text-ink-soft">{user.email}</p>

        {/* HP Pusat sumber kabar (penautan lewat kode keluarga) */}
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-body text-ink-soft">{t.account.linkedTo}</p>
          <p className="flex items-center gap-2 text-body-lg font-bold text-ink">
            <Icon name="home" className="h-5 w-5 shrink-0 text-brand-600" />
            {t.account.linkedName(linkedPusat.lansia.nama)}
          </p>
          <button
            type="button"
            onClick={() => setConfirmUnlink(true)}
            className="mt-2 flex min-h-tap items-center rounded-btn px-2 text-body-lg font-semibold text-brand-700 hover:bg-surface-muted"
          >
            {t.account.unlink}
          </button>
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-3 flex min-h-tap items-center gap-2 rounded-btn border-2 border-line px-5 text-body-lg font-bold text-ink hover:bg-surface-muted"
        >
          <Icon name="logout" className="h-5 w-5" />
          {t.account.logout}
        </button>
      </section>

      {/* Kontak keluarga */}
      <section className="rounded-card bg-surface p-4 shadow-card">
        <div className="flex items-center gap-2">
          <Icon name="users" className="h-6 w-6 text-brand-600" />
          <h2 className="text-title text-ink">{t.contacts.title}</h2>
        </div>
        <p className="mt-1 text-body text-ink-soft">{t.contacts.explainer}</p>

        {/* Daftar ber-divider (bukan kartu di dalam kartu). Nama & nomor boleh membungkus,
            tidak dipotong, supaya tetap terbaca di layar 320px. */}
        <ol className="mt-3 divide-y divide-line">
          {contacts.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 py-3 last:pb-0">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-body font-extrabold text-brand-700"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="sr-only">{t.contacts.priority(i + 1)}</p>
                <p className="break-words text-body-lg font-bold text-ink">{c.nama}</p>
                <p className="text-body text-ink-soft">{c.hubungan}</p>
                <p className="whitespace-nowrap text-body text-ink-soft tabular-nums">{c.nomor}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  ref={(el) => (orderButtons.current[`${c.id}:up`] = el)}
                  onClick={() => move(c, i, -1)}
                  disabled={i === 0}
                  aria-label={t.contacts.moveUp(c.nama)}
                  className={ORDER_BTN}
                >
                  <Icon name="arrowUp" className="h-5 w-5" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  ref={(el) => (orderButtons.current[`${c.id}:down`] = el)}
                  onClick={() => move(c, i, 1)}
                  disabled={i === contacts.length - 1}
                  aria-label={t.contacts.moveDown(c.nama)}
                  className={ORDER_BTN}
                >
                  <Icon name="arrowDown" className="h-5 w-5" strokeWidth={2.4} />
                </button>
              </div>
            </li>
          ))}
        </ol>
        <p aria-live="polite" className="sr-only">
          {orderNote}
        </p>
      </section>

      {/* Privasi & Data */}
      <section className="rounded-card bg-surface p-5 shadow-card">
        <h2 className="text-title text-ink">{t.privacy.title}</h2>
        <p className="mt-1 text-body text-ink-soft">{t.privacy.intro}</p>
        <ul className="mt-4 flex flex-col gap-3">
          {PRIVACY_POINTS.map(({ key, icon }) => (
            <li key={key} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Icon name={icon} className="h-5 w-5" />
              </span>
              <p className="pt-2 text-body text-ink">{t.privacy.points[key]}</p>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-line pt-5">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p id="pause-label" className="text-body-lg font-bold text-ink">
                {t.privacy.pauseTitle}
              </p>
              <p id="pause-hint" className="text-body text-ink-soft">{t.privacy.pauseHint}</p>
            </div>
            {/* Area tekan 48px (min-h-tap), bentuk switch tetap 32px di tengahnya */}
            <button
              type="button"
              role="switch"
              aria-checked={paused}
              aria-labelledby="pause-label"
              aria-describedby={isLive ? 'pause-hint pause-status' : 'pause-hint'}
              disabled={isLive}
              onClick={() => setMonitoringPaused(!monitoringPaused)}
              className="-mr-1 grid min-h-tap shrink-0 place-items-center rounded-btn px-1 disabled:cursor-not-allowed"
            >
              <span
                aria-hidden="true"
                className={`relative block h-8 w-14 rounded-full transition-colors ${
                  paused ? 'bg-brand-600' : 'bg-ink-faint'
                } ${isLive ? 'opacity-40' : ''}`}
              >
                <span
                  className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-surface shadow-card transition-transform ${
                    paused ? 'translate-x-6' : ''
                  }`}
                />
              </span>
            </button>
          </div>
          <p id="pause-status" className="mt-3 flex items-start gap-2 text-body font-semibold text-ink">
            <Icon
              name={isLive ? 'wifi' : paused ? 'pause' : 'pulse'}
              className="mt-0.5 h-5 w-5 shrink-0 text-brand-600"
            />
            {isLive ? t.privacy.pauseUnavailable : paused ? t.privacy.pauseOn : t.privacy.pauseOff}
          </p>
        </div>
      </section>

      {/* Kontrol khusus demo: sumber data prototipe */}
      <section className="rounded-card border-2 border-dashed border-line p-4">
        <span className="rounded-full bg-surface-muted px-3 py-0.5 text-body font-semibold text-ink-soft">
          {t.reset.tag}
        </span>
        <fieldset className="mt-3">
          <legend className="text-body-lg font-bold text-ink">{copy.sensor.source.title}</legend>
          <p className="text-body text-ink-soft">{copy.sensor.source.hint}</p>
          <div className="mt-2 flex flex-col gap-1">
            {['demo', 'live'].map((value) => (
              <label key={value} className="flex min-h-tap cursor-pointer items-center gap-3 rounded-btn px-2 hover:bg-surface-muted">
                <input
                  type="radio"
                  name="data-source"
                  value={value}
                  checked={mode === value}
                  onChange={() => setMode(value)}
                  className="h-5 w-5 shrink-0 accent-brand-600"
                />
                <span className="text-body-lg text-ink">{copy.sensor.source[value]}</span>
              </label>
            ))}
          </div>
          {mode === 'live' && (
            <div className="mt-3 rounded-chip border border-dashed border-line p-3">
              <p className="text-body text-ink-soft">{copy.sensor.source.liveDemoNote}</p>
              <div className="mt-3">
                <SensorHostForm />
              </div>
            </div>
          )}
        </fieldset>
      </section>

      {confirmUnlink && (
        <UnlinkDialog
          nama={linkedPusat.lansia.nama}
          onCancel={() => setConfirmUnlink(false)}
          onConfirm={() => {
            setConfirmUnlink(false)
            unlinkPusat()
          }}
        />
      )}

      {/* Kontrol khusus demo */}
      <section className="flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-line p-4">
        <span className="rounded-full bg-surface-muted px-3 py-0.5 text-body font-semibold text-ink-soft">
          {t.reset.tag}
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="flex min-h-tap items-center gap-2 rounded-btn bg-ink px-5 text-body-lg font-bold text-surface"
        >
          <Icon name="refresh" className="h-5 w-5" />
          {t.reset.button}
        </button>
        <p className="text-center text-body text-ink-soft">{t.reset.hint}</p>
        {resetDone && (
          <p role="status" className="flex items-center gap-2 text-body font-semibold text-brand-700">
            <Icon name="check" className="h-5 w-5" strokeWidth={2.4} />
            {t.reset.done}
          </p>
        )}
      </section>
    </div>
  )
}
