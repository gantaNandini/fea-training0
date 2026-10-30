import { db } from '@/lib/db'
import { getPaymentProvider } from '@/lib/payments'
import { OrderError, completeOrder } from './complete-order'

/**
 * Self-healing enrolment. The normal path is: checkout -> /api/payments/verify -> completeOrder.
 * The webhook is the second path. This is the third: if the buyer closed the tab right after paying
 * and the webhook is late or misconfigured, ask the gateway directly whether the order was paid and,
 * if so, complete it. completeOrder is idempotent and amount-checked, so calling this any number
 * of times is safe. No admin involvement at any point.
 *
 * Returns true when the order is (now) COMPLETED.
 */
export async function reconcileOrder(orderId: string): Promise<boolean> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, total: true, razorpayOrderId: true },
  })
  if (!order) return false
  if (order.status === 'COMPLETED') return true
  if (order.status !== 'PENDING' && order.status !== 'FAILED') return false
  if (!order.razorpayOrderId) return false

  try {
    const provider = getPaymentProvider()
    const payments = await provider.fetchOrderPayments(order.razorpayOrderId)
    const paid = payments.find(
      (p) => (p.status === 'captured' || p.status === 'authorized') && p.amount === order.total,
    )
    if (!paid) return false
    await completeOrder(order.id, {
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: paid.paymentId,
      method: paid.method,
      amount: paid.amount,
    })
    return true
  } catch (e) {
    if (!(e instanceof OrderError)) console.error('[reconcile]', e)
    return false
  }
}

/** Unfinished orders. Used by the cron so late payments are never marked FAILED. */
export async function reconcilePendingOrders(): Promise<number> {
  const pending = await db.order.findMany({
    where: { status: 'PENDING', razorpayOrderId: { not: null } },
    select: { id: true },
    take: 200,
  })
  let n = 0
  for (const o of pending) if (await reconcileOrder(o.id)) n++
  return n
}
