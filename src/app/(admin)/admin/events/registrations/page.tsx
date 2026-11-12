import Link from 'next/link'
import { Card, PageHeader } from '@/components/admin/ui'
import { db } from '@/lib/db'
import { fmtRange, kindLabel } from '@/lib/events'

export const metadata = { title: 'Event registrations' }
export const dynamic = 'force-dynamic'

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<{ eventId?: string }> }) {
  const { eventId } = await searchParams
  const events = await db.event.findMany({
    where: { kind: { in: ['WEBINAR', 'WORKSHOP'] } },
    orderBy: { startsAt: 'asc' },
    include: { _count: { select: { registrations: true } } },
  })
  const selected = events.find((e) => e.id === eventId)
  const rows = selected
    ? await db.eventRegistration.findMany({ where: { eventId: selected.id }, orderBy: { createdAt: 'asc' } })
    : []
  const exportHref = (id?: string, extra = '') => `/api/admin/events/registrations/export${id ? `?eventId=${id}${extra}` : extra ? `?${extra.slice(1)}` : ''}`

  return (
    <>
      <PageHeader title="Event registrations" />
      <Card
        title="Webinars and workshops"
        actions={<a href={exportHref()} className="rounded-md bg-adm-accent px-3 py-2 text-sm font-semibold text-white">Export all (CSV for Excel)</a>}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-2 pr-4">Event</th><th className="pr-4">Type</th><th className="pr-4">Date</th><th className="pr-4">Registrations</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-slate-200">
                  <td className="py-2 pr-4 font-medium">{e.title}</td>
                  <td className="pr-4">{kindLabel(e.kind)}</td>
                  <td className="pr-4">{fmtRange(e.startsAt.toISOString(), e.endsAt?.toISOString() ?? null)}</td>
                  <td className="pr-4 tabular-nums">{e._count.registrations}</td>
                  <td className="space-x-3">
                    <Link className="font-semibold text-adm-accent" href={`/admin/events/registrations?eventId=${e.id}`}>View</Link>
                    <a className="font-semibold text-adm-accent" href={exportHref(e.id)}>CSV</a>
                    <a className="font-semibold text-adm-accent" href={exportHref(e.id, '&emails=1')} target="_blank" rel="noopener noreferrer">Emails</a>
                  </td>
                </tr>
              ))}
              {events.length === 0 ? <tr><td colSpan={5} className="py-6 text-slate-500">No webinars or workshops yet. Add them under Events &amp; batches.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
      {selected ? (
        <Card title={`Registrations: ${selected.title} (${rows.length})`}>
          {rows.length === 0 ? <p className="text-sm text-slate-500">No registrations yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr><th className="py-2 pr-4">#</th><th className="pr-4">Name</th><th className="pr-4">Email</th><th className="pr-4">Phone</th><th className="pr-4">Organisation / college</th><th className="pr-4">Designation</th><th>Registered</th></tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id} className="border-t border-slate-200">
                      <td className="py-2 pr-4 tabular-nums">{i + 1}</td><td className="pr-4">{r.fullName}</td><td className="pr-4">{r.email}</td>
                      <td className="pr-4">{r.phone}</td><td className="pr-4">{r.organisation}</td><td className="pr-4">{r.designation ?? '—'}</td>
                      <td>{r.createdAt.toISOString().slice(0, 16).replace('T', ' ')} UTC</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}
    </>
  )
}
