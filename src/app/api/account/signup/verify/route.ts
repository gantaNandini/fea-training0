import { fail, ok, parseBody, tooMany } from '@/lib/api/http'
import { verifySignupSchema } from '@/lib/utils/validation'
import { checkAuthRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/net/ip'
import { verifySignup } from '@/lib/auth/signup-verification'

/** Step 2 of sign-up: check the emailed code and create the student account. */
export async function POST(req: Request) {
  const parsed = await parseBody(req, verifySignupSchema)
  if (parsed.error) return parsed.error
  const { email, code } = parsed.data

  const limit = await checkAuthRateLimit(getClientIp(req.headers), 'verify', email)
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds)

  try {
    const result = await verifySignup(email, code)
    if (result.ok) return ok({ success: true })
    if (result.reason === 'EXPIRED') return fail('CODE_EXPIRED', 'This code has expired. Request a new one.', 400)
    if (result.reason === 'TOO_MANY') return fail('TOO_MANY_ATTEMPTS', 'Too many wrong codes. Request a new code.', 429)
    return fail('INVALID_CODE', 'That code is not correct.', 400)
  } catch (e) {
    console.error('[signup/verify]', e)
    return fail('SERVER_ERROR', 'Could not verify the code. Please try again.', 500)
  }
}
