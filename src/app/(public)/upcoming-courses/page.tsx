import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { getUpcomingCourses } from '@/lib/data/events'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const revalidate = 600
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

export default async function UpcomingCoursesPage() {
  const courses = await getUpcomingCourses()
  return (
    <>
      <PageHero title="Upcoming courses" subtitle="New courses we are launching." />
      <div className="container-page space-y-14 py-10 md:py-14">
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
        ) : (
          <p className="text-muted-foreground">New courses coming soon. Check back shortly.</p>
        )}
      </div>
    </>
  )
}
