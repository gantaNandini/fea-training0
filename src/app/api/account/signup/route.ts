import bcrypt from 'bcryptjs'
import { ok, parseBody, tooMany } from '@/lib/api/http'
import { signupSchema } from '@/lib/utils/validation'
import { checkAuthRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/net/ip'
import { createStudent, emailExists, createEmailVerificationCode } from '@/lib/data/users'
import { emailProvider } from '@/lib/email'
import { messages } from '@/lib/messages'

/** REQ-123 / REQ-123A: creates the account and emails a 6-digit verification code.
 *  The response never reveals whether the email is already registered. */
export async function POST(req: Request) {
  const parsed = await parseBody(req, signupSchema)
  if (parsed.error) return parsed.error
  const { name, email, password } = parsed.data

  const limit = await checkAuthRateLimit(getClientIp(req.headers), 'signup', email)
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds)

  try {
    if (await emailExists(email)) {
      await emailProvider.send({
        to: email,
        subject: 'Someone tried to sign up with your email',
        text: 'An account already exists for this email. If this was you, log in or reset your password.',
      })
    } else {
      const passwordHash = await bcrypt.hash(password, 12)
      const user = await createStudent({ name, email, passwordHash })
      const code = await createEmailVerificationCode(user.id)
      await emailProvider.send({
        to: email,
        subject: 'Your Pythagoras verification code',
        text: `Your verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you did not sign up, ignore this email.`,
      })
    }
  } catch (e) {
    // a concurrent duplicate insert must not leak either
    console.error('[signup]', e)
  }
  return ok({ success: true, message: messages.auth.signupCodeSent })
}
