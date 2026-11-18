import { NextResponse } from 'next/server'
import { apiError, ApiError } from '@/lib/api/http'
import { requireUser, recordWatch } from '@/lib/progress-service'

type Ctx = { params: Promise<{ lessonId: string }> }

/** POST { ranges: [[start,end],...], duration } — heartbeat from the video player (R7) */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser()
    const { lessonId } = await ctx.params
    const body = await req.json().catch(() => null) as { ranges?: unknown; duration?: unknown } | null
    if (!body || !Array.isArray(body.ranges)) throw new ApiError(400, 'BAD_REQUEST', 'ranges required')
    return NextResponse.json(
      await recordWatch(user, lessonId, body.ranges, Number(body.duration)),
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    return apiError(e)
  }
}
