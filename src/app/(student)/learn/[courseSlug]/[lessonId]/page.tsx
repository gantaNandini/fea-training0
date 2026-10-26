import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { LessonPlayer } from '@/components/player/LessonPlayer'
import { getFreshUser } from '@/lib/auth/guards'
import { getPlayerData } from '@/lib/data/progress'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Lesson', robots: { index: false, follow: false } }

/** REQ-180: the player is for enrolled students only. */
export default async function LessonPage({ params }: { params: Promise<{ courseSlug: string; lessonId: string }> }) {
  const { courseSlug, lessonId } = await params
  const user = await getFreshUser()
  if (!user) redirect(`/login?redirect=/learn/${courseSlug}/${lessonId}`)
  const data = await getPlayerData(user.id, courseSlug, lessonId)
  if (!data) notFound()
  if (!data.enrolled) redirect(`/courses/${courseSlug}`)
  if (data.missingLesson) {
    const first = data.flat[0]
    if (!first) redirect(`/courses/${courseSlug}`)
    redirect(`/learn/${courseSlug}/${first.id}`)
  }
  return (
    <LessonPlayer
      course={{ slug: data.course.slug, title: data.course.title }}
      sections={data.sections}
      lesson={data.lesson}
      prevId={data.prevId}
      nextId={data.nextId}
      percent={data.percent}
    />
  )
}
