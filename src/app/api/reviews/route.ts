import { NextResponse } from 'next/server'
import { fail, ok, parseBody, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { getCourseBySlug } from '@/lib/data/courses'
import { createReview, getApprovedReviews, getOwnReview } from '@/lib/data/reviews'
import { isEnrolled } from '@/lib/data/progress'
import { reviewSchema } from '@/lib/utils/validation'
import { messages } from '@/lib/messages'

/** Public paginated list of approved reviews. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const slug = sp.get('slug') ?? ''
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const course = await getCourseBySlug(slug)
  if (!course) return fail('NOT_FOUND', 'Course not found.', 404)
  const data = await getApprovedReviews(course.id, course.slug, page)
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=60' } })
}

/** REQ-287: enrolled students only; one per course; created with approved=false. */
export async function POST(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const parsed = await parseBody(req, reviewSchema)
  if (parsed.error) return parsed.error
  const { courseId, rating, comment } = parsed.data

  if (!(await isEnrolled(user.id, courseId))) {
    return fail('NOT_ENROLLED', 'Only enrolled students can review this course.', 403)
  }
  if (await getOwnReview(user.id, courseId)) {
    return fail('ALREADY_REVIEWED', messages.course.alreadyReviewed, 409)
  }
  try {
    await createReview({ userId: user.id, courseId, rating, comment })
  } catch (e) {
    if ((e as { code?: string }).code === 'P2002') {
      return fail('ALREADY_REVIEWED', messages.course.alreadyReviewed, 409)
    }
    throw e
  }
  return ok({ success: true }, { status: 201 })
}
