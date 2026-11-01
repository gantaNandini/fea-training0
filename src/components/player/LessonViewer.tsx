import { Download, FileText, HelpCircle, PlayCircle } from 'lucide-react'
import { messages } from '@/lib/messages'

export interface LessonUrlResponse {
  type: 'VIDEO' | 'DOCUMENT' | 'QUIZ'
  playback?: { kind: 'placeholder' | 'embed' | 'file'; src?: string; media?: 'video' | 'audio' }
  fileKind?: 'video' | 'audio' | 'pdf' | 'image' | 'text' | 'other'
  fileName?: string | null
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
    if (data.playback?.kind === 'file' && data.playback.src) {
      return (
        <div className="space-y-3">
          {data.playback.media === 'audio' ? (
            <audio src={data.playback.src} controls controlsList="nodownload" className="w-full" />
          ) : (
            <video src={data.playback.src} controls controlsList="nodownload" playsInline className="aspect-video w-full rounded-lg bg-black" />
          )}
        </div>
      )
    }
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
    const src = data.fileUrl
    const kind = data.fileKind ?? 'other'
    const button = (
      <div className="flex flex-wrap justify-center gap-3">
        {src && (kind === 'pdf' || kind === 'text') ? (
          <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-background px-5 font-semibold">
            Open in new tab
          </a>
        ) : null}
        {src ? (
          <a href={src} download={data.fileName ?? true} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 font-semibold text-primary-foreground">
            <Download className="h-4 w-4" aria-hidden="true" />
            {messages.player.download}
          </a>
        ) : null}
      </div>
    )
    if (src && kind === 'video') return <video src={src} controls playsInline className="aspect-video w-full rounded-lg bg-black" />
    if (src && kind === 'audio') return <div className="space-y-3"><audio src={src} controls className="w-full" />{button}</div>
    if (src && kind === 'image') {
      return (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={title} className="mx-auto max-h-[70vh] rounded-lg border border-border" />
          {button}
        </div>
      )
    }
    if (src && kind === 'pdf' && /^https:\/\//.test(src)) {
      return (
        <div className="space-y-3">
          <iframe src={src} title={title} className="h-[70vh] w-full rounded-lg border border-border" />
          {button}
        </div>
      )
    }
    return (
      <div
        data-testid="document-placeholder"
        className="flex min-h-72 w-full flex-col items-center justify-center gap-4 rounded-lg border border-border bg-muted p-6 text-center"
      >
        <FileText className="h-14 w-14 text-plum-700 dark:text-plum-300" aria-hidden="true" />
        {src && data.fileName ? <p className="font-semibold">{data.fileName}</p> : null}
        <p className="max-w-md text-sm text-muted-foreground">{src ? 'Download this resource to open it on your computer (for example in ANSYS Workbench).' : messages.player.documentNote}</p>
        {button}
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
