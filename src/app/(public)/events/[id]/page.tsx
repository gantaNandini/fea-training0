import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CalendarDays, Download, ExternalLink, MapPin } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { ButtonLink } from '@/components/ui/button'
import { getEventById } from '@/lib/data/events'
import { fmtRange, fmtTime, isUpcoming, kindLabel } from '@/lib/events'
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

  return (
    <>
      <PageHero title={e.title} subtitle={e.summary ?? undefined} crumb={e.kind === 'BATCH' ? 'Upcoming courses' : 'Events'} />
      <div className="container-page grid gap-10 py-10 md:py-14 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-8">
          {e.image ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-muted">
              <PlaceholderArt src={e.image} alt={e.title} fill sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" priority />
            </div>
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
                Download brochure / programme
              </a>
            </section>
          ) : null}
        </div>
        <aside className="h-fit space-y-4 rounded-xl border border-border bg-card p-6 lg:sticky lg:top-32" aria-label="Event details">
          <p className="inline-block rounded-full bg-plum-50 px-3 py-1 text-xs font-semibold text-plum-700 dark:bg-plum-900/40 dark:text-plum-300">{kindLabel(e.kind)}</p>
          <p className="flex gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-plum-700 dark:text-plum-300" aria-hidden="true" /><span><strong>{fmtRange(e.startsAt, e.endsAt)}</strong><br /><span className="text-sm text-muted-foreground">Starts {fmtTime(e.startsAt)}</span></span></p>
          {e.location ? <p className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-plum-700 dark:text-plum-300" aria-hidden="true" />{e.location}</p> : null}
          {upcoming && e.link ? (
            <ButtonLink href={e.link} target="_blank" rel="noopener noreferrer" className="w-full">
              Register now <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          ) : null}
          {!upcoming ? <p className="text-sm text-muted-foreground">This {kindLabel(e.kind).toLowerCase()} has ended.</p> : null}
          <ButtonLink href={parentHref} variant="outline" className="w-full">Back to {e.kind === 'BATCH' ? 'upcoming courses' : 'events'}</ButtonLink>
        </aside>
      </div>
    </>
  )
}
