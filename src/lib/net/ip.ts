/**
 * Trusted-proxy helper (REQ-126). `x-forwarded-for` is only honoured when TRUST_PROXY=true
 * (set it when the app runs behind Vercel / a reverse proxy you control); otherwise a client could
 * spoof the header to dodge per-IP rate limits.
 */
export function getClientIp(headers: Headers): string {
  if (process.env.TRUST_PROXY === 'true') {
    const xff = headers.get('x-forwarded-for')
    if (xff) {
      const first = xff.split(',')[0]?.trim()
      if (first) return first
    }
    const real = headers.get('x-real-ip')
    if (real) return real.trim()
  }
  return 'local'
}
