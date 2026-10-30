import { fail, isCronAuthorized, ok } from '@/lib/api/http'
import { cleanupStaleOrders } from '@/lib/data/orders'
import { reconcilePendingOrders } from '@/lib/orders/reconcile'

/**
 * REQ-290B / REQ-318: PENDING orders older than 24 h -> FAILED, coupon reservations released.
 * Before failing anything, recover any order the gateway shows as paid (late webhook / closed tab).
 */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return fail('UNAUTHORIZED', 'Unauthorized', 401)
  const recovered = await reconcilePendingOrders()
  return ok({ recovered, failed: await cleanupStaleOrders() })
}
