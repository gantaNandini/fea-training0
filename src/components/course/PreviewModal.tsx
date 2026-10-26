'use client'

import * as React from 'react'
import Link from 'next/link'
import { PlayCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { LessonViewer, type LessonUrlResponse } from '@/components/player/LessonViewer'
import { messages } from '@/lib/messages'

/** Free-preview lesson in a modal (REQ-093). Uses the same protected URL API as the player. */
export function PreviewModal({
  open,
  onOpenChange,
  slug,
  lesson,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  slug: string
  lesson: { id: string; title: string; type: 'VIDEO' | 'DOCUMENT' | 'QUIZ' } | null
}) {
  const [state, setState] = React.useState<
    { status: 'loading' } | { status: 'auth' } | { status: 'error' } | { status: 'ok'; data: LessonUrlResponse }
  >({ status: 'loading' })

  React.useEffect(() => {
    if (!open || !lesson) return
    let cancelled = false
    setState({ status: 'loading' })
    fetch(`/api/courses/${slug}/lessons/${lesson.id}/url`, { cache: 'no-store' })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401) return setState({ status: 'auth' })
        if (!res.ok) return setState({ status: 'error' })
        setState({ status: 'ok', data: (await res.json()) as LessonUrlResponse })
      })
      .catch(() => !cancelled && setState({ status: 'error' }))
    return () => {
      cancelled = true
    }
  }, [open, lesson, slug])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="pr-10 font-display text-lg font-bold">{lesson?.title}</DialogTitle>
        <DialogDescription className="sr-only">{messages.player.preview}</DialogDescription>
        <div className="mt-4">
          {state.status === 'loading' ? (
            <Skeleton className="aspect-video w-full" />
          ) : state.status === 'auth' ? (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-lg bg-muted p-6 text-center">
              <PlayCircle className="h-10 w-10 text-plum-700" aria-hidden="true" />
              <p>{messages.errors.unauthenticated}</p>
              <Link
                href={`/login?redirect=${encodeURIComponent(`/courses/${slug}`)}`}
                className="font-semibold text-link underline underline-offset-4"
              >
                {messages.nav.login}
              </Link>
            </div>
          ) : state.status === 'error' || !lesson ? (
            <p role="alert" className="rounded-lg bg-muted p-6 text-center">{messages.player.loadError}</p>
          ) : (
            <LessonViewer type={lesson.type} title={lesson.title} data={state.data} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
