import { notFound } from 'next/navigation'
import { Card, DateRangeFilter, PageHeader, formatMoney } from '@/components/admin/ui'
import { DataTable, type Row } from '@/components/admin/DataTable'
import { getRevenueRows } from '@/lib/admin/queries'

export const metadata = { title: 'Revenue report' }

export default async function ReportPage({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<{ from?: string; to?: string }> }) {
  const { kind } = await params
  if (kind !== 'admin-revenue' && kind !== 'instructor-revenue') notFound()
  const sp = await searchParams
  const { items, percent, fromStr, toStr } = await getRevenueRows(sp.from, sp.to)
  const admin = kind === 'admin-revenue'
  const fmtDate = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const rows: Row[] = items.map((i) => {
    const share = Math.round((i.price * (admin ? 100 - percent : percent)) / 100)
    const date = fmtDate(i.order.createdAt)
    return {
      id: i.id,
      cells: {
        course: { node: i.titleSnapshot, sort: i.titleSnapshot },
        instructor: { node: i.course.instructor.name ?? '—', sort: i.course.instructor.name ?? '' },
        total: { node: formatMoney(i.price), sort: i.price },
        share: { node: formatMoney(share), sort: share },
        date: { node: date, sort: i.order.createdAt.getTime(), search: date },
      },
    }
  })
  const totalShare = rows.reduce((s, r) => s + Number(r.cells.share.sort), 0)
  const columns = admin
    ? [{ key: 'course', label: 'Enrolled course' }, { key: 'total', label: 'Total amount' }, { key: 'share', label: 'Admin revenue' }, { key: 'date', label: 'Enrolment date' }]
    : [{ key: 'course', label: 'Enrolled course' }, { key: 'instructor', label: 'Instructor' }, { key: 'total', label: 'Total amount' }, { key: 'share', label: 'Instructor revenue' }]

  return (
    <>
      <PageHeader title={admin ? 'Admin revenue' : 'Instructor revenue'} />
      <Card title={admin ? 'Admin revenue' : 'Instructor revenue'}>
        <DateRangeFilter from={fromStr} to={toStr} action={`/admin/reports/${kind}`} />
        <p className="mb-4 text-center text-sm text-slate-600">
          {rows.length} sales in range · {admin ? 'admin' : 'instructor'} revenue <strong>{formatMoney(totalShare)}</strong> (instructor share {percent}% of the course price; GST and coupon discounts are not deducted here)
        </p>
        <DataTable columns={columns} rows={rows} />
      </Card>
    </>
  )
}
