import { createHmac, timingSafeEqual } from 'crypto'

export function hmacHex(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/** Constant-time comparison of two hex strings. */
export function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export function verifyCheckoutSignature(
  secret: string,
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  return safeEqualHex(hmacHex(secret, `${orderId}|${paymentId}`), signature)
}

export function verifyBodySignature(secret: string, rawBody: string, signature: string): boolean {
  return safeEqualHex(hmacHex(secret, rawBody), signature)
}
