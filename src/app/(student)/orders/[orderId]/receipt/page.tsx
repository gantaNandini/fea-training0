import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { PrintButton } from '@/components/checkout/PrintButton'
import { getFreshUser } from '@/lib/auth/guards'
import { getOrderSummary } from '@/lib/data/orders'
import { getSettings } from '@/lib/data/settings'
import { formatINR } from '@/lib/utils/pricing'
import { messages } from '@/lib/messages'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: messages.checkout.receiptTitle, robots: { index: false, follow: false } }

/** REQ-148: printable receipt for the order owner (or an admin); COMPLETED orders only. */
export default async function ReceiptPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const user = await getFreshUser()
  if (!user) redirect(`/login?redirect=/orders/${orderId}/receipt`)
  const order = await getOrderSummary(orderId)
  if (!order || (order.userId !== user.id && user.role !== 'ADMIN')) notFound()
  if (order.status !== 'COMPLETED') notFound()
  const settings = await getSettings()
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-2xl">{messages.checkout.receiptTitle}</h1>
        <PrintButton />
      </div>
      <article className="rounded-xl border border-border bg-card p-6 md:p-8 print:border-0 print:p-0" data-testid="receipt">
        <header className="flex flex-wrap justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="font-display text-xl font-bold">{settings.company_name}</p>
            <p className="text-sm text-muted-foreground">{settings.address}</p>
            <p className="text-sm text-muted-foreground">
              {messages.checkout.gstin}: {settings.gstin || '— (to be supplied)'}
            </p>
          </div>
          <dl className="text-sm">
            <div className="flex gap-2"><dt className="text-muted-foreground">{messages.checkout.orderNumber}:</dt><dd className="font-semibold">{order.orderNumber}</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">{messages.checkout.date}:</dt><dd>{date}</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">Invoice no.:</dt><dd>{settings.invoice_prefix ? `${settings.invoice_prefix}-${order.orderNumber}` : '— (to be supplied)'}</dd></div>
          </dl>
        </header>
        <section className="border-b border-border py-5 text-sm">
          <p className="text-muted-foreground">{messages.checkout.billedTo}</p>
          <p className="font-semibold">{order.billingName}</p>
          <p>{order.billingEmail}</p>
        </section>
        <table className="my-5 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-2">{messages.checkout.item}</th>
              <th scope="col" className="py-2 text-right">{messages.checkout.amount}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.courseId} className="border-b border-border">
                <td className="py-2">{i.title}</td>
                <td className="py-2 text-right">{formatINR(i.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="ml-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt>{messages.cart.subtotal}</dt><dd>{formatINR(order.subtotal)}</dd></div>
          {order.discount > 0 ? (
            <div className="flex justify-between"><dt>{messages.cart.discount}{order.couponCode ? ` (${order.couponCode})` : ''}</dt><dd>−{formatINR(order.discount)}</dd></div>
          ) : null}
          <div className="flex justify-between"><dt>GST{order.gstMode === 'INCLUSIVE' ? ' (included)' : ''}</dt><dd>{formatINR(order.gst)}</dd></div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>{messages.cart.total}</dt><dd>{formatINR(order.total)}</dd></div>
        </dl>
      </article>
    </div>
  )
}
