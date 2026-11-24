import { fail, ok, parseBody, tooMany } from '@/lib/api/http'
import { resendSignupSchema } from '@/lib/utils/validation'
import { checkAuthRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/net/ip'
import { emailProvider } from '@/lib/email'
import { resendCode, verificationEmail } from '@/lib/auth/signup-verification'
import { messages } from '@/lib/messages'

/** Send a fresh code for a pending sign-up (at most one per minute). */
export async function POST(req: Request) {
  const parsed = await parseBody(req, resendSignupSchema)
  if (parsed.error) return parsed.error
  const { email } = parsed.data

  const limit = await checkAuthRateLimit(getClientIp(req.headers), 'signup', email)
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds)

  try {
    const result = await resendCode(email)
    if (!result.ok && result.reason === 'COOLDOWN') return tooMany(result.retryAfterSeconds)
    if (result.ok) await emailProvider.send({ to: email, ...verificationEmail(result.name, result.code) })
  } catch (e) {
    console.error('[signup/resend]', e)
    return fail('EMAIL_FAILED', messages.auth.emailFailed, 502)
  }
  return ok({ success: true })
}
