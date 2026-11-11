import Link from 'next/link'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { fmtRange, isUpcoming, kindLabel, type EventDTO } from '@/lib/events'

export function EventCard({ e, past }: { e: EventDTO; past?: boolean }) {
  const upcoming = isUpcoming(e)
  const seatsLeft =
    e.internalRegistration && e.maxSeats !== null
      ? Math.max(0, e.maxSeats - e.registrationCount)
      : null
  const seatsFull = seatsLeft !== null && seatsLeft === 0

  return (
    <article className="reveal card-lift flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[16/9] bg-muted">
        <PlaceholderArt src={e.image} alt={e.title} fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-plum-700 px-3 py-1 text-xs font-semibold text-white">
          {kindLabel(e.kind)}
        </span>
        {upcoming && e.internalRegistration && seatsLeft !== null && seatsLeft <= 10 && seatsLeft > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
            {seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-bold leading-snug">
          <Link href={`/events/${e.id}`} className="hover:text-link">{e.title}</Link>
        </h3>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
          {fmtRange(e.startsAt, e.endsAt)}
        </p>
        {e.location ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            {e.location}
          </p>
        ) : null}
        {e.internalRegistration && e.maxSeats !== null && seatsLeft !== null ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            {seatsFull ? 'Fully booked' : `${e.registrationCount} / ${e.maxSeats} registered`}
          </p>
        ) : null}
        {e.summary ? <p className="line-clamp-3 text-sm">{e.summary}</p> : null}
        <div className="mt-auto flex flex-wrap gap-2">
          {upcoming && e.internalRegistration && !seatsFull ? (
            <Link
              href={`/events/${e.id}#reg-heading`}
              className="inline-flex min-h-11 items-center rounded-md bg-plum-700 px-4 text-sm font-semibold text-white hover:bg-plum-800"
            >
              Register now
            </Link>
          ) : null}
          <Link
            href={`/events/${e.id}`}
            className="inline-flex min-h-11 items-center font-semibold text-link underline-offset-4 hover:underline"
          >
            {past ? 'View details' : seatsFull ? 'View details (full)' : upcoming && !e.internalRegistration ? 'Details & registration' : 'View details'}
          </Link>
        </div>
      </div>
    </article>
  )
}
