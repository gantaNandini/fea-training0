'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, ListVideo } from 'lucide-react'
import type { PlayerSectionDTO, PlayerLessonDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { LessonViewer, type LessonUrlResponse } from './LessonViewer'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatDuration } from '@/lib/utils/pricing'
import { messages } from '@/lib/messages'

interface Props {
  course: { slug: string; title: string }
  sections: PlayerSectionDTO[]
  lesson: PlayerLessonDTO
  prevId: string | null
  nextId: string | null
  percent: number
}

function Sidebar({
  course,
  sections,
  currentId,
  completed,
  onNavigate,
}: {
  course: Props['course']
  sections: PlayerSectionDTO[]
  currentId: string
  completed: Set<string>
  onNavigate?: () => void
}) {
  return (
    <nav aria-label={messages.player.courseContent} className="space-y-5">
      {sections.map((s) => (
        <div key={s.id}>
          <h3 className="mb-1 text-sm font-bold">{s.title}</h3>
          <ul>
            {s.lessons.map((l) => {
              const current = l.id === currentId
              return (
                <li key={l.id}>
                  <Link
                    href={`/learn/${course.slug}/${l.id}`}
                    onClick={onNavigate}
                    aria-current={current ? 'page' : undefined}
                    className={`flex min-h-11 items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted ${
                      current ? 'bg-plum-50 font-semibold dark:bg-plum-900/40' : ''
                    }`}
                  >
                    {completed.has(l.id) ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-text dark:text-green-300" aria-label={messages.player.completed} />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block">{l.title}</span>
                      <span className="text-xs text-muted-foreground">{formatDuration(l.durationSeconds)}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function LessonPlayer({ course, sections, lesson, prevId, nextId, percent: initialPercent }: Props) {
  const router = useRouter()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [drawer, setDrawer] = React.useState(false)
  const [data, setData] = React.useState<LessonUrlResponse | null>(null)
  const [error, setError] = React.useState(false)
  const [percent, setPercent] = React.useState(initialPercent)
  const [completed, setCompleted] = React.useState(
    () => new Set(sections.flatMap((s) => s.lessons.filter((l) => l.completed).map((l) => l.id))),
  )
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    setData(null)
    setError(false)
    fetch(`/api/courses/${course.slug}/lessons/${lesson.id}/url`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status))
        return (await r.json()) as LessonUrlResponse
      })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
    }
  }, [course.slug, lesson.id])

  const done = completed.has(lesson.id)

  async function toggleComplete() {
    setBusy(true)
    const next = !done
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: lesson.id, completed: next }),
    })
    setBusy(false)
    if (!res.ok) return toast.error(messages.common.somethingWrong)
    const body = (await res.json()) as { data?: { percent: number; completedLessonIds: string[] }; percent?: number; completedLessonIds?: string[] }
    const payload = body.data ?? body
    setPercent(payload.percent ?? percent)
    setCompleted(new Set(payload.completedLessonIds ?? []))
    router.refresh()
  }

  const sidebar = (onNavigate?: () => void) => (
    <Sidebar course={course} sections={sections} currentId={lesson.id} completed={completed} onNavigate={onNavigate} />
  )

  return (
    <div className="container-page py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/courses/${course.slug}`} className="text-sm text-link underline-offset-4 hover:underline">
          ← {messages.player.backToCourse}
        </Link>
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="Course progress"
            className="h-2 w-32 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full bg-plum-700 dark:bg-plum-300" style={{ width: `${percent}%` }} />
          </div>
          <span className="text-sm text-muted-foreground">{percent}%</span>
          {!isDesktop ? (
            <Dialog open={drawer} onOpenChange={setDrawer}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" aria-label={messages.player.toggleSidebar}>
                  <ListVideo className="h-4 w-4" aria-hidden="true" /> {messages.player.courseContent}
                </Button>
              </DialogTrigger>
              <DialogContent side="right" className="overflow-y-auto">
                <DialogTitle className="mb-4 font-display text-lg font-bold">{messages.player.courseContent}</DialogTitle>
                {sidebar(() => setDrawer(false))}
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <h1 className="mb-4 text-2xl md:text-3xl">{lesson.title}</h1>
          {error ? (
            <p role="alert" className="rounded-lg border border-border bg-muted p-6 text-center">
              {messages.player.loadError}
            </p>
          ) : data ? (
            <LessonViewer type={lesson.type} title={lesson.title} data={data} />
          ) : (
            <Skeleton className="aspect-video w-full" />
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Button variant={done ? 'outline' : 'primary'} onClick={toggleComplete} disabled={busy} aria-pressed={done}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {done ? messages.player.completed : messages.player.markComplete}
            </Button>
            <div className="flex gap-2">
              {prevId ? (
                <Link
                  href={`/learn/${course.slug}/${prevId}`}
                  className="inline-flex min-h-11 items-center gap-1 rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {messages.player.previousLesson}
                </Link>
              ) : null}
              {nextId ? (
                <Link
                  href={`/learn/${course.slug}/${nextId}`}
                  className="inline-flex min-h-11 items-center gap-1 rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted"
                >
                  {messages.player.nextLesson} <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {isDesktop ? (
          <aside className="max-h-[75vh] overflow-y-auto rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-base">{messages.player.courseContent}</h2>
            {sidebar()}
          </aside>
        ) : null}
      </div>
    </div>
  )
}
