import Link from 'next/link'
import type { EnrolledCourseDTO } from '@/lib/types'
import { ButtonLink } from '@/components/ui/button'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { messages } from '@/lib/messages'

/** REQ-171/172: thumbnail, title, instructor, progress bar and a Resume/Start button. */
export function MyCourseCard({ item }: { item: EnrolledCourseDTO }) {
  const { course, progressPercent, resumeLessonId, resumeLabel } = item
  const href = resumeLessonId ? `/learn/${course.slug}/${resumeLessonId}` : `/courses/${course.slug}`
  return (
    <article data-testid="my-course" className="card-lift relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-card bg-muted">
        <PlaceholderArt src={course.thumbnail} alt={`${course.title} — thumbnail`} fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-display text-base font-bold leading-snug">
          <Link href={`/courses/${course.slug}`} className="line-clamp-2 min-h-[2.75rem] hover:text-link">
            {course.title}
          </Link>
        </h3>
        <p className="truncate text-sm text-muted-foreground">{course.instructorName}</p>
        <div className="mt-auto">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label={`${course.title} progress`}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-plum-700 dark:bg-plum-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {progressPercent}% {messages.student.progress}
          </p>
          <ButtonLink href={href} className="mt-3 w-full">
            {resumeLabel === 'start' ? messages.student.start : messages.student.resume}
          </ButtonLink>
        </div>
      </div>
    </article>
  )
}
