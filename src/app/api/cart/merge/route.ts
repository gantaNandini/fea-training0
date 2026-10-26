import { ok, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { clearCartSession, readCartSessionId } from '@/lib/cart/session'
import { getCartCourseIds, mergeGuestCart } from '@/lib/data/cart'

/**
 * REQ-125 / REQ-280B: called unconditionally once after every sign-in. Idempotent — it no-ops when
 * there is no (valid) cart_session cookie or the guest cart is empty.
 */
export async function POST() {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const sid = await readCartSessionId()
  if (!sid) return ok({ cartIds: await getCartCourseIds({ userId: user.id }) })
  const cartIds = await mergeGuestCart(sid, user.id)
  await clearCartSession()
  return ok({ cartIds })
}
