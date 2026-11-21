import { NextResponse } from 'next/server'
import { apiError, ApiError } from '@/lib/api/http'
import { requireUser } from '@/lib/progress-service'
import { checkQuizQuestion } from '@/lib/quiz-check'

type Ctx = { params: Promise<{ lessonId: string }> }

/** POST { questionId, optionIds: string[] } → { correct } (no answer key is ever returned) */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser()
    const { lessonId } = await ctx.params
    const body = await req.json().catch(() => null) as { questionId?: string; optionIds?: unknown } | null
    if (!body || typeof body.questionId !== 'string' || !Array.isArray(body.optionIds)) {
      throw new ApiError(400, 'BAD_REQUEST', 'questionId and optionIds required')
    }
    const optionIds = body.optionIds.map(String).slice(0, 20)
    return NextResponse.json(
      await checkQuizQuestion(user, lessonId, body.questionId, optionIds),
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    return apiError(e)
  }
}
