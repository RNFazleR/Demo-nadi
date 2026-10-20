import { copy } from '../data/copy.js'
import { useAuth } from '../state/AuthContext.jsx'
import { formatInviteCode } from '../lib/format.js'
import Icon from './Icon.jsx'

const t = copy.pusatSetup.code

// Kode keluarga HP Pusat (besar, mudah dibacakan) + daftar HP Cabang yang sudah tertaut.
export default function InviteCode({ code, pusatId }) {
  const { cabangOf } = useAuth()
  const linked = cabangOf(pusatId)
  return (
    <div className="mt-4">
      <p className="rounded-card bg-brand-50 py-4 text-center text-elder-title tracking-widest text-brand-700 tabular-nums">
        {formatInviteCode(code)}
      </p>
      <h3 className="mt-4 text-body-lg font-bold text-ink">{t.linkedTitle}</h3>
      {linked.length === 0 ? (
        <p className="text-body text-ink-soft">{t.noneLinked}</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-1">
          {linked.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-body text-ink">
              <Icon name="users" className="h-5 w-5 shrink-0 text-brand-600" />
              {c.nama}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
