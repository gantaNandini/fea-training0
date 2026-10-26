import { NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payments'
import { getOrderByRazorpayId, recordFailedPayment } from '@/lib/data/orders'
import { completeOrder } from '@/lib/orders/complete-order'

export const dynamic = 'force-dynamic'

interface PaymentEntity {
  id?: string
  order_id?: string
  amount?: number
  method?: string
}

/**
 * REQ-143A. Exempt from the Origin check (HMAC-authenticated). Reads the RAW body first.
 * Returns 400 only for a bad signature; everything else answers 200 quickly.
 */
export async function POST(req: Request) {
  const raw = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''
  const provider = getPaymentProvider()
  if (!provider.verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: { code: 'INVALID_SIGNATURE' } }, { status: 400 })
  }

  try {
    const event = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: PaymentEntity } } }
    const entity = event.payload?.payment?.entity
    // never trust a client-sent order id: look the order up by the gateway's order id
    if (entity?.order_id && entity.id) {
      const order = await getOrderByRazorpayId(entity.order_id)
      if (order) {
        if (event.event === 'payment.failed') {
          await recordFailedPayment({
            orderId: order.id,
            razorpayPaymentId: entity.id,
            method: entity.method ?? null,
            amount: entity.amount ?? 0,
          })
        } else if (event.event === 'payment.captured') {
          await completeOrder(order.id, {
            razorpayOrderId: entity.order_id,
            razorpayPaymentId: entity.id,
            method: entity.method ?? null,
            amount: entity.amount ?? 0,
          })
        }
      }
    }
  } catch (e) {
    console.error('[webhook]', e)
  }
  return NextResponse.json({ received: true }, { status: 200 })
}
