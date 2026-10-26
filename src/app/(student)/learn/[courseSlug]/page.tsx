import { notFound, redirect } from 'next/navigation'
import { getFreshUser } from '@/lib/auth/guards'
import { getCourseBySlug } from '@/lib/data/courses'
import { getFirstLessonId, isEnrolled } from '@/lib/data/progress'

export const dynamic = 'force-dynamic'

/** /learn/{slug} → first lesson (or the course page when not enrolled). */
export default async function LearnIndex({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params
  const user = await getFreshUser()
  if (!user) redirect(`/login?redirect=/learn/${courseSlug}`)
  const course = await getCourseBySlug(courseSlug)
  if (!course) notFound()
  if (!(await isEnrolled(user.id, course.id))) redirect(`/courses/${courseSlug}`)
  const first = await getFirstLessonId(course.id)
  redirect(first ? `/learn/${courseSlug}/${first}` : `/courses/${courseSlug}`)
}
