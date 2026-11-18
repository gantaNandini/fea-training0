import Link from 'next/link'
import type { LessonGate } from '@/lib/course-gating'
import type { PlayerSectionDTO } from '@/lib/types'
import { formatDuration } from '@/lib/utils/pricing'

interface Props {
  courseSlug: string
  sections: PlayerSectionDTO[]
  gates: LessonGate[]
  currentLessonId: string
  onNavigate?: () => void
}

/**
 * Replacement for the existing Sidebar component in LessonPlayer.
 * Shows lock icons, green ticks, and "Quiz pending / passed" chips (R7).
 * Used after the gating migration is applied. The old Sidebar is preserved for fallback.
 */
export function GatedLessonSidebar({ courseSlug, sections, gates, currentLessonId, onNavigate }: Props) {
  const byId = new Map(gates.map((g) => [g.lessonId, g]))

  return (
    <nav aria-label="Course curriculum" className="space-y-5">
      {sections.map((s) => (
        <div key={s.id}>
          <h3 className="mb-1 text-sm font-bold">{s.title}</h3>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {s.lessons.map((l) => {
              const g = byId.get(l.id)
              const locked = g?.locked ?? false
              const current = l.id === currentLessonId
              const inner = (
                <span className="flex min-h-12 items-center gap-3 px-3 py-2">
                  <StatusIcon g={g} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-sm ${current ? 'font-semibold' : ''} ${
                        locked ? 'text-muted-foreground' : ''
                      }`}
                    >
                      {l.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDuration(l.durationSeconds)}</span>
                    {g?.isVideo && g.quizRequired && g.videoCompleted && (
                      <span
                        className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          g.quizPassed
                            ? 'bg-green-50 text-success-text'
                            : 'border border-border text-muted-foreground'
                        }`}
                      >
                        {g.quizPassed ? 'Quiz passed' : 'Quiz pending · 80%'}
                      </span>
                    )}
                  </span>
                </span>
              )
              return (
                <li key={l.id} aria-current={current ? 'true' : undefined}>
                  {locked ? (
                    <span
                      aria-disabled="true"
                      title="Watch the previous video and pass its quiz (80%) to unlock"
                      className="block cursor-not-allowed opacity-70"
                    >
                      {inner}
                      <span className="sr-only">Locked</span>
                    </span>
                  ) : (
                    <Link
                      href={`/learn/${courseSlug}/${l.id}`}
                      onClick={onNavigate}
                      aria-current={current ? 'page' : undefined}
                      className="block hover:bg-muted focus-visible:outline focus-visible:outline-2"
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function StatusIcon({ g }: { g?: LessonGate }) {
  const base = 'h-5 w-5 shrink-0'
  if (g?.locked) {
    return (
      <svg
        className={`${base} text-muted-foreground`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    )
  }
  if (g?.videoCompleted) {
    return (
      <svg
        className={`${base} text-success-text`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-label="Video completed"
        role="img"
      >
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path d="m7.5 12.5 3 3 6-6.5" />
      </svg>
    )
  }
  return <span className={`${base} rounded-full border-2 border-border`} aria-hidden="true" />
}
