import { db } from '@/lib/db'
import { ok, forbidden } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

/** GET /api/events/[eventId]/registrations — admin only. Returns CSV when ?format=csv. */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ eventId: string }> },
) {
  const user = await getFreshUser()
  if (!user || user.role !== 'ADMIN') return forbidden()

  const { eventId } = await ctx.params
  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format')

  const rows = await db.eventRegistration.findMany({
    where:   { eventId },
    orderBy: { createdAt: 'asc' },
    select:  { id: true, fullName: true, email: true, phone: true, organisation: true, designation: true, createdAt: true },
  })

  if (format === 'csv') {
    const headers = ['Name', 'Email', 'Phone', 'Organisation', 'Designation', 'Registered At']
    const csvRows = rows.map((r) => [
      csvCell(r.fullName),
      csvCell(r.email),
      csvCell(r.phone),
      csvCell(r.organisation ?? ''),
      csvCell(r.designation ?? ''),
      csvCell(r.createdAt.toISOString()),
    ])
    const csv = [headers.map(csvCell).join(','), ...csvRows.map((r) => r.join(','))].join('\n')
    return new Response(csv, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="registrations-${eventId}.csv"`,
        'Cache-Control':       'no-store',
      },
    })
  }

  return ok({ registrations: rows, total: rows.length })
}

function csvCell(v: string): string {
  if (/[,"\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}
