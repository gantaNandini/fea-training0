import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { EventCard } from '@/components/events/EventCard'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { ButtonLink } from '@/components/ui/button'
import { getAllEvents, getConsultancyProjects, getNewlyLaunchedCourses } from '@/lib/data/events'
import { ProjectCard } from '@/components/consultancy/ProjectCard'
import { ConsultancySection } from './ConsultancySection'
import { fmtRange, fmtTime, isUpcoming } from '@/lib/events'

/** Home page: upcoming webinars (with Register Now), upcoming workshops/conferences, and newly launched courses. */
export async function UpcomingWebinars() {
  const webinars = (await getAllEvents()).filter((e) => e.kind === 'WEBINAR' && isUpcoming(e)).slice(0, 3)
  if (webinars.length === 0) return null
  return (
    <section className="section-y bg-surface-alt" aria-labelledby="home-webinars-heading" data-testid="home-webinars">
      <div className="container-page">
        <SectionHeader id="home-webinars-heading" title="Upcoming webinars" subtitle="Free-to-join online sessions. Register to receive the joining link." linkHref="/events?tab=webinars" linkLabel="All webinars" />
        <div className="grid gap-6 md:grid-cols-2">
          {webinars.map((w) => (
            <article key={w.id} className="flex h-full flex-col overflow-hidden rounded-xl border border-plum-200 bg-card dark:border-plum-800">
              <Link href={`/events/${w.id}`} className="relative block aspect-[16/9] bg-muted" aria-label={w.title}>
                <PlaceholderArt src={w.image} alt={w.title} fill sizes="(min-width: 768px) 560px, 100vw" className="object-cover object-top" />
                <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">Online</span>
              </Link>
              <div className="flex flex-1 flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-display text-lg font-bold leading-snug"><Link href={`/events/${w.id}`} className="hover:text-link">{w.title}</Link></h3>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {fmtRange(w.startsAt, w.endsAt)} · {fmtTime(w.startsAt)}–{w.endsAt ? fmtTime(w.endsAt) : ''} IST · Online
                  </p>
                </div>
                <ButtonLink href={`/events/${w.id}#register`} className="shrink-0">Register now</ButtonLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export async function UpcomingEvents() {
  const next = (await getAllEvents()).filter((e) => (e.kind === 'WORKSHOP' || e.kind === 'CONFERENCE') && isUpcoming(e)).slice(0, 3)
  if (next.length === 0) return null
  return (
    <section className="section-y" aria-labelledby="home-events-heading" data-testid="home-events">
      <div className="container-page">
        <SectionHeader id="home-events-heading" title="Upcoming events" subtitle="Workshops and conferences." linkHref="/events" linkLabel="All events" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{next.map((e) => <EventCard key={e.id} e={e} />)}</div>
      </div>
    </section>
  )
}

export async function NewlyLaunchedCourses() {
  const courses = await getNewlyLaunchedCourses()
  if (courses.length === 0) return null
  return (
    <section className="section-y bg-surface-alt" aria-labelledby="home-new-heading" data-testid="home-new-courses">
      <div className="container-page">
        <SectionHeader id="home-new-heading" title="Newly launched courses" subtitle="Our latest programme." linkHref="/courses" linkLabel="All courses" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <article key={c.id} className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative aspect-[16/9] bg-muted">
                <PlaceholderArt src={c.thumbnail} alt={c.title} fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">New</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="font-display text-lg font-bold leading-snug">{c.title}</h3>
                <p className="line-clamp-3 text-sm">{c.shortDescription}</p>
                <ButtonLink href={`/courses/${c.slug}`} className="mt-auto w-fit">View course</ButtonLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Home page: short consultancy block (services + up to three projects). Services text is editable in Admin > Settings > Website. */
export async function ConsultancyHighlights() {
  const projects = await getConsultancyProjects()
  const top = projects.slice(0, 3)
  return (
    <>
      <ConsultancySection />
      {top.length > 0 ? (
        <section className="section-y" aria-labelledby="home-projects-heading" data-testid="home-projects">
          <div className="container-page">
            <SectionHeader id="home-projects-heading" title="Recent projects" subtitle="Examples of consultancy and case-study work." linkHref="/consultancy?tab=projects" linkLabel="All projects" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{top.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
          </div>
        </section>
      ) : null}
    </>
  )
}
