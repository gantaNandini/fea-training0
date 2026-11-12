import { db } from '@/lib/db'
import { getFreshUser } from '@/lib/auth/guards'
import { forbidden, notFound, unauthenticated } from '@/lib/api/http'

export const dynamic = 'force-dynamic'

/** Neutralise spreadsheet formula injection, then quote for CSV. */
function cell(v: string | null | undefined): string {
  let s = (v ?? '').replace(/\r?\n/g, ' ')
  if (/^[=+\-@\t]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

/**
 * Admin only. GET /api/admin/events/registrations/export?eventId=... -> UTF-8 CSV (with BOM, so Excel opens it
 * correctly). Omit eventId to export every registration. `?emails=1` returns only a comma-separated email list.
 */
export async function GET(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  if (user.role !== 'ADMIN') return forbidden()

  const url = new URL(req.url)
  const eventId = url.searchParams.get('eventId') || undefined
  if (eventId) {
    const exists = await db.event.findUnique({ where: { id: eventId }, select: { id: true } })
    if (!exists) return notFound('Event not found.')
  }
  const rows = await db.eventRegistration.findMany({
    where: eventId ? { eventId } : undefined,
    orderBy: [{ eventId: 'asc' }, { createdAt: 'asc' }],
    include: { event: { select: { title: true, kind: true, startsAt: true } } },
  })

  if (url.searchParams.get('emails') === '1') {
    return new Response(rows.map((r) => r.email).join(', '), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }

  const header = ['Event', 'Type', 'Event date', 'Full name', 'Email', 'Phone', 'Organisation / College', 'Designation', 'Registered at (UTC)']
  const lines = [header.map(cell).join(',')]
  for (const r of rows) {
    lines.push(
      [
        r.event.title,
        r.event.kind,
        r.event.startsAt.toISOString().slice(0, 10),
        r.fullName,
        r.email,
        r.phone,
        r.organisation,
        r.designation,
        r.createdAt.toISOString().replace('T', ' ').slice(0, 19),
      ].map(cell).join(','),
    )
  }
  return new Response('\uFEFF' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="event-registrations${eventId ? `-${eventId}` : ''}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
