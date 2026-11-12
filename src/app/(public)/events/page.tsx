import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/shared/PageHero'
import { EmptyState } from '@/components/shared/EmptyState'
import { EventCard } from '@/components/events/EventCard'
import { getAllEvents } from '@/lib/data/events'
import { isUpcoming } from '@/lib/events'
import { buildMetadata } from '@/lib/utils/seo'
import { cn } from '@/lib/utils/cn'

export const revalidate = 120
export const metadata: Metadata = buildMetadata({
  title: 'Events',
  description: 'Upcoming conferences, workshops and webinars.',
  path: '/events',
})

const TABS = [
  { key: 'conferences', label: 'Conferences', kind: 'CONFERENCE', empty: 'No conferences scheduled right now' },
  { key: 'workshops', label: 'Workshops', kind: 'WORKSHOP', empty: 'No workshops scheduled right now' },
  { key: 'webinars', label: 'Webinars', kind: 'WEBINAR', empty: 'No webinars scheduled right now' },
] as const

type Props = { searchParams: Promise<{ tab?: string }> }

export default async function EventsPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const active = TABS.find((t) => t.key === tab) ?? TABS[0]
  const all = (await getAllEvents()).filter((e) => e.kind === active.kind)
  const upcoming = all.filter((e) => isUpcoming(e))
  const past = all.filter((e) => !isUpcoming(e)).reverse()
  return (
    <>
      <PageHero title="Events" subtitle="Conferences, workshops and webinars. Register early, seats are limited." />
      <div className="container-page space-y-10 py-10 md:py-14">
        <nav aria-label="Event types" className="flex flex-wrap gap-2 border-b border-border pb-3">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/events?tab=${t.key}`}
              scroll={false}
              aria-current={t.key === active.key ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center rounded-md px-4 font-semibold',
                t.key === active.key ? 'bg-plum-700 text-white' : 'text-foreground hover:bg-muted',
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <section aria-labelledby="up-heading">
          <h2 id="up-heading" className="mb-6 text-2xl">Upcoming {active.label.toLowerCase()}</h2>
          {upcoming.length === 0 ? (
            <EmptyState title={active.empty} body="New events are announced here. Please check back soon." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map((e) => <EventCard key={e.id} e={e} />)}</div>
          )}
        </section>
        {past.length > 0 ? (
          <section aria-labelledby="past-heading">
            <h2 id="past-heading" className="mb-6 text-2xl">Past {active.label.toLowerCase()}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{past.map((e) => <EventCard key={e.id} e={e} past />)}</div>
          </section>
        ) : null}
      </div>
    </>
  )
}
