import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiError, ApiError } from '@/lib/api/http'
import { requireUser, getProgressSummary } from '@/lib/progress-service'

type Ctx = { params: Promise<{ slug: string }> }

/** GET — per-lesson gate state for the sidebar (locked/available/video_done/completed) (R7) */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser()
    const { slug } = await ctx.params
    const course = await db.course.findUnique({ where: { slug }, select: { id: true } })
    if (!course) throw new ApiError(404, 'NOT_FOUND', 'Course not found')
    return NextResponse.json(await getProgressSummary(user, course.id), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    return apiError(e)
  }
}
