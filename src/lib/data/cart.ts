import { db } from '@/lib/db'
import { mergeCartCourseIds } from '@/lib/utils/cart'
import type { CartResponse } from '@/lib/types'
import { getCourseCardsByIds } from './courses'
import { getSettings } from './settings'
import { getEnrolledCourseIds } from './progress'
import { computeTotals } from '@/lib/utils/pricing'
import { couponProblem, couponProblemMessage } from '@/lib/utils/coupon'

export type CartOwner = { userId: string } | { sessionId: string }

function where(owner: CartOwner) {
  return 'userId' in owner ? { userId: owner.userId } : { sessionId: owner.sessionId }
}

export async function getCartCourseIds(owner: CartOwner): Promise<string[]> {
  const rows = await db.cartItem.findMany({
    where: where(owner),
    orderBy: { createdAt: 'asc' },
    select: { courseId: true },
  })
  return rows.map((r) => r.courseId)
}

export async function addCartItem(owner: CartOwner, courseId: string) {
  const data = 'userId' in owner ? { userId: owner.userId, courseId } : { sessionId: owner.sessionId, courseId }
  if ('userId' in owner) {
    await db.cartItem.upsert({
      where: { userId_courseId: { userId: owner.userId, courseId } },
      create: data,
      update: {},
    })
  } else {
    await db.cartItem.upsert({
      where: { sessionId_courseId: { sessionId: owner.sessionId, courseId } },
      create: data,
      update: {},
    })
  }
}

export async function removeCartItem(owner: CartOwner, courseId: string) {
  await db.cartItem.deleteMany({ where: { ...where(owner), courseId } })
}

/** REQ-125: idempotent guest -> user merge. Returns the merged course ids. */
export async function mergeGuestCart(sessionId: string, userId: string): Promise<string[]> {
  return db.$transaction(async (tx) => {
    const guest = await tx.cartItem.findMany({ where: { sessionId }, select: { courseId: true } })
    if (guest.length === 0) return (await tx.cartItem.findMany({ where: { userId }, select: { courseId: true } })).map((r) => r.courseId)
    const mine = await tx.cartItem.findMany({ where: { userId }, select: { courseId: true } })
    const enrolled = await tx.enrollment.findMany({ where: { userId }, select: { courseId: true } })
    const { toMove } = mergeCartCourseIds(
      guest.map((g) => g.courseId),
      mine.map((m) => m.courseId),
      enrolled.map((e) => e.courseId),
    )
    if (toMove.length) {
      await tx.cartItem.createMany({
        data: toMove.map((courseId) => ({ userId, courseId })),
        skipDuplicates: true,
      })
    }
    await tx.cartItem.deleteMany({ where: { sessionId } })
    return (await tx.cartItem.findMany({ where: { userId }, select: { courseId: true } })).map((r) => r.courseId)
  })
}

/** REQ-130: guest rows older than 30 days. */
export async function deleteStaleGuestCarts(): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const res = await db.cartItem.deleteMany({ where: { userId: null, createdAt: { lt: cutoff } } })
  return res.count
}

export async function clearUserCart(userId: string) {
  await db.cartItem.deleteMany({ where: { userId } })
}

export interface CouponRow {
  id: string
  code: string
  discountType: 'PERCENT' | 'FLAT'
  discountValue: number
  maxUses: number | null
  usedCount: number
  expiresAt: Date | null
  active: boolean
}

export async function findCouponByCode(code: string): Promise<CouponRow | null> {
  return db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } })
}

/** Full cart view with prices/totals computed server-side (REQ-131/132). */
export async function buildCartResponse(
  courseIds: string[],
  couponCode?: string | null,
): Promise<CartResponse> {
  // Fetch items and settings in parallel — both are cache-backed and independent
  const [items, settings] = await Promise.all([
    getCourseCardsByIds(courseIds),
    getSettings(),
  ])
  const gstPercent = Number(settings.gst_percent ?? '18')
  const gstMode = settings.gst_mode === 'EXCLUSIVE' ? 'EXCLUSIVE' : 'INCLUSIVE'

  let coupon: CartResponse['coupon'] = null
  let couponLike: { discountType: 'PERCENT' | 'FLAT'; discountValue: number } | null = null
  if (couponCode && couponCode.trim()) {
    const row = await findCouponByCode(couponCode)
    if (!row) {
      coupon = { code: couponCode.trim().toUpperCase(), valid: false, message: 'This coupon code is not valid.' }
    } else {
      const problem = couponProblem(row)
      if (problem) {
        coupon = { code: row.code, valid: false, message: couponProblemMessage[problem] }
      } else {
        coupon = { code: row.code, valid: true }
        couponLike = { discountType: row.discountType, discountValue: row.discountValue }
      }
    }
  }

  const totals = computeTotals({
    items: items.map((i) => ({ price: i.isFree ? 0 : i.price, discountPrice: i.isFree ? null : i.discountPrice })),
    coupon: couponLike,
    gstPercent,
    gstMode,
  })
  return { items, totals, coupon }
}

export async function getEnrolledSet(userId: string) {
  return new Set(await getEnrolledCourseIds(userId))
}
