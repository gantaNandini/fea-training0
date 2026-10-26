import { createHash } from 'crypto'
import { getPaymentProvider } from '@/lib/payments'
import { mockPaymentFor } from '@/lib/payments/mock'
import { getCartCourseIds, findCouponByCode } from '@/lib/data/cart'
import { getCoursesForPurchase } from '@/lib/data/courses'
import { getEnrolledCourseIds } from '@/lib/data/progress'
import { getSettings } from '@/lib/data/settings'
import {
  CouponUnavailableError,
  createPendingOrder,
  failOrderAndRelease,
  findReusableOrder,
  setRazorpayOrderId,
} from '@/lib/data/orders'
import { completeOrder } from './complete-order'
import { couponProblem, couponProblemMessage } from '@/lib/utils/coupon'
import { DEFAULT_MAX_ORDER_PAISE, computeTotals, effectivePrice, exceedsOrderCap } from '@/lib/utils/pricing'

export type CreateOrderErrorCode =
  | 'CART_EMPTY'
  | 'ALREADY_ENROLLED'
  | 'COURSE_UNAVAILABLE'
  | 'COUPON_INVALID'
  | 'ORDER_TOO_LARGE'
  | 'PROVIDER_ERROR'

export class CreateOrderError extends Error {
  constructor(
    public code: CreateOrderErrorCode,
    message: string,
  ) {
    super(message)
  }
}

export type CreateOrderResult =
  | { free: true; orderId: string }
  | {
      free: false
      orderId: string
      razorpayOrderId: string
      amount: number
      key: string
      provider: 'razorpay' | 'mock'
      mock?: { paymentId: string; signature: string }
    }

export function cartFingerprint(
  items: { courseId: string; price: number }[],
  couponCode: string | null,
): string {
  const parts = [...items]
    .sort((a, b) => a.courseId.localeCompare(b.courseId))
    .map((i) => `${i.courseId}:${i.price}`)
  return createHash('sha256')
    .update(`${parts.join('|')}#${(couponCode ?? '').trim().toUpperCase()}`)
    .digest('hex')
}

/** REQ-141 flow. Authentication is the caller's job (returns 401 before reaching here). */
export async function createOrderForUser(
  user: { id: string; name: string | null; email: string },
  rawCouponCode?: string | null,
): Promise<CreateOrderResult> {
  // 2. re-validate the cart from the DB
  const courseIds = await getCartCourseIds({ userId: user.id })
  if (courseIds.length === 0) throw new CreateOrderError('CART_EMPTY', 'Your cart is empty.')

  const [courses, enrolled, settings] = await Promise.all([
    getCoursesForPurchase(courseIds),
    getEnrolledCourseIds(user.id),
    getSettings(),
  ])
  const enrolledSet = new Set(enrolled)
  if (courses.some((c) => enrolledSet.has(c.id))) {
    throw new CreateOrderError('ALREADY_ENROLLED', 'Remove courses you already own from your cart.')
  }
  if (courses.length !== courseIds.length || courses.some((c) => c.status !== 'PUBLISHED')) {
    throw new CreateOrderError('COURSE_UNAVAILABLE', 'A course in your cart is no longer available.')
  }

  const couponCode = rawCouponCode?.trim() ? rawCouponCode.trim().toUpperCase() : null
  let coupon: Awaited<ReturnType<typeof findCouponByCode>> = null
  if (couponCode) {
    coupon = await findCouponByCode(couponCode)
    const problem = coupon ? couponProblem(coupon) : 'INACTIVE'
    if (!coupon || problem) {
      throw new CreateOrderError(
        'COUPON_INVALID',
        problem ? couponProblemMessage[problem] : 'This coupon code is not valid.',
      )
    }
  }

  // 3. totals: discountPrice -> coupon -> GST
  const lineItems = courses.map((c) => ({
    courseId: c.id,
    title: c.title,
    price: c.isFree ? 0 : effectivePrice(c.price, c.discountPrice),
  }))
  const gstPercent = Number(settings.gst_percent ?? '18')
  const gstMode = settings.gst_mode === 'EXCLUSIVE' ? 'EXCLUSIVE' : 'INCLUSIVE'
  const totals = computeTotals({
    items: lineItems.map((i) => ({ price: i.price })),
    coupon: coupon ? { discountType: coupon.discountType, discountValue: coupon.discountValue } : null,
    gstPercent,
    gstMode,
  })
  const cap = Number(settings.max_order_paise ?? process.env.MAX_ORDER_PAISE ?? DEFAULT_MAX_ORDER_PAISE)
  if (exceedsOrderCap(totals.total, cap)) {
    throw new CreateOrderError('ORDER_TOO_LARGE', 'This order exceeds the maximum allowed amount.')
  }

  // 4/5. fingerprint + reuse
  const fingerprint = cartFingerprint(lineItems, couponCode)
  const provider = getPaymentProvider()
  const reusable = await findReusableOrder(user.id, fingerprint)
  if (reusable && reusable.razorpayOrderId && reusable.total > 0) {
    return {
      free: false,
      orderId: reusable.id,
      razorpayOrderId: reusable.razorpayOrderId,
      amount: reusable.total,
      key: provider.name === 'mock' ? 'mock' : (process.env.RAZORPAY_KEY_ID ?? ''),
      provider: provider.name,
      mock: provider.name === 'mock' ? mockPaymentFor(reusable.razorpayOrderId) : undefined,
    }
  }

  // 6. reserve coupon + create order
  let order
  try {
    order = await createPendingOrder({
      userId: user.id,
      items: lineItems,
      subtotal: totals.subtotal,
      discount: totals.discount,
      gst: totals.gst,
      total: totals.total,
      gstMode,
      coupon: coupon ? { id: coupon.id, code: coupon.code } : null,
      fingerprint,
      billingName: user.name,
      billingEmail: user.email,
    })
  } catch (e) {
    if (e instanceof CouponUnavailableError) {
      throw new CreateOrderError('COUPON_INVALID', 'This coupon has reached its usage limit.')
    }
    throw e
  }

  // 7. zero-total path: no Payment row
  if (totals.total === 0) {
    await completeOrder(order.id)
    return { free: true, orderId: order.id }
  }

  // 8. provider order
  try {
    const po = await provider.createOrder({ amount: totals.total, receipt: order.orderNumber })
    await setRazorpayOrderId(order.id, po.providerOrderId)
    return {
      free: false,
      orderId: order.id,
      razorpayOrderId: po.providerOrderId,
      amount: po.amount,
      key: po.key,
      provider: provider.name,
      mock: po.mock,
    }
  } catch (e) {
    await failOrderAndRelease(order.id)
    console.error('[create-order] provider failure', e)
    throw new CreateOrderError('PROVIDER_ERROR', 'We could not start the payment. Please try again.')
  }
}
