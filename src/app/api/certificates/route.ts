import { z } from 'zod'
import { fail, forbidden, ok, parseBody, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { issueCertificate } from '@/lib/data/certificates'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({ courseId: z.string().min(1).max(64) })

/** Issue (or fetch) the completion certificate for the signed-in learner. */
export async function POST(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const parsed = await parseBody(req, bodySchema)
  if (parsed.error) return parsed.error
  const res = await issueCertificate(user.id, parsed.data.courseId)
  if (!res.ok) {
    if (res.reason === 'NOT_ENROLLED') return forbidden('You are not enrolled in this course.')
    return fail('NOT_COMPLETE', 'Complete every lesson to unlock your certificate.', 409)
  }
  return ok({ code: res.code })
}
