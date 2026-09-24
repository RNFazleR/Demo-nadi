import { copy } from '../data/copy.js'

// Sementara untuk tab yang belum dibuat.
export default function PlaceholderScreen({ title }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 px-gutter text-center">
      <h1 className="text-heading text-ink">{title}</h1>
      <p className="text-body-lg text-ink-soft">{copy.placeholder.comingSoon}</p>
    </div>
  )
}
