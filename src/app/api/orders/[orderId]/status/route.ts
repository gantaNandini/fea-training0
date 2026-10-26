import { fail, ok, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { getOrderStatusForUser } from '@/lib/data/orders'

export const dynamic = 'force-dynamic'

/** REQ-286: owner only. */
export async function GET(_req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const { orderId } = await ctx.params
  const order = await getOrderStatusForUser(orderId, user.id)
  if (!order) return fail('NOT_FOUND', 'Order not found.', 404)
  return ok({ status: order.status, orderNumber: order.orderNumber })
}
