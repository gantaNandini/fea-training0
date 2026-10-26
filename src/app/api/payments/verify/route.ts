import { fail, forbidden, ok, parseBody, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { getPaymentProvider } from '@/lib/payments'
import { getOrderRecord } from '@/lib/data/orders'
import { OrderError, completeOrder } from '@/lib/orders/complete-order'
import { verifyPaymentSchema } from '@/lib/utils/validation'

export const dynamic = 'force-dynamic'

/** REQ-142A. The client treats HTTP 409 ALREADY_PROCESSED as success. */
export async function POST(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const parsed = await parseBody(req, verifyPaymentSchema)
  if (parsed.error) return parsed.error
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data

  const order = await getOrderRecord(orderId)
  if (!order) return fail('NOT_FOUND', 'Order not found.', 404)
  if (order.userId !== user.id) return forbidden() // REQ-142A step 1
  if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
    return fail('ORDER_MISMATCH', 'Payment does not belong to this order.', 400)
  }

  const provider = getPaymentProvider()
  // step 2: HMAC_SHA256(orderId|paymentId) with timingSafeEqual
  if (!provider.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    return fail('INVALID_SIGNATURE', 'Payment signature could not be verified.', 400)
  }

  try {
    // step 3: fetch the payment from the gateway server-side
    const payment = await provider.fetchPayment(razorpayPaymentId, { expectedAmount: order.total })
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return fail('PAYMENT_NOT_CAPTURED', 'Payment has not been completed.', 402)
    }
    if (payment.orderId && payment.orderId !== razorpayOrderId) {
      return fail('ORDER_MISMATCH', 'Payment does not belong to this order.', 400)
    }
    // step 4: shared idempotent fulfilment
    const result = await completeOrder(order.id, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      method: payment.method,
      amount: payment.amount,
    })
    if (result.alreadyProcessed) return fail('ALREADY_PROCESSED', 'Order already processed.', 409)
    return ok({ success: true })
  } catch (e) {
    if (e instanceof OrderError) {
      const status = e.code === 'REFUNDED' ? 409 : 400
      return fail(e.code, 'This order cannot be completed.', status)
    }
    console.error('[verify]', e)
    return fail('SERVER_ERROR', 'Could not verify the payment.', 500)
  }
}
