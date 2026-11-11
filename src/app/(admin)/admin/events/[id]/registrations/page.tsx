import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Users } from 'lucide-react'
import { Card, PageHeader } from '@/components/admin/ui'
import { db } from '@/lib/db'
import { getFreshUser } from '@/lib/auth/guards'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const event = await db.event.findUnique({ where: { id }, select: { title: true } })
  return { title: `Registrations — ${event?.title ?? 'Event'}` }
}

export default async function EventRegistrationsPage({ params }: Props) {
  const user = await getFreshUser()
  if (!user || user.role !== 'ADMIN') redirect('/admin-login')

  const { id } = await params

  const event = await db.event.findUnique({
    where: { id },
    select: {
      id: true, title: true, kind: true, startsAt: true, endsAt: true, maxSeats: true,
      _count: { select: { registrations: true } },
    },
  })
  if (!event) notFound()

  const registrations = await db.eventRegistration.findMany({
    where: { eventId: id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, fullName: true, email: true, phone: true, organisation: true, designation: true, createdAt: true },
  })

  const exportUrl = `/api/events/${id}/registrations?format=csv`

  return (
    <>
      <PageHeader
        title={`Registrations — ${event.title}`}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/events" className="inline-flex items-center gap-2 text-sm font-medium text-link hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Events
        </Link>
        <a
          href={exportUrl}
          className="inline-flex min-h-9 items-center gap-2 rounded-md bg-plum-700 px-4 text-sm font-semibold text-white hover:bg-plum-800"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </a>
      </div>

      <Card title={`${registrations.length} registration${registrations.length !== 1 ? 's' : ''}${event.maxSeats ? ` / ${event.maxSeats} seats` : ''}`}>
        {registrations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Users className="h-10 w-10 opacity-30" aria-hidden="true" />
            <p className="text-sm">No registrations yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-semibold">#</th>
                  <th className="py-2 text-left font-semibold">Name</th>
                  <th className="py-2 text-left font-semibold">Email</th>
                  <th className="py-2 text-left font-semibold">Phone</th>
                  <th className="py-2 text-left font-semibold">Organisation</th>
                  <th className="py-2 text-left font-semibold">Designation</th>
                  <th className="py-2 text-left font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r, i) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 font-medium">{r.fullName}</td>
                    <td className="py-2"><a href={`mailto:${r.email}`} className="text-link hover:underline">{r.email}</a></td>
                    <td className="py-2">{r.phone}</td>
                    <td className="py-2">{r.organisation ?? '—'}</td>
                    <td className="py-2">{r.designation ?? '—'}</td>
                    <td className="py-2 text-muted-foreground">
                      {r.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
