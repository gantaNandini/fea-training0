/** Shared (client + server safe) event helpers. Dates are stored as the wall-clock time the admin typed, so they are shown in UTC. */
export const EVENT_KINDS: Record<string, string> = {
  CONFERENCE: 'Conference',
  WORKSHOP: 'Workshop',
  WEBINAR: 'Webinar',
  BATCH: 'Course batch',
}

export const kindLabel = (k: string) => EVENT_KINDS[k] ?? 'Event'

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
}

export function fmtRange(startsAt: string, endsAt: string | null): string {
  const a = fmtDate(startsAt)
  if (!endsAt) return a
  const b = fmtDate(endsAt)
  return a === b ? a : `${a} – ${b}`
}

export interface EventDTO {
  id: string
  kind: string
  title: string
  summary: string | null
  description: string | null
  startsAt: string
  endsAt: string | null
  location: string | null
  link: string | null
  documentUrl: string | null
  image: string | null
  internalRegistration: boolean
  maxSeats: number | null
  registrationCount: number
}

/** An event is "upcoming" until the end of its last day. */
export function isUpcoming(e: Pick<EventDTO, 'startsAt' | 'endsAt'>, now = Date.now()): boolean {
  const end = new Date(e.endsAt ?? e.startsAt).getTime() + 24 * 3600 * 1000
  return end > now
}
