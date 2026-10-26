import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

/**
 * Shared, idempotent fulfilment (REQ-143). Used by /api/payments/verify, the webhook and the
 * zero-total path. Locks the Order row with SELECT ... FOR UPDATE so concurrent calls serialise.
 *
 * Coupon `usedCount` is reserved at create-order time and is NOT touched here. A late
 * `payment.captured` on an order whose reservation was already released by the 24 h cleanup may
 * leave usedCount under by one; this is accepted and documented in README.md (REQ-143 note).
 */

export type OrderErrorCode =
  | 'NOT_FOUND'
  | 'REFUNDED'
  | 'RAZORPAY_ORDER_MISMATCH'
  | 'AMOUNT_MISMATCH'
  | 'INVALID_STATE'

export class OrderError extends Error {
  constructor(public code: OrderErrorCode) {
    super(code)
  }
}

export interface PaymentDetails {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature?: string | null
  method?: string | null
  /** paise actually paid */
  amount: number
}

export type CompleteResult = { alreadyProcessed: boolean }

export async function completeOrder(
  orderId: string,
  details?: PaymentDetails,
): Promise<CompleteResult> {
  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string; status: string }[]>(
      Prisma.sql`SELECT "id", "status"::text AS "status" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`,
    )
    if (locked.length === 0) throw new OrderError('NOT_FOUND')
    const status = locked[0].status

    if (status === 'COMPLETED') return { alreadyProcessed: true }
    if (status === 'REFUNDED') throw new OrderError('REFUNDED')
    if (status !== 'PENDING' && status !== 'FAILED') throw new OrderError('INVALID_STATE')

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    })

    const zeroTotal = order.total === 0
    if (!zeroTotal) {
      if (!details) throw new OrderError('INVALID_STATE')
      if (!order.razorpayOrderId || order.razorpayOrderId !== details.razorpayOrderId) {
        throw new OrderError('RAZORPAY_ORDER_MISMATCH')
      }
      if (details.amount !== order.total) throw new OrderError('AMOUNT_MISMATCH')

      await tx.payment.upsert({
        where: { razorpayPaymentId: details.razorpayPaymentId },
        create: {
          orderId,
          razorpayPaymentId: details.razorpayPaymentId,
          razorpaySignature: details.razorpaySignature ?? null,
          method: details.method ?? null,
          amount: details.amount,
          status: 'SUCCESS',
        },
        update: {
          status: 'SUCCESS',
          razorpaySignature: details.razorpaySignature ?? null,
          method: details.method ?? null,
          amount: details.amount,
        },
      })
    }

    await tx.order.update({ where: { id: orderId }, data: { status: 'COMPLETED' } })

    await tx.enrollment.createMany({
      data: order.items.map((i) => ({ userId: order.userId, courseId: i.courseId, orderId })),
      skipDuplicates: true,
    })

    await tx.cartItem.deleteMany({
      where: { userId: order.userId, courseId: { in: order.items.map((i) => i.courseId) } },
    })

    return { alreadyProcessed: false }
  })
}
