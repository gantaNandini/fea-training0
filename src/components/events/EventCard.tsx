import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { fmtRange, fmtTime, kindLabel, type EventDTO } from '@/lib/events'

export function EventCard({ e, past }: { e: EventDTO; past?: boolean }) {
  return (
    <article className="reveal card-lift flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[16/9] bg-muted">
        <PlaceholderArt src={e.image} alt={e.title} fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover object-top" />
        <span className="absolute left-3 top-3 rounded-full bg-plum-700 px-3 py-1 text-xs font-semibold text-white">{kindLabel(e.kind)}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-bold leading-snug">
          <Link href={`/events/${e.id}`} className="hover:text-link">{e.title}</Link>
        </h3>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
          {fmtRange(e.startsAt, e.endsAt)}
          {e.kind === 'WEBINAR' && fmtTime(e.startsAt) !== '00:00' ? ` · ${fmtTime(e.startsAt)}${e.endsAt ? `–${fmtTime(e.endsAt)}` : ''} IST` : ''}
        </p>
        {e.kind === 'WEBINAR' || /online/i.test(e.location ?? '') ? (
          <p className="inline-flex w-fit rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Online</p>
        ) : null}
        {e.location ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            {e.location}
          </p>
        ) : null}
        {e.summary ? <p className="line-clamp-3 text-sm">{e.summary}</p> : null}
        <Link href={`/events/${e.id}`} className="mt-auto inline-flex min-h-11 items-center font-semibold text-link underline-offset-4 hover:underline">
          {past ? 'View details' : e.kind === 'WEBINAR' || e.kind === 'WORKSHOP' ? 'Register now' : 'Details & registration'}
        </Link>
      </div>
    </article>
  )
}
