import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiError, ApiError } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'

type Ctx = { params: Promise<{ lessonId: string }> }

interface QuizInput {
  title?: string
  passPercent?: number
  questions: Array<{
    prompt: string
    explanation?: string
    options: Array<{ text: string; isCorrect: boolean }>
  }>
}

async function requireAdmin() {
  const u = await getFreshUser()
  if (!u || u.role !== 'ADMIN') throw new ApiError(403, 'FORBIDDEN', 'Admins only')
  return u
}

function validate(b: QuizInput): number {
  if (!Array.isArray(b?.questions) || b.questions.length < 1)
    throw new ApiError(400, 'BAD_REQUEST', 'Add at least one question')
  const pass = b.passPercent ?? 80
  if (!Number.isInteger(pass) || pass < 50 || pass > 100)
    throw new ApiError(400, 'BAD_REQUEST', 'Pass mark must be 50–100')
  b.questions.forEach((q, i) => {
    if (!q.prompt?.trim()) throw new ApiError(400, 'BAD_REQUEST', `Question ${i + 1}: text required`)
    if (!Array.isArray(q.options) || q.options.length < 2)
      throw new ApiError(400, 'BAD_REQUEST', `Question ${i + 1}: at least 2 options`)
    if (q.options.some((o) => !o.text?.trim()))
      throw new ApiError(400, 'BAD_REQUEST', `Question ${i + 1}: empty option`)
    if (!q.options.some((o) => o.isCorrect))
      throw new ApiError(400, 'BAD_REQUEST', `Question ${i + 1}: mark a correct option`)
  })
  return pass
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireAdmin()
    const { lessonId } = await ctx.params
    const quiz = await db.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    })
    return NextResponse.json({ quiz })
  } catch (e) {
    return apiError(e)
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    await requireAdmin()
    const { lessonId } = await ctx.params
    const body = await req.json().catch(() => null) as QuizInput | null
    if (!body) throw new ApiError(400, 'BAD_REQUEST', 'Invalid JSON')
    const passPercent = validate(body)

    const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { id: true, type: true } })
    if (!lesson) throw new ApiError(404, 'NOT_FOUND', 'Lesson not found')
    if (lesson.type !== 'VIDEO') throw new ApiError(400, 'NOT_A_VIDEO', 'Quizzes attach to video lessons')

    const quiz = await db.quiz.upsert({
      where: { lessonId },
      create: { lessonId, title: body.title?.trim() || 'Lesson quiz', passPercent },
      update: { title: body.title?.trim() || 'Lesson quiz', passPercent },
    })
    await db.quizQuestion.deleteMany({ where: { quizId: quiz.id } })
    for (const [qi, qq] of body.questions.entries()) {
      await db.quizQuestion.create({
        data: {
          quizId: quiz.id,
          prompt: qq.prompt.trim(),
          explanation: qq.explanation?.trim() || null,
          order: qi + 1,
          options: {
            create: qq.options.map((o, oi) => ({
              text: o.text.trim(),
              isCorrect: !!o.isCorrect,
              order: oi + 1,
            })),
          },
        },
      })
    }
    return NextResponse.json({ ok: true, quizId: quiz.id })
  } catch (e) {
    return apiError(e)
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireAdmin()
    const { lessonId } = await ctx.params
    await db.quiz.deleteMany({ where: { lessonId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError(e)
  }
}
