import { fail, forbidden, ok, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { getLessonAccess, touchEnrollment } from '@/lib/data/progress'
import { videoProvider } from '@/lib/video'
import { storage } from '@/lib/storage'
import { isPlaceholder } from '@/lib/placeholder'

export const dynamic = 'force-dynamic'

/**
 * REQ-280C / REQ-181: 401 unauthenticated, 403 not enrolled and not a free preview, 200 with
 * short-lived playback/file URLs otherwise. Raw videoUrl/fileUrl never leave the server.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string; lessonId: string }> }) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const { slug, lessonId } = await ctx.params

  const access = await getLessonAccess(user.id, slug, lessonId)
  if (!access) return fail('NOT_FOUND', 'Lesson not found.', 404)
  if (!access.allowed) return forbidden('Enrol in this course to watch this lesson.')

  if (access.enrolled) await touchEnrollment(user.id, access.courseId, access.lessonId)

  const expiresAt = Math.floor(Date.now() / 1000) + 300
  if (access.type === 'VIDEO') {
    const playback = videoProvider.getPlayback(access.videoUrl, { lessonId, userId: user.id })
    return ok({ type: 'VIDEO', playback: { kind: playback.kind, src: playback.src }, expiresAt: playback.expiresAt })
  }
  if (access.type === 'DOCUMENT') {
    const key = access.fileUrl
    const fileUrl = key && !isPlaceholder(key) ? storage.getSignedUrl(key) : null
    return ok({ type: 'DOCUMENT', fileUrl, expiresAt })
  }
  return ok({ type: 'QUIZ', expiresAt })
}
