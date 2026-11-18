import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api/http'
import { requireUser, getQuizForStudent } from '@/lib/progress-service'

type Ctx = { params: Promise<{ lessonId: string }> }

/** GET — questions + options WITHOUT isCorrect; 403 until the video is completed (R7) */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser()
    const { lessonId } = await ctx.params
    return NextResponse.json(await getQuizForStudent(user, lessonId), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    return apiError(e)
  }
}
