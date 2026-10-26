import Razorpay from 'razorpay'
import type {
  CreateProviderOrderInput,
  PaymentProvider,
  ProviderOrder,
  ProviderPayment,
} from './index'
import { verifyBodySignature, verifyCheckoutSignature } from './signature'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is required when PAYMENT_PROVIDER=razorpay`)
  return v
}

export class RazorpayProvider implements PaymentProvider {
  readonly name = 'razorpay' as const
  private client: Razorpay
  private keyId: string
  private keySecret: string

  constructor() {
    this.keyId = requireEnv('RAZORPAY_KEY_ID')
    this.keySecret = requireEnv('RAZORPAY_KEY_SECRET')
    this.client = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret })
  }

  async createOrder({ amount, receipt }: CreateProviderOrderInput): Promise<ProviderOrder> {
    // payment_capture=1 -> automatic capture (REQ-141 step 8)
    const order = await this.client.orders.create({
      amount,
      currency: 'INR',
      receipt,
      payment_capture: true,
    })
    return {
      providerOrderId: String(order.id),
      amount: Number(order.amount),
      currency: 'INR',
      key: this.keyId,
    }
  }

  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    return verifyCheckoutSignature(this.keySecret, orderId, paymentId, signature)
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) return false
    return verifyBodySignature(secret, rawBody, signature)
  }

  async fetchPayment(paymentId: string): Promise<ProviderPayment> {
    const p = await this.client.payments.fetch(paymentId)
    const status =
      p.status === 'captured' || p.status === 'authorized' || p.status === 'failed'
        ? p.status
        : 'other'
    return {
      status,
      method: p.method ? String(p.method) : null,
      amount: Number(p.amount),
      orderId: p.order_id ? String(p.order_id) : null,
    }
  }
}
