import { ok, fail, parseBody, tooMany } from '@/lib/api/http'
import { verifyCodeSchema } from '@/lib/utils/validation'
import { checkAuthRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/net/ip'
import { getUserForLogin, consumeEmailVerificationCode } from '@/lib/data/users'
import { messages } from '@/lib/messages'

/** REQ-123A: accepts a 6-digit code and marks the account as email-verified. */
export async function POST(req: Request) {
  const parsed = await parseBody(req, verifyCodeSchema)
  if (parsed.error) return parsed.error
  const { email, code } = parsed.data

  const limit = await checkAuthRateLimit(getClientIp(req.headers), 'verify-code', email)
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds)

  const user = await getUserForLogin(email)
  // Don't reveal whether the email exists.
  if (!user) return fail('CODE_INVALID', messages.auth.verifyCodeInvalid, 400)

  const ok2 = await consumeEmailVerificationCode(user.id, code)
  if (!ok2) return fail('CODE_INVALID', messages.auth.verifyCodeInvalid, 400)

  return ok({ success: true, message: messages.auth.verifyCodeDone })
}
