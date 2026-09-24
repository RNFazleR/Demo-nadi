import { copy } from '../data/copy.js'
import Icon from './Icon.jsx'

// Tahap Feedback agent: konfirmasi bahwa respons keluarga dicatat untuk penilaian berikutnya.
export default function FeedbackNote() {
  return (
    <div role="status" className="flex items-start gap-3 rounded-card border border-brand-100 bg-brand-50 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-500 text-surface">
        <Icon name="sparkle" className="h-5 w-5" />
      </span>
      <div>
        <p className="text-body-lg font-bold text-brand-700">{copy.feedback.title}</p>
        <p className="text-body text-ink">{copy.feedback.body}</p>
      </div>
    </div>
  )
}
