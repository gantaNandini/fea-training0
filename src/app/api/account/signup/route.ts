import bcrypt from 'bcryptjs'
import { fail, ok, parseBody, tooMany } from '@/lib/api/http'
import { signupSchema } from '@/lib/utils/validation'
import { checkAuthRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/net/ip'
import { emailExists, createStudent } from '@/lib/data/users'
import { emailProvider } from '@/lib/email'
import { isSmtpConfigured } from '@/lib/email/smtp'
import { startSignup, verificationEmail } from '@/lib/auth/signup-verification'
import { messages } from '@/lib/messages'

/**
 * Step 1 of sign-up: store the details, email a 6-digit code. The account is created by
 * POST /api/account/signup/verify once the code is entered.
 * REQ-123: the response never reveals whether the email is already registered.
 */
export async function POST(req: Request) {
  const parsed = await parseBody(req, signupSchema)
  if (parsed.error) return parsed.error
  const { name, email, password } = parsed.data

  const limit = await checkAuthRateLimit(getClientIp(req.headers), 'signup', email)
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds)

  // SIGNUP_EMAIL_VERIFICATION=off: create the student straight away, no emailed code.
  if (process.env.SIGNUP_EMAIL_VERIFICATION === 'off') {
    try {
      if (!(await emailExists(email))) {
        await createStudent({ name, email, passwordHash: await bcrypt.hash(password, 12) })
      }
    } catch (e) {
      console.error('[signup]', e)
      return fail('SERVER_ERROR', messages.common.somethingWrong, 500)
    }
    return ok({ success: true, pending: false })
  }
  // Without SMTP the code would only be printed in the server log and nobody could sign up.
  if (process.env.NODE_ENV === 'production' && !(await isSmtpConfigured())) {
    return fail('EMAIL_NOT_CONFIGURED', 'Sign-up is temporarily unavailable. Please try again later or contact us.', 503)
  }

  try {
    if (await emailExists(email)) {
      try {
        await emailProvider.send({
          to: email,
          subject: 'Someone tried to sign up with your email',
          text: 'An account already exists for this email. If this was you, log in or reset your password.',
        })
      } catch (e) {
        console.error('[signup] notice email failed', e)
      }
    } else {
      const passwordHash = await bcrypt.hash(password, 12)
      const started = await startSignup({ name, email, passwordHash })
      // started.ok === false means a code was sent less than a minute ago: just show the code step.
      if (started.ok) await emailProvider.send({ to: email, ...verificationEmail(name, started.code) })
    }
  } catch (e) {
    console.error('[signup]', e)
    return fail('EMAIL_FAILED', messages.auth.emailFailed, 502)
  }
  return ok({ success: true, pending: true, message: messages.auth.codeSent })
}
