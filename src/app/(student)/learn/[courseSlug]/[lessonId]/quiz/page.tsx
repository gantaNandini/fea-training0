import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { QuizForm } from '@/components/player/QuizForm'
import { getFreshUser } from '@/lib/auth/guards'
import { getPlayerData } from '@/lib/data/progress'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Quiz', robots: { index: false, follow: false } }

/**
 * The quiz opens as its own page (a form with all questions), not under the video.
 * Server-side checks: enrolled, lesson not locked, lesson has a quiz, and the video is complete
 * (students only; admins skip it).
 */
export default async function QuizPage({ params }: { params: Promise<{ courseSlug: string; lessonId: string }> }) {
  const { courseSlug, lessonId } = await params
  const user = await getFreshUser()
  if (!user) redirect(`/login?redirect=/learn/${courseSlug}/${lessonId}/quiz`)
  const data = await getPlayerData({ id: user.id, role: user.role }, courseSlug, lessonId)
  if (!data) notFound()
  if (!data.enrolled) redirect(`/courses/${courseSlug}`)
  if (data.missingLesson) redirect(`/learn/${courseSlug}`)
  if (data.locked) redirect(data.resumeLessonId ? `/learn/${courseSlug}/${data.resumeLessonId}?locked=1` : `/courses/${courseSlug}`)
  // no quiz on this lesson, or the video is not finished yet → back to the video
  if (!data.hasQuiz || !data.canTakeQuiz) redirect(`/learn/${courseSlug}/${lessonId}`)

  return (
    <div className="container-page max-w-3xl py-6">
      <Link href={`/learn/${courseSlug}/${lessonId}`} className="text-sm text-link underline-offset-4 hover:underline">
        ← Back to video
      </Link>
      <h1 className="mt-3 mb-1 text-2xl md:text-3xl">{data.lesson.title}</h1>
      <p className="mb-5 text-sm text-muted-foreground">{data.course.title}</p>
      <QuizForm lessonId={lessonId} courseSlug={courseSlug} />
    </div>
  )
}
