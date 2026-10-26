import { fail, ok, parseBody, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { getCoursesForPurchase } from '@/lib/data/courses'
import { enrollFree, getFirstLessonId } from '@/lib/data/progress'
import { cartAddSchema } from '@/lib/utils/validation'
import { effectivePrice } from '@/lib/utils/pricing'

/** REQ-146: free courses bypass Razorpay; an Enrollment is created directly. */
export async function POST(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const parsed = await parseBody(req, cartAddSchema)
  if (parsed.error) return parsed.error

  const [course] = await getCoursesForPurchase([parsed.data.courseId])
  if (!course) return fail('NOT_FOUND', 'Course not found.', 404)
  if (course.status !== 'PUBLISHED') return fail('COURSE_UNAVAILABLE', 'This course is not open for enrolment.', 400)
  const free = course.isFree || effectivePrice(course.price, course.discountPrice) === 0
  if (!free) return fail('NOT_FREE', 'This course is not free.', 400)

  await enrollFree(user.id, course.id)
  const first = await getFirstLessonId(course.id)
  return ok({ redirect: first ? `/learn/${course.slug}/${first}` : `/courses/${course.slug}` })
}
