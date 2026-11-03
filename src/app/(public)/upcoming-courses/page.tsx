import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'
import { EmptyState } from '@/components/shared/EmptyState'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { EventCard } from '@/components/events/EventCard'
import { ButtonLink } from '@/components/ui/button'
import { getAllEvents, getUpcomingCourses } from '@/lib/data/events'
import { isUpcoming } from '@/lib/events'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const revalidate = 600
export const metadata: Metadata = buildMetadata({
  title: 'Upcoming courses',
  description: 'New courses and scheduled batches coming soon.',
  path: '/upcoming-courses',
})

const levelLabel = {
  BEGINNER: messages.course.levelBeginner,
  INTERMEDIATE: messages.course.levelIntermediate,
  ADVANCED: messages.course.levelAdvanced,
} as const

export default async function UpcomingCoursesPage() {
  const [courses, events] = await Promise.all([getUpcomingCourses(), getAllEvents()])
  const batches = events.filter((e) => e.kind === 'BATCH' && isUpcoming(e))
  return (
    <>
      <PageHero title="Upcoming courses" subtitle="New courses we are launching and the next scheduled batches." />
      <div className="container-page space-y-14 py-10 md:py-14">
        <section aria-labelledby="batches-heading">
          <h2 id="batches-heading" className="mb-6 text-2xl">Scheduled batches</h2>
          {batches.length === 0 ? (
            <EmptyState
              title="No batches scheduled yet"
              body="Tell us which course you are interested in and we will let you know when the next batch starts."
              action={<ButtonLink href="/contact">Contact us</ButtonLink>}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{batches.map((e) => <EventCard key={e.id} e={e} />)}</div>
          )}
        </section>
        {courses.length > 0 ? (
          <section aria-labelledby="soon-heading">
            <h2 id="soon-heading" className="mb-6 text-2xl">Coming soon</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <article key={c.id} className="reveal card-lift flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
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
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  )
}
