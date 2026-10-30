import { fail, ok, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { getOrderStatusForUser } from '@/lib/data/orders'
import { reconcileOrder } from '@/lib/orders/reconcile'

export const dynamic = 'force-dynamic'

/**
 * REQ-286: owner only. While the order is PENDING we also ask the gateway whether it was paid
 * (self-healing enrolment), so access never depends on the webhook or on an admin.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const { orderId } = await ctx.params
  let order = await getOrderStatusForUser(orderId, user.id)
  if (!order) return fail('NOT_FOUND', 'Order not found.', 404)
  if (order.status === 'PENDING' && (await reconcileOrder(orderId))) {
    order = (await getOrderStatusForUser(orderId, user.id)) ?? order
  }
  return ok({ status: order.status, orderNumber: order.orderNumber })
}
