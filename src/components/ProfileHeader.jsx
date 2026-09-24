import { copy } from '../data/copy.js'
import { formatDateLong } from '../lib/format.js'

export default function ProfileHeader({ profile }) {
  return (
    <header className="flex items-center gap-4">
      <img
        src={profile.foto}
        alt={profile.nama}
        className="h-16 w-16 shrink-0 rounded-full border-2 border-surface object-cover shadow-card"
      />
      <div className="min-w-0">
        <p className="text-body text-ink-soft">{copy.dashboard.greeting}</p>
        <h1 className="truncate text-title text-ink">{profile.nama}</h1>
        <p className="text-body text-ink-soft">
          {copy.profile.monitoredSince} {formatDateLong(profile.mulai_dipantau_sejak)}
        </p>
      </div>
    </header>
  )
}
