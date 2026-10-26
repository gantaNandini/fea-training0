import { z } from 'zod'
import { ok } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { getOwnReview } from '@/lib/data/reviews'
import { isEnrolled } from '@/lib/data/progress'

export const dynamic = 'force-dynamic'

/** The viewer's eligibility + own review (incl. pending). Keeps the course page cacheable. */
export async function GET(req: Request) {
  const courseId = z.string().min(1).safeParse(new URL(req.url).searchParams.get('courseId'))
  const user = await getFreshUser()
  if (!user || !courseId.success) return ok({ authenticated: false, enrolled: false, review: null })
  const [enrolled, review] = await Promise.all([
    isEnrolled(user.id, courseId.data),
    getOwnReview(user.id, courseId.data),
  ])
  return ok({ authenticated: true, enrolled, review })
}
