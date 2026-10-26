import { forbidden, ok, parseBody, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { setLessonProgress } from '@/lib/data/progress'
import { progressSchema } from '@/lib/utils/validation'

export const dynamic = 'force-dynamic'

/** REQ-288 / REQ-184: upsert LessonProgress, return the updated completion %. */
export async function POST(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const parsed = await parseBody(req, progressSchema)
  if (parsed.error) return parsed.error
  const res = await setLessonProgress(user.id, parsed.data.lessonId, parsed.data.completed ?? true)
  if (!res) return forbidden('You are not enrolled in this course.')
  return ok({ percent: res.percent, completedLessonIds: res.completedLessonIds })
}
