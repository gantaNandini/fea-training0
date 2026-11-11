import Link from 'next/link'
import { Users } from 'lucide-react'
import { Card, PageHeader } from '@/components/admin/ui'
import { RecordManager } from '@/components/admin/RecordManager'
import { listRecords } from '@/lib/admin/records.server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Events and course batches' }

export default async function EventsAdminPage() {
  const [records, eventsWithReg] = await Promise.all([
    listRecords('event'),
    db.event.findMany({
      where: { internalRegistration: true },
      select: { id: true, title: true, _count: { select: { registrations: true } } },
      orderBy: { startsAt: 'desc' },
    }),
  ])

  return (
    <>
      <PageHeader title="Events and course batches" />
      <Card title="Add events (conferences, workshops, webinars) and upcoming course batches">
        <p className="mb-4 max-w-2xl text-sm text-slate-600">
          Items with type <strong>Course batch</strong> appear under <em>Upcoming Courses</em>; everything else appears under <em>Events</em>.
          Past events move to the &quot;Past events&quot; list automatically. When <strong>Accept registrations on this website</strong> is enabled, a registration form is shown instead of the external link.
        </p>
        <RecordManager model="event" records={records} />
      </Card>

      {eventsWithReg.length > 0 ? (
        <Card title="Event registrations" className="mt-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Click an event to view registrations and export a CSV for sending meeting links.
          </p>
          <ul className="divide-y divide-border">
            {eventsWithReg.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between gap-4 py-3">
                <span className="font-medium">{ev.title}</span>
                <Link
                  href={`/admin/events/${ev.id}/registrations`}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-semibold hover:bg-muted"
                >
                  <Users className="h-4 w-4" aria-hidden="true" />
                  {ev._count.registrations} registrant{ev._count.registrations !== 1 ? 's' : ''}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  )
}
