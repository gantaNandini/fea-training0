import type { Metadata } from 'next'
import { PageHero } from '@/components/shared/PageHero'
import { EmptyState } from '@/components/shared/EmptyState'
import { EventCard } from '@/components/events/EventCard'
import { getAllEvents } from '@/lib/data/events'
import { isUpcoming } from '@/lib/events'
import { buildMetadata } from '@/lib/utils/seo'

export const revalidate = 600
export const metadata: Metadata = buildMetadata({
  title: 'Events',
  description: 'Upcoming conferences, workshops and webinars.',
  path: '/events',
})

export default async function EventsPage() {
  const all = (await getAllEvents()).filter((e) => e.kind !== 'BATCH')
  const upcoming = all.filter((e) => isUpcoming(e))
  const past = all.filter((e) => !isUpcoming(e)).reverse()
  return (
    <>
      <PageHero title="Events" subtitle="Conferences, workshops and webinars. Register early, seats are limited." />
      <div className="container-page space-y-14 py-10 md:py-14">
        <section aria-labelledby="up-heading">
          <h2 id="up-heading" className="mb-6 text-2xl">Upcoming events</h2>
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming events right now" body="New events are announced here. Please check back soon." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map((e) => <EventCard key={e.id} e={e} />)}</div>
          )}
        </section>
        {past.length > 0 ? (
          <section aria-labelledby="past-heading">
            <h2 id="past-heading" className="mb-6 text-2xl">Past events</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{past.map((e) => <EventCard key={e.id} e={e} past />)}</div>
          </section>
        ) : null}
      </div>
    </>
  )
}
