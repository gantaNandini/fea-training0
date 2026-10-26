import { ok, parseBody, unauthenticated, fail } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { addWishlist, getWishlistIds, removeWishlist } from '@/lib/data/wishlist'
import { getCoursesForPurchase } from '@/lib/data/courses'
import { cartAddSchema } from '@/lib/utils/validation'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  return ok({ wishlistIds: await getWishlistIds(user.id) })
}

export async function POST(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const parsed = await parseBody(req, cartAddSchema)
  if (parsed.error) return parsed.error
  const [course] = await getCoursesForPurchase([parsed.data.courseId])
  if (!course) return fail('NOT_FOUND', 'Course not found.', 404)
  await addWishlist(user.id, course.id)
  return ok({ wishlistIds: await getWishlistIds(user.id) })
}

export async function DELETE(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const parsed = await parseBody(req, cartAddSchema)
  if (parsed.error) return parsed.error
  await removeWishlist(user.id, parsed.data.courseId)
  return ok({ wishlistIds: await getWishlistIds(user.id) })
}
