import { fail, ok, parseBody } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { ensureCartSessionId, readCartSessionId } from '@/lib/cart/session'
import {
  addCartItem,
  buildCartResponse,
  getCartCourseIds,
  removeCartItem,
  type CartOwner,
} from '@/lib/data/cart'
import { getCoursesForPurchase } from '@/lib/data/courses'
import { isEnrolled } from '@/lib/data/progress'
import { cartAddSchema } from '@/lib/utils/validation'
import { messages } from '@/lib/messages'

export const dynamic = 'force-dynamic'

async function resolveOwner(create: boolean): Promise<{ owner: CartOwner | null; userId: string | null }> {
  const user = await getFreshUser()
  if (user) return { owner: { userId: user.id }, userId: user.id }
  const sid = create ? await ensureCartSessionId() : await readCartSessionId()
  return { owner: sid ? { sessionId: sid } : null, userId: null }
}

/** GET /api/cart?coupon=CODE -> items, server-computed totals, coupon validity (REQ-131..133). */
export async function GET(req: Request) {
  const { owner } = await resolveOwner(false)
  const coupon = new URL(req.url).searchParams.get('coupon')
  const cartIds = owner ? await getCartCourseIds(owner) : []
  const cart = await buildCartResponse(cartIds, coupon)
  return ok({ ...cart, cartIds })
}

export async function POST(req: Request) {
  const parsed = await parseBody(req, cartAddSchema)
  if (parsed.error) return parsed.error
  const { courseId } = parsed.data

  const [course] = await getCoursesForPurchase([courseId])
  if (!course) return fail('NOT_FOUND', 'Course not found.', 404)
  if (course.status !== 'PUBLISHED') return fail('COURSE_UNAVAILABLE', messages.cart.unavailable, 400)

  const { owner, userId } = await resolveOwner(true)
  if (!owner) return fail('NO_SESSION', messages.common.somethingWrong, 500)
  if (userId && (await isEnrolled(userId, courseId))) {
    return fail('ALREADY_ENROLLED', messages.cart.alreadyEnrolled, 409) // REQ-134
  }
  await addCartItem(owner, courseId)
  return ok({ cartIds: await getCartCourseIds(owner) })
}

export async function DELETE(req: Request) {
  const parsed = await parseBody(req, cartAddSchema)
  if (parsed.error) return parsed.error
  const { owner } = await resolveOwner(false)
  if (!owner) return ok({ cartIds: [] })
  await removeCartItem(owner, parsed.data.courseId)
  return ok({ cartIds: await getCartCourseIds(owner) })
}
