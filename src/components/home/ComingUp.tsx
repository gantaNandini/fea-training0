import Link from 'next/link'
import { CalendarDays, GraduationCap } from 'lucide-react'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { ButtonLink } from '@/components/ui/button'
import { getAllEvents, getUpcomingCourses } from '@/lib/data/events'
import { fmtRange, fmtTime, isUpcoming, kindLabel } from '@/lib/events'

type Item = {
  key: string
  type: string
  title: string
  when: string
  online: boolean
  image: string | null
  href: string
  cta: string
  ctaHref: string
}

/**
 * Home page: ONE compact "Coming up" block that lists every upcoming webinar, workshop, conference and
 * coming-soon course, each with a direct button (Register now / View course). Hidden only if there is nothing to show.
 */
export async function ComingUp() {
  const [events, courses] = await Promise.all([getAllEvents(), getUpcomingCourses()])

  const eventItems: Item[] = events
    .filter((e) => e.kind !== 'BATCH' && isUpcoming(e))
    .map((e) => {
      const registrable = e.kind === 'WEBINAR' || e.kind === 'WORKSHOP'
      const timed = e.kind === 'WEBINAR' && fmtTime(e.startsAt) !== '00:00'
      return {
        key: `event-${e.id}`,
        type: kindLabel(e.kind),
        title: e.title,
        when: `${fmtRange(e.startsAt, e.endsAt)}${timed ? ` · ${fmtTime(e.startsAt)}–${e.endsAt ? fmtTime(e.endsAt) : ''} IST` : ''}`,
        online: e.kind === 'WEBINAR' || /online/i.test(e.location ?? ''),
        image: e.image,
        href: `/events/${e.id}`,
        cta: registrable ? 'Register now' : 'View details',
        ctaHref: registrable ? `/events/${e.id}#register` : `/events/${e.id}`,
      }
    })

  const courseItems: Item[] = courses.map((c) => ({
    key: `course-${c.id}`,
    type: 'Upcoming course',
    title: c.title,
    when: 'Coming soon',
    online: true,
    image: c.thumbnail,
    href: `/courses/${c.slug}`,
    cta: 'View course',
    ctaHref: `/courses/${c.slug}`,
  }))

  const items = [...eventItems, ...courseItems].slice(0, 6)
  if (items.length === 0) return null

  return (
    <section className="section-y bg-surface-alt" aria-labelledby="coming-up-heading" data-testid="coming-up">
      <div className="container-page">
        <SectionHeader
          id="coming-up-heading"
          title="Coming up"
          subtitle="Upcoming webinars, workshops and courses. Register in one click."
          linkHref="/events"
          linkLabel="All events"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <article key={it.key} className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
              <Link href={it.href} className="relative block aspect-[16/9] bg-muted" aria-label={it.title}>
                <PlaceholderArt src={it.image} alt={it.title} fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover object-top" />
                <span className="absolute left-3 top-3 rounded-full bg-plum-700 px-3 py-1 text-xs font-semibold text-white">{it.type}</span>
                {it.online ? <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">Online</span> : null}
              </Link>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="font-display text-base font-bold leading-snug">
                  <Link href={it.href} className="hover:text-link">{it.title}</Link>
                </h3>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  {it.type === 'Upcoming course' ? <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" /> : <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  {it.when}
                </p>
                <ButtonLink href={it.ctaHref} className="mt-auto w-fit">{it.cta}</ButtonLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
