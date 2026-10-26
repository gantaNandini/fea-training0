import { Download, FileText, HelpCircle, PlayCircle } from 'lucide-react'
import { messages } from '@/lib/messages'

export interface LessonUrlResponse {
  type: 'VIDEO' | 'DOCUMENT' | 'QUIZ'
  playback?: { kind: 'placeholder' | 'embed'; src?: string }
  /** short-lived signed URL, only present for enrolled students / free previews (REQ-181) */
  fileUrl?: string | null
  expiresAt: number
}

/** Renders the lesson body from a signed-URL API response. Video / document / placeholder quiz (REQ-183). */
export function LessonViewer({
  type,
  title,
  data,
}: {
  type: 'VIDEO' | 'DOCUMENT' | 'QUIZ'
  title: string
  data: LessonUrlResponse
}) {
  if (type === 'VIDEO') {
    if (data.playback?.kind === 'embed' && data.playback.src) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            src={data.playback.src}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )
    }
    return (
      <div
        data-testid="video-placeholder"
        className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg bg-slate-900 p-6 text-center text-white"
      >
        <PlayCircle className="h-16 w-16 text-plum-200" aria-hidden="true" />
        <p className="font-display text-xl font-bold">{messages.player.demoVideo}</p>
        <p className="max-w-md text-sm text-slate-300">{messages.player.demoVideoNote}</p>
      </div>
    )
  }

  if (type === 'DOCUMENT') {
    return (
      <div
        data-testid="document-placeholder"
        className="flex min-h-72 w-full flex-col items-center justify-center gap-4 rounded-lg border border-border bg-muted p-6 text-center"
      >
        <FileText className="h-14 w-14 text-plum-700 dark:text-plum-300" aria-hidden="true" />
        <p className="max-w-md text-sm text-muted-foreground">{messages.player.documentNote}</p>
        {data.fileUrl ? (
          <a
            href={data.fileUrl}
            download
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 font-semibold text-primary-foreground"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {messages.player.download}
          </a>
        ) : null}
      </div>
    )
  }

  return (
    <div
      data-testid="quiz-placeholder"
      className="flex min-h-72 w-full flex-col items-center justify-center gap-4 rounded-lg border border-border bg-muted p-6 text-center"
    >
      <HelpCircle className="h-14 w-14 text-plum-700 dark:text-plum-300" aria-hidden="true" />
      <p className="font-display text-xl font-bold">{messages.player.quizTitle}</p>
      <p className="max-w-md text-sm text-muted-foreground">{messages.player.quizNote}</p>
    </div>
  )
}
