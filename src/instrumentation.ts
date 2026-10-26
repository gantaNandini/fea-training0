/** Fails fast on unsafe production configuration (REQ-317, REQ-310). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.NODE_ENV !== 'production') return

  if ((process.env.PAYMENT_PROVIDER ?? 'mock').toLowerCase() === 'mock' && process.env.ALLOW_MOCK_IN_PRODUCTION !== 'true') {
    throw new Error('PAYMENT_PROVIDER=mock is not allowed in production. Use razorpay with TEST keys for demos.')
  }
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret || secret.startsWith('change-me')) {
    throw new Error('NEXTAUTH_SECRET must be set to a long random value in production.')
  }
}
