import { NextResponse } from 'next/server'
import { apiError, ApiError } from '@/lib/api/http'
import { requireUser, submitQuiz } from '@/lib/progress-service'

type Ctx = { params: Promise<{ lessonId: string }> }

/** POST { answers: { [questionId]: optionId[] } } — graded server-side (R7) */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser()
    const { lessonId } = await ctx.params
    const body = await req.json().catch(() => null) as { answers?: unknown } | null
    const a = body?.answers
    if (!a || typeof a !== 'object' || Array.isArray(a)) throw new ApiError(400, 'BAD_REQUEST', 'answers required')
    const answers: Record<string, string[]> = {}
    for (const [qid, v] of Object.entries(a as Record<string, unknown>)) {
      answers[qid] = Array.isArray(v) ? v.map(String) : []
    }
    return NextResponse.json(await submitQuiz(user, lessonId, answers), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    return apiError(e)
  }
}
