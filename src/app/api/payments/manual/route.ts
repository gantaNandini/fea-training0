import { z } from 'zod'
import { db } from '@/lib/db'
import { fail, ok, parseBody, tooMany, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { rateLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const schema = z.object({
  orderId: z.string().trim().min(1).max(60),
  // UPI reference numbers (UTR / RRN) are 12 digits
  utr: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ''))
    .pipe(z.string().regex(/^\d{12}$/, 'Enter the 12-digit UTR / reference number from your UPI app.')),
})

/**
 * Static UPI QR payment claim. This NEVER grants access: it only records a PENDING claim that an
 * authorised admin must verify against the bank / Razorpay records. The expected amount comes from the
 * server-side order, never from the browser.
 */
export async function POST(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const parsed = await parseBody(req, schema)
  if (parsed.error) return parsed.error

  const limit = await rateLimiter.hit(`${user.id}:manual-payment:*`, 8, 15 * 60)
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds)

  const order = await db.order.findFirst({ where: { id: parsed.data.orderId, userId: user.id } })
  if (!order || order.total <= 0) return fail('NOT_FOUND', 'Order not found.', 404)
  if (order.status === 'COMPLETED') return fail('ALREADY_PAID', 'This order is already paid.', 409)
  if (order.status === 'REFUNDED') return fail('INVALID_STATE', 'This order cannot be paid.', 409)

  const existing = await db.manualPayment.findFirst({ where: { orderId: order.id, status: 'PENDING' } })
  if (existing) {
    return ok(existing.utr === parsed.data.utr ? { status: 'PENDING' } : { status: 'PENDING', note: 'A payment for this order is already awaiting verification.' })
  }

  try {
    await db.manualPayment.create({
      data: { orderId: order.id, userId: user.id, utr: parsed.data.utr, amount: order.total },
    })
  } catch (e) {
    if (e instanceof Error && 'code' in e && (e as { code?: string }).code === 'P2002') {
      return fail('DUPLICATE_UTR', 'This reference number has already been submitted.', 409)
    }
    console.error('[manual-payment]', e)
    return fail('SERVER_ERROR', 'We could not record your payment. Please try again.', 500)
  }
  return ok({ status: 'PENDING' })
}
