import { useState } from 'react'
import { copy } from '../data/copy.js'
import { useSensor } from '../state/SensorContext.jsx'
import Icon from './Icon.jsx'

const t = copy.sensor.source

// Isian alamat laptop penghubung sensor. Dipakai di setup & pengaturan HP Pusat, dan di
// Fitur demo HP Cabang. `id` membedakan elemen kalau ada lebih dari satu di halaman.
export default function SensorHostForm({ id = 'sensor-host', onSaved }) {
  const { apiUrl, sensorHost, setSensorHost } = useSensor()
  const [draft, setDraft] = useState(sensorHost)
  const [saved, setSaved] = useState(false)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSensorHost(draft)
        setSaved(true)
        onSaved?.()
      }}
    >
      <label htmlFor={id} className="text-body-lg font-bold text-ink">
        {t.hostLabel}
      </label>
      <p id={`${id}-hint`} className="text-body text-ink-soft">
        {t.hostHint}
      </p>
      <div className="mt-2 flex gap-2">
        <input
          id={id}
          type="text"
          inputMode="url"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setSaved(false)
          }}
          aria-describedby={`${id}-hint`}
          className="min-h-tap min-w-0 flex-1 rounded-btn border-2 border-line bg-surface px-3 text-body-lg text-ink focus:border-brand-600"
        />
        <button type="submit" className="min-h-tap shrink-0 rounded-btn bg-brand-600 px-4 text-body-lg font-bold text-surface hover:bg-brand-700">
          {t.hostSave}
        </button>
      </div>
      {saved && (
        <p role="status" className="mt-2 flex items-center gap-2 text-body font-semibold text-brand-700">
          <Icon name="check" className="h-5 w-5" strokeWidth={2.4} />
          {t.hostSaved}
        </p>
      )}
      <p className="mt-1 break-all text-body text-ink-soft">{t.apiLabel(apiUrl ?? t.hostUnset)}</p>
    </form>
  )
}
