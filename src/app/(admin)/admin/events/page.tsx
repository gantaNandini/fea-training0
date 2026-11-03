import { Card, PageHeader } from '@/components/admin/ui'
import { RecordManager } from '@/components/admin/RecordManager'
import { listRecords } from '@/lib/admin/records.server'

export const metadata = { title: 'Events and course batches' }

export default async function EventsAdminPage() {
  const records = await listRecords('event')
  return (
    <>
      <PageHeader title="Events and course batches" />
      <Card title="Add events (conferences, workshops, webinars) and upcoming course batches">
        <p className="mb-4 max-w-2xl text-sm text-slate-600">
          Items with type <strong>Course batch</strong> appear under <em>Upcoming Courses</em>; everything else appears under <em>Events</em>.
          Past events move to the “Past events” list automatically. Courses with status <strong>Upcoming</strong> also appear on the Upcoming Courses page.
        </p>
        <RecordManager model="event" records={records} />
      </Card>
    </>
  )
}
