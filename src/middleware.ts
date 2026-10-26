// Next.js 15: middleware lives in src/middleware.ts (Next.js 16 renames it to proxy.ts).
import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/lib/auth/auth.config'
import { isOriginAllowed } from '@/lib/security/origin'

// Edge-safe: JWT inspection only, no Prisma (REQ-316).
const { auth } = NextAuth(authConfig)

const PROTECTED = ['/my-courses', '/wishlist', '/profile', '/learn', '/checkout', '/orders', '/admin']

function isProtected(pathname: string): boolean {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

// Build the CSP string once at module load — env vars are fixed at startup so
// there is no need to re-derive the string on every request.
const _cspString = (() => {
  const imageDomains = (process.env.IMAGE_DOMAINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((h) => `https://${h}`)
  const videoOrigins = (process.env.VIDEO_ORIGINS ?? 'https://www.youtube.com,https://player.vimeo.com')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://lh3.googleusercontent.com ${imageDomains.join(' ')}`.trim(),
    `font-src 'self' data:`,
    `connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com`,
    `frame-src https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com ${videoOrigins.join(' ')}`.trim(),
    `form-action 'self' https://accounts.google.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `object-src 'none'`,
  ]
  return directives.join('; ')
})()

function csp(): string {
  return _cspString
}

function withHeaders(res: NextResponse): NextResponse {
  // REQ-316: CSP is Report-Only (allow-list based, no nonce) so it never breaks the demo.
  res.headers.set('Content-Security-Policy-Report-Only', csp())
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)')
  return res
}

export default auth((req) => {
  const { pathname, search } = req.nextUrl

  // REQ-319: Origin check on state-changing API requests.
  if (pathname.startsWith('/api/')) {
    const allowed = isOriginAllowed({
      method: req.method,
      pathname,
      origin: req.headers.get('origin'),
      host: req.headers.get('host'),
      extraOrigins: process.env.NEXTAUTH_URL ? [process.env.NEXTAUTH_URL] : [],
    })
    if (!allowed) {
      return withHeaders(
        NextResponse.json(
          { error: { code: 'BAD_ORIGIN', message: 'Cross-origin request blocked.' } },
          { status: 403 },
        ),
      )
    }
    return withHeaders(NextResponse.next())
  }

  if (isProtected(pathname)) {
    if (!req.auth) {
      const url = new URL('/login', req.nextUrl.origin)
      url.searchParams.set('redirect', `${pathname}${search}`)
      return withHeaders(NextResponse.redirect(url))
    }
    if (pathname.startsWith('/admin') && req.auth.user?.role !== 'ADMIN') {
      return withHeaders(NextResponse.redirect(new URL('/login', req.nextUrl.origin)))
    }
  }

  return withHeaders(NextResponse.next())
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt|xml)$).*)'],
}
