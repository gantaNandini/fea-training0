import { db } from '@/lib/db'
import type { OrderSummaryDTO } from '@/lib/types'

export class CouponUnavailableError extends Error {
  constructor() {
    super('COUPON_UNAVAILABLE')
  }
}

const REUSE_WINDOW_MS = 15 * 60 * 1000

export interface NewOrderInput {
  userId: string
  items: { courseId: string; price: number; title: string }[]
  subtotal: number
  discount: number
  gst: number
  total: number
  gstMode: 'INCLUSIVE' | 'EXCLUSIVE'
  coupon: { id: string; code: string } | null
  fingerprint: string
  billingName: string | null
  billingEmail: string | null
}

/** REQ-141 step 5: reuse a recent PENDING order with the same fingerprint. */
export async function findReusableOrder(userId: string, fingerprint: string) {
  return db.order.findFirst({
    where: {
      userId,
      status: 'PENDING',
      cartFingerprint: fingerprint,
      createdAt: { gt: new Date(Date.now() - REUSE_WINDOW_MS) },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/** Guarded UPDATE: succeeds only while the coupon is active, unexpired and below maxUses. */
async function reserveCoupon(tx: Pick<typeof db, '$executeRaw'>, couponId: string): Promise<void> {
  const n = await tx.$executeRaw`
    UPDATE "Coupon" SET "usedCount" = "usedCount" + 1
    WHERE "id" = ${couponId}
      AND "active" = true
      AND ("expiresAt" IS NULL OR "expiresAt" > now())
      AND ("maxUses" IS NULL OR "usedCount" < "maxUses")`
  if (n !== 1) throw new CouponUnavailableError()
}

async function releaseCoupon(tx: Pick<typeof db, '$executeRaw'>, couponId: string): Promise<void> {
  await tx.$executeRaw`
    UPDATE "Coupon" SET "usedCount" = GREATEST("usedCount" - 1, 0) WHERE "id" = ${couponId}`
}

/**
 * REQ-141 step 6: supersede older PENDING orders of this user (releasing their coupon holds),
 * reserve the coupon, number the order from `order_number_seq`, and persist the order.
 */
export async function createPendingOrder(input: NewOrderInput) {
  return db.$transaction(async (tx) => {
    const older = await tx.order.findMany({
      where: { userId: input.userId, status: 'PENDING' },
      select: { id: true, couponId: true },
    })
    for (const o of older) {
      await tx.order.update({ where: { id: o.id }, data: { status: 'FAILED' } })
      if (o.couponId) await releaseCoupon(tx, o.couponId)
    }

    if (input.coupon) await reserveCoupon(tx, input.coupon.id)

    const seq = await tx.$queryRaw<{ n: bigint }[]>`SELECT nextval('order_number_seq') AS n`
    const n = Number(seq[0].n)
    const orderNumber = `PYT-${new Date().getFullYear()}-${String(n).padStart(6, '0')}`

    return tx.order.create({
      data: {
        orderNumber,
        userId: input.userId,
        status: 'PENDING',
        subtotal: input.subtotal,
        discount: input.discount,
        gst: input.gst,
        total: input.total,
        gstMode: input.gstMode,
        couponId: input.coupon?.id ?? null,
        couponCodeSnapshot: input.coupon?.code ?? null,
        cartFingerprint: input.fingerprint,
        billingName: input.billingName,
        billingEmail: input.billingEmail,
        items: {
          create: input.items.map((i) => ({
            courseId: i.courseId,
            price: i.price,
            titleSnapshot: i.title,
          })),
        },
      },
    })
  })
}

export async function setRazorpayOrderId(orderId: string, razorpayOrderId: string) {
  await db.order.update({ where: { id: orderId }, data: { razorpayOrderId } })
}

/** Marks a PENDING order FAILED and releases its coupon reservation (REQ-141 step 8, REQ-290B). */
export async function failOrderAndRelease(orderId: string): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const o = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true, couponId: true },
    })
    if (!o || o.status !== 'PENDING') return false
    await tx.order.update({ where: { id: orderId }, data: { status: 'FAILED' } })
    if (o.couponId) await releaseCoupon(tx, o.couponId)
    return true
  })
}

/** REQ-290B: PENDING orders older than 24 h become FAILED. */
export async function cleanupStaleOrders(): Promise<number> {
  const stale = await db.order.findMany({
    where: { status: 'PENDING', createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    select: { id: true },
  })
  let n = 0
  for (const o of stale) if (await failOrderAndRelease(o.id)) n++
  return n
}

export async function getOrderRecord(orderId: string) {
  return db.order.findUnique({ where: { id: orderId }, include: { items: true } })
}

export async function getOrderByRazorpayId(razorpayOrderId: string) {
  return db.order.findUnique({ where: { razorpayOrderId }, include: { items: true } })
}

/** Owner-scoped status lookup (REQ-286). */
export async function getOrderStatusForUser(orderId: string, userId: string) {
  const o = await db.order.findFirst({
    where: { id: orderId, userId },
    select: { status: true, orderNumber: true },
  })
  return o
}

export async function recordFailedPayment(input: {
  orderId: string
  razorpayPaymentId: string
  method: string | null
  amount: number
}) {
  await db.payment.upsert({
    where: { razorpayPaymentId: input.razorpayPaymentId },
    create: { ...input, status: 'FAILED' },
    update: {},
  })
}

/** Receipt/success view: order + enrolled course slugs. Owner or admin only (checked by caller). */
export async function getOrderSummary(orderId: string): Promise<(OrderSummaryDTO & { userId: string }) | null> {
  const o = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { course: { select: { slug: true } } } } },
  })
  if (!o) return null
  return {
    id: o.id,
    userId: o.userId,
    orderNumber: o.orderNumber,
    status: o.status,
    subtotal: o.subtotal,
    discount: o.discount,
    gst: o.gst,
    total: o.total,
    gstMode: o.gstMode,
    couponCode: o.couponCodeSnapshot,
    billingName: o.billingName,
    billingEmail: o.billingEmail,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      courseId: i.courseId,
      title: i.titleSnapshot,
      price: i.price,
      slug: i.course?.slug ?? null,
    })),
  }
}

export async function getOrdersByUser(userId: string) {
  return db.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { items: true } })
}
