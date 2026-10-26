/**
 * REQ-319: verify the Origin header on every state-changing request.
 * Exempt: webhook (HMAC-authenticated), /api/auth/* (Auth.js has its own CSRF), cleanup routes
 * (Bearer-authenticated). Safe methods are never checked.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

const EXEMPT_EXACT = new Set(['/api/payments/webhook', '/api/cart/cleanup', '/api/orders/cleanup'])

export interface OriginCheckInput {
  method: string
  pathname: string
  origin: string | null
  host: string | null
  /** Extra allowed origins (e.g. the canonical NEXTAUTH_URL origin) */
  extraOrigins?: string[]
}

export function isOriginExempt(method: string, pathname: string): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return true
  if (EXEMPT_EXACT.has(pathname)) return true
  if (pathname.startsWith('/api/auth/')) return true
  return false
}

export function isOriginAllowed({
  method,
  pathname,
  origin,
  host,
  extraOrigins = [],
}: OriginCheckInput): boolean {
  if (isOriginExempt(method, pathname)) return true
  if (!origin) return false
  try {
    const o = new URL(origin)
    if (host && o.host === host) return true
    return extraOrigins.some((e) => {
      try {
        return new URL(e).origin === o.origin
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

/**
 * Strict same-origin assertion for custom routes that live under the exempt `/api/auth/*` prefix
 * (e.g. reset-password), where the middleware deliberately does not check Origin.
 */
export function assertSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  if (!origin || !host) return false
  try {
    const o = new URL(origin)
    if (o.host === host) return true
    const configured = process.env.NEXTAUTH_URL
    return !!configured && new URL(configured).origin === o.origin
  } catch {
    return false
  }
}
