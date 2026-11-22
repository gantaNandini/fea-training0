import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { getUpcomingCourses, type UpcomingCourseDTO } from '@/lib/data/events'
import { IN_PROGRESS, MONTHS, groupByMonth, pickActiveTab } from '@/lib/upcoming-months'
import { cn } from '@/lib/utils/cn'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const metadata: Metadata = buildMetadata({
  title: 'Upcoming courses',
  description: 'New courses coming soon.',
  path: '/upcoming-courses',
})

const levelLabel = {
  BEGINNER: messages.course.levelBeginner,
  INTERMEDIATE: messages.course.levelIntermediate,
  ADVANCED: messages.course.levelAdvanced,
} as const

function CourseCard({ c }: { c: UpcomingCourseDTO }) {
  return (
    <article className="reveal card-lift flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[16/9] bg-muted">
        <PlaceholderArt src={c.thumbnail} alt={c.title} fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">Coming soon</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-bold leading-snug">
          <Link href={`/courses/${c.slug}`} className="hover:text-link">{c.title}</Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {levelLabel[c.level]}
          {c.durationHours ? (
            <span className="ml-3 inline-flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden="true" />{c.durationHours} hrs</span>
          ) : null}
        </p>
        <p className="line-clamp-3 text-sm">{c.shortDescription}</p>
        <Link href={`/courses/${c.slug}`} className="mt-auto inline-flex min-h-11 items-center font-semibold text-link underline-offset-4 hover:underline">
          View details
        </Link>
      </div>
    </article>
  )
}

/** Server-rendered tabs: the open tab is the `month` query value ("1".."12" or "in-progress"). */
export default async function UpcomingCoursesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const [courses, { month }] = await Promise.all([getUpcomingCourses(), searchParams])
  const { byMonth, inProgress } = groupByMonth(courses)
  const active = pickActiveTab(month, { byMonth: byMonth.map((l) => l.length), inProgress: inProgress.length })
  const shown = active === IN_PROGRESS ? inProgress : byMonth[Number(active) - 1] ?? []
  const label = active === IN_PROGRESS ? 'In progress' : MONTHS[Number(active) - 1]
  const tabs = [
    ...MONTHS.map((m, i) => ({ id: String(i + 1), label: m, count: byMonth[i]!.length })),
    { id: IN_PROGRESS, label: 'In progress', count: inProgress.length },
  ]
  return (
    <>
      <PageHero title="Upcoming courses" subtitle="New courses we are launching, month by month." />
      <div className="container-page space-y-8 py-10 md:py-14">
        <nav aria-label="Upcoming courses by month" className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`/upcoming-courses?month=${t.id}`}
              scroll={false}
              aria-current={t.id === active ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold',
                t.id === active ? 'border-plum-700 bg-plum-700 text-white' : 'border-border hover:bg-muted',
              )}
            >
              {t.label}
              {t.count > 0 ? <span className={cn('rounded-full px-2 text-xs', t.id === active ? 'bg-white/20' : 'bg-muted')}>{t.count}</span> : null}
            </Link>
          ))}
        </nav>
        <section aria-labelledby="month-heading">
          <h2 id="month-heading" className="mb-6 text-2xl">{label}</h2>
          {shown.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((c) => <CourseCard key={c.id} c={c} />)}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center font-semibold text-muted-foreground">
              In progress
            </p>
          )}
        </section>
      </div>
    </>
  )
}
