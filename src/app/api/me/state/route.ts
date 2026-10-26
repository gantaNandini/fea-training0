import { ok } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { readCartSessionId } from '@/lib/cart/session'
import { getCartCourseIds } from '@/lib/data/cart'
import { getWishlistIds } from '@/lib/data/wishlist'
import { getEnrolledCourseIds } from '@/lib/data/progress'
import type { MeState } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * REQ-280A: per-user state, always no-store, NO side effects (the guest-cart merge is a separate
 * POST /api/cart/merge). Unauthenticated callers still get their guest cart ids.
 */
export async function GET() {
  const user = await getFreshUser()
  if (!user) {
    const sid = await readCartSessionId()
    const cartIds = sid ? await getCartCourseIds({ sessionId: sid }) : []
    const body: MeState = { wishlistIds: [], cartIds, enrolledIds: [], user: null }
    return ok(body)
  }
  const [wishlistIds, cartIds, enrolledIds] = await Promise.all([
    getWishlistIds(user.id),
    getCartCourseIds({ userId: user.id }),
    getEnrolledCourseIds(user.id),
  ])
  const body: MeState = { wishlistIds, cartIds, enrolledIds, user: { name: user.name, image: user.image } }
  return ok(body)
}
