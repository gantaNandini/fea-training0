import { fail, isCronAuthorized, ok } from '@/lib/api/http'
import { deleteStaleGuestCarts } from '@/lib/data/cart'

/** REQ-130 / REQ-318: guest rows older than 30 days. GET + Bearer CRON_SECRET (Vercel Cron). */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return fail('UNAUTHORIZED', 'Unauthorized', 401)
  return ok({ deleted: await deleteStaleGuestCarts() })
}
