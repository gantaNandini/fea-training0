import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CalendarDays, Download, ExternalLink, MapPin } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { ButtonLink } from '@/components/ui/button'
import { getEventById, getEventRegistrationCount } from '@/lib/data/events'
import { fmtRange, fmtTime, isUpcoming, kindLabel } from '@/lib/events'
import { EventRegistrationForm } from '@/components/events/EventRegistrationForm'
import { buildMetadata } from '@/lib/utils/seo'

export const revalidate = 600
export const dynamicParams = true

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const e = await getEventById(id)
  if (!e) return { title: 'Event not found' }
  return buildMetadata({ title: e.title, description: e.summary ?? `${kindLabel(e.kind)}: ${e.title}`, path: `/events/${e.id}` })
}

export default async function EventPage({ params }: Props) {
  const { id } = await params
  const e = await getEventById(id)
  if (!e) notFound()
  const upcoming = isUpcoming(e)
  const paragraphs = (e.description ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const parentHref = e.kind === 'BATCH' ? '/upcoming-courses' : '/events'
  const canRegister = upcoming && (e.kind === 'WEBINAR' || e.kind === 'WORKSHOP')
  const isOnline = /online/i.test(e.location ?? '') || e.kind === 'WEBINAR'

  // Seat limit — fetch real-time count only when a limit is configured
  const taken = e.seatLimit != null ? await getEventRegistrationCount(e.id) : 0
  const seatsLeft = e.seatLimit != null ? Math.max(0, e.seatLimit - taken) : null
  const isFull = seatsLeft !== null && seatsLeft <= 0

  return (
    <>
      <PageHero title={e.title} subtitle={e.summary ?? undefined} crumb={e.kind === 'BATCH' ? 'Upcoming courses' : 'Events'} />
      <div className="container-page grid gap-10 py-10 md:py-14 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-8">
          {e.image ? (
            e.kind === 'WEBINAR' ? (
              /* Webinar flyers are portrait: show the whole flyer, uncropped. */
              <div className="relative mx-auto aspect-[1076/1521] w-full max-w-xl overflow-hidden rounded-xl border border-border bg-muted">
                <PlaceholderArt src={e.image} alt={`${e.title} flyer`} fill sizes="(min-width: 1024px) 576px, 100vw" className="object-contain" priority />
              </div>
            ) : (
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-muted">
                <PlaceholderArt src={e.image} alt={e.title} fill sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" priority />
              </div>
            )
          ) : null}
          <section aria-labelledby="ev-overview">
            <h2 id="ev-overview" className="mb-4 text-2xl">Overview</h2>
            {paragraphs.length > 0 ? (
              <div className="space-y-4">{paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}</div>
            ) : (
              <p className="text-muted-foreground">More details will be announced soon.</p>
            )}
          </section>
          {e.documentUrl ? (
            <section aria-labelledby="ev-docs">
              <h2 id="ev-docs" className="mb-4 text-2xl">Documents</h2>
              <a
                href={e.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 font-semibold text-link hover:bg-muted"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {e.kind === 'WEBINAR' ? 'Download webinar flyer (PDF)' : 'Download brochure / programme'}
              </a>
            </section>
          ) : null}
          {canRegister ? (
            <section aria-labelledby="ev-register" id="register">
              <h2 id="ev-register" className="mb-4 text-2xl">Register for this {kindLabel(e.kind).toLowerCase()}</h2>
              {isFull ? (
                <div className="max-w-xl rounded-xl border border-border bg-card p-6">
                  <p className="font-semibold text-red-600 dark:text-red-400">This event is fully booked. Registrations are now closed.</p>
                </div>
              ) : (
                <div className="max-w-xl rounded-xl border border-border bg-card p-6">
                  <EventRegistrationForm eventId={e.id} eventTitle={e.title} />
                </div>
              )}
            </section>
          ) : null}
        </div>
        <aside className="h-fit space-y-4 rounded-xl border border-border bg-card p-6 lg:sticky lg:top-32" aria-label="Event details">
          <p className="inline-block rounded-full bg-plum-50 px-3 py-1 text-xs font-semibold text-plum-700 dark:bg-plum-900/40 dark:text-plum-300">{kindLabel(e.kind)}</p>
          <p className="flex gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-plum-700 dark:text-plum-300" aria-hidden="true" /><span><strong>{fmtRange(e.startsAt, e.endsAt)}</strong><br />{fmtTime(e.startsAt) !== '00:00' ? <span className="text-sm text-muted-foreground">Starts {fmtTime(e.startsAt)} IST</span> : <span className="text-sm text-muted-foreground">Time to be announced</span>}</span></p>
          {isOnline ? <p className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Online event</p> : null}
          {e.location ? <p className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-plum-700 dark:text-plum-300" aria-hidden="true" />{e.location}</p> : null}
          {canRegister && !e.link ? (
            <ButtonLink href="#register" className="w-full" aria-disabled={isFull}>
              {isFull ? 'Fully booked' : 'Register now'}
            </ButtonLink>
          ) : null}
          {upcoming && e.link ? (
            <ButtonLink href={e.link} target="_blank" rel="noopener noreferrer" className="w-full">
              Register now <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          ) : null}
          {seatsLeft !== null && seatsLeft > 0 && seatsLeft <= 5 ? (
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Only {seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left!</p>
          ) : seatsLeft !== null && seatsLeft > 5 ? (
            <p className="text-sm text-muted-foreground">{seatsLeft} of {e.seatLimit} seats available</p>
          ) : seatsLeft === 0 ? (
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">This event is fully booked.</p>
          ) : null}
          {!upcoming ? <p className="text-sm text-muted-foreground">This {kindLabel(e.kind).toLowerCase()} has ended.</p> : null}
          <ButtonLink href={parentHref} variant="outline" className="w-full">Back to {e.kind === 'BATCH' ? 'upcoming courses' : 'events'}</ButtonLink>
        </aside>
      </div>
    </>
  )
}
