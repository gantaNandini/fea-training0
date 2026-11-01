import { Check, X } from 'lucide-react'
import { ActionButton } from '@/components/admin/ActionButton'
import { Card, PageHeader } from '@/components/admin/ui'
import { DataTable, type Row } from '@/components/admin/DataTable'
import { db } from '@/lib/db'
import { formatINR } from '@/lib/utils/pricing'
import { rejectManualPayment, verifyManualPayment } from '../actions'

export const metadata = { title: 'Manual payments' }
export const dynamic = 'force-dynamic'

/**
 * Static UPI QR claims. A claim never grants access by itself: an admin compares the UTR and amount with
 * the bank statement / Razorpay dashboard and only then presses Verify.
 */
export default async function ManualPaymentsPage() {
  const claims = await db.manualPayment.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 300,
    include: { user: { select: { name: true, email: true } }, order: { select: { orderNumber: true, items: { select: { titleSnapshot: true } } } } },
  })

  const rows: Row[] = claims.map((c) => {
    const when = c.createdAt.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const pending = c.status === 'PENDING'
    return {
      id: c.id,
      cells: {
        user: { node: <div><p className="font-semibold text-slate-800">{c.user.name ?? '—'}</p><p className="text-xs text-slate-500">{c.user.email}</p></div>, sort: c.user.email, search: `${c.user.name} ${c.user.email}` },
        order: { node: <div><p className="text-xs text-slate-500">{c.order.orderNumber}</p><p>{c.order.items.map((i) => i.titleSnapshot).join(', ')}</p></div>, sort: c.order.orderNumber, search: c.order.orderNumber },
        amount: { node: <strong>{formatINR(c.amount)}</strong>, sort: c.amount },
        utr: { node: <code className="text-sm">{c.utr}</code>, sort: c.utr, search: c.utr },
        status: { node: <span className={pending ? 'font-semibold text-amber-700' : c.status === 'VERIFIED' ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>{c.status === 'PENDING' ? 'Pending verification' : c.status === 'VERIFIED' ? 'Verified' : 'Rejected'}</span>, sort: c.status },
        date: { node: when, sort: c.createdAt.getTime(), search: when },
        actions: {
          node: pending ? (
            <div className="flex gap-2">
              <ActionButton variant="primary" label="Verify payment" confirm={`Verify UTR ${c.utr} for ${formatINR(c.amount)}? Only do this after you have seen this exact amount and UTR in the bank or Razorpay records. The student will be enrolled immediately.`} action={verifyManualPayment.bind(null, c.id)}><Check className="h-4 w-4" aria-hidden="true" /> Verify</ActionButton>
              <ActionButton variant="danger" label="Reject payment" confirm="Reject this payment? No access will be granted." action={rejectManualPayment.bind(null, c.id)}><X className="h-4 w-4" aria-hidden="true" /> Reject</ActionButton>
            </div>
          ) : <span className="text-xs text-slate-500">{c.adminNote ?? ''}</span>,
          sort: '',
        },
      },
    }
  })

  return (
    <>
      <PageHeader title="Manual payments (UPI QR)" />
      <Card title="Payments awaiting verification">
        <p className="mb-3 text-sm text-slate-600">
          Compare the UTR and amount with your bank statement or the Razorpay dashboard before pressing <strong>Verify</strong>.
          A screenshot or the customer&rsquo;s word is never enough.
        </p>
        <DataTable
          columns={[{ key: 'user', label: 'Customer' }, { key: 'order', label: 'Order' }, { key: 'amount', label: 'Amount' }, { key: 'utr', label: 'UTR' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Submitted' }, { key: 'actions', label: 'Actions', sortable: false }]}
          rows={rows}
        />
      </Card>
    </>
  )
}
