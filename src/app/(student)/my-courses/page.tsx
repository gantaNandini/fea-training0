import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { MyCourseCard } from '@/components/student/MyCourseCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ButtonLink } from '@/components/ui/button'
import { getFreshUser } from '@/lib/auth/guards'
import { getEnrolledCourses } from '@/lib/data/progress'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const metadata: Metadata = buildMetadata({
  title: messages.student.myCoursesTitle,
  description: 'Your enrolled courses and progress.',
  path: '/my-courses',
  noIndex: true,
})

export default async function MyCoursesPage() {
  const user = await getFreshUser()
  if (!user) redirect('/login?redirect=/my-courses')
  const items = await getEnrolledCourses(user.id)
  const completed = items.filter((i) => i.progressPercent === 100).length
  const stats = [
    [messages.student.enrolledCount, items.length],
    [messages.student.inProgress, items.length - completed],
    [messages.student.completed, completed],
  ] as const

  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="mb-8">{messages.student.myCoursesTitle}</h1>
      <dl className="mb-10 grid grid-cols-3 gap-4" data-testid="my-courses-stats">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
            <dd className="font-display text-3xl font-extrabold text-plum-700 dark:text-plum-300">{value}</dd>
            <dt className="text-sm text-muted-foreground">{label}</dt>
          </div>
        ))}
      </dl>
      {items.length === 0 ? (
        <EmptyState
          title={messages.student.emptyTitle}
          body={messages.student.emptyBody}
          action={<ButtonLink href="/courses">{messages.common.browseCourses}</ButtonLink>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <MyCourseCard key={i.course.id} item={i} />
          ))}
        </div>
      )}
    </div>
  )
}
