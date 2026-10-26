import { ok, parseBody, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { updateProfile } from '@/lib/data/users'
import { profileSchema } from '@/lib/utils/validation'

export const dynamic = 'force-dynamic'

/** REQ-190/191 (sessionVersion re-checked via getFreshUser). */
export async function PATCH(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const parsed = await parseBody(req, profileSchema)
  if (parsed.error) return parsed.error
  await updateProfile(user.id, parsed.data)
  return ok({ success: true })
}
