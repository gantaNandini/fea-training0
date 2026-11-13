import Link from 'next/link'
import { getAllEvents, getUpcomingCourses } from '@/lib/data/events'
import { fmtRange, fmtTime, isUpcoming, kindLabel } from '@/lib/events'
import { EventPopup } from './EventPopup'

/**
 * Home page: ONE small box, a few single-line rows. Events open a pop-up (details + register form);
 * coming-soon courses link to their page. Renders nothing when there is nothing upcoming.
 */
export async function ComingUpStrip() {
  const [events, courses] = await Promise.all([getAllEvents(), getUpcomingCourses()])
  const rows = events.filter((e) => e.kind !== 'BATCH' && isUpcoming(e)).slice(0, 4)
  const soon = courses.slice(0, 2)
  if (rows.length === 0 && soon.length === 0) return null

  return (
    <section className="py-6" aria-labelledby="coming-up-heading" data-testid="coming-up">
      <div className="container-page">
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <h2 id="coming-up-heading" className="text-lg">Coming up</h2>
            <Link href="/events" className="text-sm font-semibold text-link hover:underline">All events</Link>
          </div>
          <ul className="divide-y divide-border">
            {rows.map((e) => {
              const timed = e.kind === 'WEBINAR' && fmtTime(e.startsAt) !== '00:00'
              const when = `${fmtRange(e.startsAt, e.endsAt)}${timed ? ` · ${fmtTime(e.startsAt)}–${e.endsAt ? fmtTime(e.endsAt) : ''} IST` : ''}`
              return (
                <li key={e.id}>
                  <EventPopup
                    eventId={e.id}
                    type={kindLabel(e.kind)}
                    title={e.title}
                    when={when}
                    online={e.kind === 'WEBINAR' || /online/i.test(e.location ?? '')}
                    summary={e.summary}
                    image={e.image}
                    registrable={e.kind === 'WEBINAR' || e.kind === 'WORKSHOP'}
                  />
                </li>
              )
            })}
            {soon.map((c) => (
              <li key={c.id}>
                <Link href={`/courses/${c.slug}`} className="flex min-h-14 items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                  <span className="shrink-0 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">Upcoming course</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{c.title}</span>
                  <span className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm font-semibold">View course</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
