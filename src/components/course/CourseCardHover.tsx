'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatHours } from '@/lib/utils/pricing'
import { messages } from '@/lib/messages'
import type { CourseCardDTO } from '@/lib/types'

/**
 * Informational-only popover (REQ-067): NO buttons inside. Opens on hover and keyboard focus of the
 * card's title link, closes on Esc/blur. Not rendered on touch devices (REQ-068).
 */
export function CourseCardHover({
  course,
  children,
}: {
  course: CourseCardDTO
  children: React.ReactNode
}) {
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')
  const [open, setOpen] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), 250)
  }
  const hide = () => {
    if (timer.current) clearTimeout(timer.current)
    setOpen(false)
  }

  if (!canHover) return <>{children}</>

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
          {children}
        </div>
      </PopoverAnchor>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={12}
        collisionPadding={16}
        className="pointer-events-none w-80"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        data-testid="course-card-hover"
      >
        <p className="font-display text-base font-bold">{course.title}</p>
        <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{course.shortDescription}</p>
        <p className="mt-3 text-xs font-medium text-muted-foreground">
          {course.language}
          {course.lessonCount > 0
            ? ` · ${course.lessonCount} ${messages.course.lessons} · ${formatHours(course.totalSeconds)}`
            : ` · ${messages.course.curriculumSoon}`}
        </p>
        {course.outcomes.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {course.outcomes.slice(0, 4).map((o) => (
              <li key={o} className="flex gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-text dark:text-green-400" aria-hidden="true" />
                <span className="line-clamp-2">{o}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
