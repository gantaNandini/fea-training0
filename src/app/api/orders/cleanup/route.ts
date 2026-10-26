import { fail, isCronAuthorized, ok } from '@/lib/api/http'
import { cleanupStaleOrders } from '@/lib/data/orders'

/** REQ-290B / REQ-318: PENDING orders older than 24 h -> FAILED, coupon reservations released. */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return fail('UNAUTHORIZED', 'Unauthorized', 401)
  return ok({ failed: await cleanupStaleOrders() })
}
