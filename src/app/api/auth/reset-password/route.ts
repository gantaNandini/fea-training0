import bcrypt from 'bcryptjs'
import { fail, ok, parseBody } from '@/lib/api/http'
import { resetPasswordSchema } from '@/lib/utils/validation'
import { consumePasswordResetToken } from '@/lib/data/users'
import { assertSameOrigin } from '@/lib/security/origin'
import { messages } from '@/lib/messages'

/**
 * REQ-290C. This path sits under the Origin-exempt /api/auth/* prefix, so it asserts same-origin
 * itself. Success sets the new password, bumps sessionVersion and marks the token used.
 */
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return fail('BAD_ORIGIN', 'Cross-origin request blocked.', 403)
  const parsed = await parseBody(req, resetPasswordSchema)
  if (parsed.error) return parsed.error
  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const done = await consumePasswordResetToken(parsed.data.token, passwordHash)
  if (!done) return fail('INVALID_TOKEN', messages.auth.resetInvalid, 400)
  return ok({ success: true, message: messages.auth.resetDone })
}
