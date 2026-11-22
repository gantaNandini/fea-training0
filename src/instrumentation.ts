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

  // Non-fatal warnings: console.warn only, never throw (REQ-317).
  if (!process.env.NEXTAUTH_URL) {
    console.warn('[prod-check] NEXTAUTH_URL is not set. Auth redirects may point to the wrong host.')
  }
  if (process.env.NEXTAUTH_URL && process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      const authOrigin = new URL(process.env.NEXTAUTH_URL).origin
      const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
      if (authOrigin !== siteOrigin) {
        console.warn(`[prod-check] NEXTAUTH_URL origin (${authOrigin}) differs from NEXT_PUBLIC_SITE_URL origin (${siteOrigin}). Sign-in redirects will go to the wrong host.`)
      }
    } catch {
      console.warn('[prod-check] Could not parse NEXTAUTH_URL or NEXT_PUBLIC_SITE_URL for origin comparison.')
    }
  }
  if (process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')) {
    console.warn(`[prod-check] RAZORPAY_KEY_ID starts with rzp_test_ (test mode). Live payments will not work.`)
  }
  if (process.env.SEED_DEMO_ACCOUNTS === 'true') {
    console.warn('[prod-check] SEED_DEMO_ACCOUNTS=true is set. Demo accounts with @demo.test emails are enabled. Unset this before launch.')
  }
}
