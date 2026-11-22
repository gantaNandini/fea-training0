import { apiError, ApiError, ok, parseBody, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { setLessonProgress } from '@/lib/data/progress'
import { assertLessonAccess, isStaff } from '@/lib/progress-service'
import { progressSchema } from '@/lib/utils/validation'

export const dynamic = 'force-dynamic'

/**
 * REQ-288 / REQ-184: upsert LessonProgress, return the updated completion %.
 * Only for the manual "mark complete" on document/slide lessons. A video is complete only through
 * the watch tracking (90%) and the quiz pass, so a student cannot mark it done from here, and a
 * locked lesson cannot be touched at all.
 */
export async function POST(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const parsed = await parseBody(req, progressSchema)
  if (parsed.error) return parsed.error
  const who = { id: user.id, role: user.role }
  try {
    const { lesson } = await assertLessonAccess(who, parsed.data.lessonId)
    if (lesson.type === 'VIDEO' && !isStaff(who)) {
      throw new ApiError(403, 'VIDEO_AUTO', 'A video is completed by watching it (90%) and passing its quiz')
    }
  } catch (e) {
    return apiError(e)
  }
  const res = await setLessonProgress(user.id, parsed.data.lessonId, parsed.data.completed ?? true)
  if (!res) return apiError(new ApiError(403, 'NOT_ENROLLED', 'You are not enrolled in this course.'))
  return ok({ percent: res.percent, completedLessonIds: res.completedLessonIds })
}
