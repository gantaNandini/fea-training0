import { createHash, randomBytes } from 'crypto'
import type {
  CreateProviderOrderInput,
  PaymentProvider,
  ProviderOrder,
  ProviderPayment,
} from './index'
import { hmacHex, verifyBodySignature, verifyCheckoutSignature } from './signature'

function mockSecret(): string {
  return `mock:${process.env.NEXTAUTH_SECRET ?? 'dev-secret'}`
}

/** Deterministic per order, so a reused PENDING order can be paid again idempotently. */
export function mockPaymentFor(providerOrderId: string): { paymentId: string; signature: string } {
  const paymentId = `pay_mock_${createHash('sha256').update(providerOrderId).digest('hex').slice(0, 16)}`
  return { paymentId, signature: hmacHex(mockSecret(), `${providerOrderId}|${paymentId}`) }
}

/**
 * Demo payment provider (REQ-317): immediate success, no gateway. Refuses to exist in production.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock' as const

  constructor() {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_IN_PRODUCTION !== 'true') {
      throw new Error(
        'PAYMENT_PROVIDER=mock is not allowed when NODE_ENV=production. Use PAYMENT_PROVIDER=razorpay with TEST keys for hosted demos (or ALLOW_MOCK_IN_PRODUCTION=true for a local fast demo only).',
      )
    }
  }

  async createOrder({ amount }: CreateProviderOrderInput): Promise<ProviderOrder> {
    const providerOrderId = `order_mock_${randomBytes(8).toString('hex')}`
    return {
      providerOrderId,
      amount,
      currency: 'INR',
      key: 'mock',
      mock: mockPaymentFor(providerOrderId),
    }
  }

  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    return verifyCheckoutSignature(mockSecret(), orderId, paymentId, signature)
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    return verifyBodySignature(mockSecret(), rawBody, signature)
  }

  async fetchPayment(
    _paymentId: string,
    hint: { expectedAmount: number },
  ): Promise<ProviderPayment> {
    return { status: 'captured', method: 'mock', amount: hint.expectedAmount, orderId: null }
  }
}
