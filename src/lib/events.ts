// MoM item 6 (R6): Conferences removed from public tabs. CONFERENCE key kept for legacy DB rows.
export const EVENT_KINDS: Record<string, string> = {
  WORKSHOP: 'Workshop',
  WEBINAR: 'Webinar',
  BATCH: 'Course batch',
  CONFERENCE: 'Conference', // legacy — not shown in public tabs
}

export const kindLabel = (k: string) => EVENT_KINDS[k] ?? 'Event'

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}

export function fmtRange(startsAt: string, endsAt: string | null): string {
  const a = fmtDate(startsAt)
  if (!endsAt) return a
  const b = fmtDate(endsAt)
  return a === b ? a : `${a} \u2013 ${b}`
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
  /** NULL = unlimited. Positive integer = max registrations allowed. */
  seatLimit: number | null
}

/** An event is "upcoming" until the end of its last day. Accepts ISO strings or Date objects. */
export function isUpcoming(e: { startsAt: string | Date; endsAt?: string | Date | null }, now = Date.now()): boolean {
  const endRaw = e.endsAt ?? e.startsAt
  const end = endRaw instanceof Date ? endRaw.getTime() : new Date(endRaw).getTime()
  return end + 24 * 3600 * 1000 > now
}
