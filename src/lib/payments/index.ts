import { RazorpayProvider } from './razorpay'
import { MockPaymentProvider } from './mock'

/** REQ-007: all payment code goes through this interface. */
export interface CreateProviderOrderInput {
  /** paise */
  amount: number
  receipt: string
}

export interface ProviderOrder {
  providerOrderId: string
  amount: number
  currency: 'INR'
  /** public key id for the client checkout */
  key: string
  /** only the mock provider fills this, so the demo can complete without a real gateway */
  mock?: { paymentId: string; signature: string }
}

export interface ProviderPayment {
  status: 'captured' | 'authorized' | 'failed' | 'other'
  method: string | null
  /** paise */
  amount: number
  orderId: string | null
}

export interface PaymentProvider {
  readonly name: 'razorpay' | 'mock'
  createOrder(input: CreateProviderOrderInput): Promise<ProviderOrder>
  /** HMAC_SHA256(orderId|paymentId) check, constant-time */
  verifySignature(orderId: string, paymentId: string, signature: string): boolean
  verifyWebhookSignature(rawBody: string, signature: string): boolean
  fetchPayment(paymentId: string, hint: { expectedAmount: number }): Promise<ProviderPayment>
}

let cached: PaymentProvider | null = null

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached
  const which = (process.env.PAYMENT_PROVIDER ?? 'mock').toLowerCase()
  cached = which === 'razorpay' ? new RazorpayProvider() : new MockPaymentProvider()
  return cached
}
