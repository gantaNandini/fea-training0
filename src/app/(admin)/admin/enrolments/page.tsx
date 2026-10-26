import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { ActionButton } from '@/components/admin/ActionButton'
import { Card, DateRangeFilter, PageHeader, btn } from '@/components/admin/ui'
import { DataTable, type Row } from '@/components/admin/DataTable'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { getEnrolments } from '@/lib/admin/queries'
import { removeEnrolment } from '../actions'

export const metadata = { title: 'Enrol history' }

export default async function EnrolHistoryPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams
  const { rows: data, fromStr, toStr } = await getEnrolments(sp.from, sp.to)
  const rows: Row[] = data.map((e) => {
    const date = e.enrolledAt.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    return {
      id: e.id,
      cells: {
        photo: { node: <span className="relative block h-11 w-11 overflow-hidden rounded-full bg-slate-200"><PlaceholderArt src={e.user.image ?? 'placeholder:avatar'} alt="" label={e.user.name ?? e.user.email} fill sizes="44px" className="object-cover" /></span>, sort: '' },
        user: { node: <div><p className="font-semibold text-slate-800">{e.user.name ?? '—'}</p><p className="text-xs text-slate-500">Email: {e.user.email}</p></div>, sort: e.user.name ?? e.user.email, search: `${e.user.name} ${e.user.email}` },
        course: { node: <Link href={`/courses/${e.course.slug}`} className="font-semibold text-adm-accent-dark hover:underline">{e.course.title}</Link>, sort: e.course.title },
        date: { node: date, sort: e.enrolledAt.getTime(), search: date },
        actions: { node: <ActionButton variant="danger" label="Remove enrolment" confirm="Remove this enrolment? The student loses access and progress stays on record." action={removeEnrolment.bind(null, e.id)}><Trash2 className="h-4 w-4" aria-hidden="true" /></ActionButton>, sort: '' },
      },
    }
  })
  return (
    <>
      <PageHeader title="Enrol history" actions={<Link href="/admin/enrolments/new" className={btn('primary')}>Enrol a student</Link>} />
      <Card title="Enrol histories">
        <DateRangeFilter from={fromStr} to={toStr} action="/admin/enrolments" />
        <DataTable
          columns={[{ key: 'photo', label: 'Photo', sortable: false }, { key: 'user', label: 'User name' }, { key: 'course', label: 'Enrolled course' }, { key: 'date', label: 'Enrolment date' }, { key: 'actions', label: 'Actions', sortable: false }]}
          rows={rows}
        />
      </Card>
    </>
  )
}
