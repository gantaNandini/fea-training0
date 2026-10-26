'use client'

import * as React from 'react'
import { FileText, HelpCircle, PlayCircle } from 'lucide-react'
import type { LessonDTO, SectionDTO } from '@/lib/types'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { PreviewModal } from './PreviewModal'
import { formatDuration, formatHours } from '@/lib/utils/pricing'
import { messages } from '@/lib/messages'

const ICONS = { VIDEO: PlayCircle, DOCUMENT: FileText, QUIZ: HelpCircle } as const

/**
 * Curriculum (REQ-093): header totals are computed from the rows; the first two sections are
 * expanded; "Preview" lessons open a modal.
 */
export function CurriculumAccordion({ slug, sections }: { slug: string; sections: SectionDTO[] }) {
  const [preview, setPreview] = React.useState<LessonDTO | null>(null)
  const [open, setOpen] = React.useState(false)

  const totalLessons = sections.reduce((n, s) => n + s.lessons.length, 0)
  const totalSeconds = sections.reduce((n, s) => n + s.lessons.reduce((m, l) => m + l.durationSeconds, 0), 0)

  if (totalLessons === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground" data-testid="curriculum-soon">
        {messages.course.curriculumSoon}
      </p>
    )
  }

  return (
    <div data-testid="curriculum">
      <p className="mb-3 text-sm text-muted-foreground">
        {sections.length} sections · {totalLessons} {messages.course.lessons} · {formatHours(totalSeconds)}{' '}
        {messages.course.totalLength}
      </p>
      <Accordion
        type="multiple"
        defaultValue={sections.slice(0, 2).map((s) => s.id)}
        className="rounded-lg border border-border px-4"
      >
        {sections.map((s) => {
          const secs = s.lessons.reduce((n, l) => n + l.durationSeconds, 0)
          return (
            <AccordionItem key={s.id} value={s.id}>
              <AccordionTrigger>
                <span className="flex-1">{s.title}</span>
                <span className="mr-2 shrink-0 text-sm font-normal text-muted-foreground">
                  {s.lessons.length} {messages.course.lessons}
                  {secs > 0 ? ` · ${formatHours(secs)}` : ''}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="divide-y divide-border">
                  {s.lessons.map((l) => {
                    const Icon = ICONS[l.type]
                    const dur = formatDuration(l.durationSeconds)
                    return (
                      <li key={l.id} className="flex min-h-11 items-center gap-3 py-2 text-sm">
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        {l.isFreePreview ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPreview(l)
                              setOpen(true)
                            }}
                            className="flex-1 text-left font-medium text-link underline-offset-4 hover:underline"
                          >
                            {l.title}
                          </button>
                        ) : (
                          <span className="flex-1">{l.title}</span>
                        )}
                        {l.isFreePreview ? <Badge tone="plum">{messages.course.preview}</Badge> : null}
                        {dur ? <span className="shrink-0 tabular-nums text-muted-foreground">{dur}</span> : null}
                      </li>
                    )
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
      <PreviewModal open={open} onOpenChange={setOpen} slug={slug} lesson={preview} />
    </div>
  )
}
