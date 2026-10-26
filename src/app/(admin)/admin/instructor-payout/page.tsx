import { Card, DateRangeFilter, PageHeader, formatMoney } from '@/components/admin/ui'
import { DataTable, type Row } from '@/components/admin/DataTable'
import { getRevenueRows } from '@/lib/admin/queries'

export const metadata = { title: 'Instructor payout' }

/** Earnings owed per instructor for the chosen period. Payment status tracking is not part of Phase 2. */
export default async function PayoutPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams
  const { items, percent, fromStr, toStr } = await getRevenueRows(sp.from, sp.to)
  const by = new Map<string, { name: string; sales: number; gross: number }>()
  for (const i of items) {
    const key = i.course.instructor.id
    const cur = by.get(key) ?? { name: i.course.instructor.name ?? '—', sales: 0, gross: 0 }
    cur.sales += 1
    cur.gross += i.price
    by.set(key, cur)
  }
  const rows: Row[] = [...by.entries()].map(([id, v]) => {
    const owed = Math.round((v.gross * percent) / 100)
    return { id, cells: { name: { node: v.name, sort: v.name }, sales: { node: v.sales, sort: v.sales }, gross: { node: formatMoney(v.gross), sort: v.gross }, owed: { node: <strong>{formatMoney(owed)}</strong>, sort: owed } } }
  })
  return (
    <>
      <PageHeader title="Instructor payout" />
      <Card title="Amount payable to instructors">
        <DateRangeFilter from={fromStr} to={toStr} action="/admin/instructor-payout" />
        <p className="mb-4 text-center text-sm text-slate-600">Instructor share: {percent}% (change it under Instructor settings). Mark-as-paid tracking is not included yet.</p>
        <DataTable columns={[{ key: 'name', label: 'Instructor' }, { key: 'sales', label: 'Sales' }, { key: 'gross', label: 'Total amount' }, { key: 'owed', label: 'Payable' }]} rows={rows} />
      </Card>
    </>
  )
}
