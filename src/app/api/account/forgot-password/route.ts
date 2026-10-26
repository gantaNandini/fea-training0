import { ok, parseBody, tooMany } from '@/lib/api/http'
import { forgotPasswordSchema } from '@/lib/utils/validation'
import { checkAuthRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/net/ip'
import { createPasswordResetToken, getUserForLogin } from '@/lib/data/users'
import { emailProvider } from '@/lib/email'
import { absoluteUrl } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

/** REQ-124: generic success regardless of whether the email is registered. */
export async function POST(req: Request) {
  const parsed = await parseBody(req, forgotPasswordSchema)
  if (parsed.error) return parsed.error
  const { email } = parsed.data

  const limit = await checkAuthRateLimit(getClientIp(req.headers), 'forgot', email)
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds)

  try {
    const user = await getUserForLogin(email)
    if (user) {
      const token = await createPasswordResetToken(user.id)
      await emailProvider.send({
        to: user.email,
        subject: 'Reset your password',
        text: `Use this link within 1 hour to choose a new password:\n${absoluteUrl(`/reset-password?token=${token}`)}`,
      })
    }
  } catch (e) {
    console.error('[forgot-password]', e)
  }
  return ok({ success: true, message: messages.auth.forgotDone })
}
