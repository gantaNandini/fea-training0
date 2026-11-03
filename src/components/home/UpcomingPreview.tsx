import { EventCard } from '@/components/events/EventCard'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { getAllEvents } from '@/lib/data/events'
import { isUpcoming } from '@/lib/events'

/** Home page: the next three events or course batches. Hidden when there are none. */
export async function UpcomingPreview() {
  const next = (await getAllEvents()).filter((e) => isUpcoming(e)).slice(0, 3)
  if (next.length === 0) return null
  return (
    <section className="section-y" aria-labelledby="upcoming-heading">
      <div className="container-page">
        <SectionHeader id="upcoming-heading" title="Coming up" subtitle="Next events and course batches." linkHref="/events" linkLabel="All events" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{next.map((e) => <EventCard key={e.id} e={e} />)}</div>
      </div>
    </section>
  )
}
