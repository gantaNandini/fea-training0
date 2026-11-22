import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { LessonPlayer } from '@/components/player/LessonPlayer'
import { getFreshUser } from '@/lib/auth/guards'
import { getPlayerData } from '@/lib/data/progress'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Lesson', robots: { index: false, follow: false } }

/**
 * REQ-180: the player is for enrolled students only.
 * Sequential lock (enforced here on the server, so typing a locked lesson's address does not work):
 * a lesson opens only after the previous video is watched (90%) and its quiz is passed (80%).
 */
export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>
  searchParams: Promise<{ locked?: string }>
}) {
  const { courseSlug, lessonId } = await params
  const { locked } = await searchParams
  const user = await getFreshUser()
  if (!user) redirect(`/login?redirect=/learn/${courseSlug}/${lessonId}`)
  const data = await getPlayerData({ id: user.id, role: user.role }, courseSlug, lessonId)
  if (!data) notFound()
  if (!data.enrolled) redirect(`/courses/${courseSlug}`)
  if (data.missingLesson) {
    const first = data.flat[0]
    if (!first) redirect(`/courses/${courseSlug}`)
    redirect(`/learn/${courseSlug}/${first.id}`)
  }
  if (data.locked) {
    // locked lesson: send the student back to the video they still have to finish
    redirect(data.resumeLessonId ? `/learn/${courseSlug}/${data.resumeLessonId}?locked=1` : `/courses/${courseSlug}`)
  }
  return (
    <LessonPlayer
      course={{ slug: data.course.slug, title: data.course.title }}
      sections={data.sections}
      lesson={data.lesson}
      prevId={data.prevId}
      nextId={data.nextId}
      nextLocked={data.nextLocked}
      hasQuiz={data.hasQuiz}
      quizPassed={data.quizPassed}
      videoCompleted={data.videoCompleted}
      canTakeQuiz={data.canTakeQuiz}
      showLockedNotice={locked === '1'}
      percent={data.percent}
    />
  )
}
