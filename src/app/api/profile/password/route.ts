import bcrypt from 'bcryptjs'
import { fail, ok, parseBody, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { getProfile, setPassword } from '@/lib/data/users'
import { passwordChangeSchema } from '@/lib/utils/validation'

export const dynamic = 'force-dynamic'

/** REQ-192: current + new password; increments sessionVersion (the client then signs out). */
export async function POST(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const parsed = await parseBody(req, passwordChangeSchema)
  if (parsed.error) return parsed.error

  const profile = await getProfile(user.id)
  if (!profile?.passwordHash) {
    return fail('NO_PASSWORD', 'This account signs in with Google and has no password.', 400)
  }
  const valid = await bcrypt.compare(parsed.data.currentPassword, profile.passwordHash)
  if (!valid) return fail('WRONG_PASSWORD', 'Your current password is incorrect.', 400)

  await setPassword(user.id, await bcrypt.hash(parsed.data.newPassword, 12))
  return ok({ success: true })
}
