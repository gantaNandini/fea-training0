/**
 * Server-side enforcement: watch-to-complete → quiz (≥ pass mark) → next lesson unlocks.
 * Adapts the reference code to this repo's real Prisma schema, auth helpers and DB client.
 *
 * IMPORTANT: Several methods require schema fields added in migration 20261118_trainee_footer
 * (watchedRanges, durationSeconds, videoCompletedAt, quizPassedAt, courseId on LessonProgress
 * + Quiz, QuizQuestion, QuizOption, QuizAttempt models). The methods compile before that
 * migration runs, but the new API routes will return 500 until the migration is applied and
 * `prisma generate` re-run.
 */
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { ApiError } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import {
  PASS_PERCENT_DEFAULT,
  computeGates,
  flattenCurriculum,
  nextLessonId,
  summarise,
  type CurriculumLesson,
  type LessonGate,
} from '@/lib/course-gating'
import { gradeQuiz } from '@/lib/quiz-grading'
import { coverage, coveredSeconds, mergeRanges, normalizeRanges, type Range } from '@/lib/watch-ranges'

// ── Types ────────────────────────────────────────────────────────────────────

export type SessionUser = { id: string; role: string }
export const isStaff = (u: SessionUser) => u.role === 'ADMIN' || u.role === 'INSTRUCTOR'

/** Extended LessonProgress fields added by the gating migration. */
interface LPExtended {
  id: string
  userId: string
  lessonId: string
  completed: boolean
  completedAt: Date | null
  watchedRanges?: unknown
  durationSeconds?: number
  videoCompletedAt?: Date | null
  quizPassedAt?: Date | null
  lastHeartbeatAt?: Date | null
  courseId?: string
}

/** Call from API routes — throws ApiError 401 if not logged in. */
export async function requireUser(): Promise<SessionUser> {
  const u = await getFreshUser()
  if (!u) throw new ApiError(401, 'UNAUTHENTICATED', 'Please log in')
  return { id: u.id, role: u.role }
}

/** A video counts as "watched" once this share of its seconds has really been played. */
export const WATCH_COMPLETE_RATIO = 0.9
const MAX_RATE = 2.5
const SLACK = 15

// ── Loading helpers ──────────────────────────────────────────────────────────

async function loadLesson(lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { select: { courseId: true } } },
  })
  if (!lesson) throw new ApiError(404, 'NOT_FOUND', 'Lesson not found')
  return { lesson, courseId: lesson.section.courseId }
}

async function loadCurriculum(courseId: string): Promise<CurriculumLesson[]> {
  // Load sections + lessons. The `quiz` relation (hasQuiz flag) is only available after
  // migration, so we query it separately to avoid a Prisma compile-time error.
  const sections = await db.section.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: { lessons: { orderBy: { order: 'asc' } } },
  })

  // Attempt to load quiz ids for all lessons (gracefully returns {} if Quiz model is absent)
  let quizLessonIds = new Set<string>()
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quizRows = await (db as any).quiz.findMany({
      where: { lessonId: { in: sections.flatMap((s) => s.lessons.map((l) => l.id)) } },
      select: { lessonId: true },
    }) as Array<{ lessonId: string }>
    quizLessonIds = new Set(quizRows.map((r) => r.lessonId))
  } catch {
    // Quiz model not yet in schema — no quizzes
  }

  return flattenCurriculum(
    sections.map((s) => ({
      order: s.order,
      lessons: s.lessons.map((l) => ({
        id: l.id,
        order: l.order,
        type: l.type,
        isFreePreview: l.isFreePreview,
        hasQuiz: quizLessonIds.has(l.id),
      })),
    })),
  )
}

async function getProgressFlags(userId: string, courseId: string) {
  const rows = await db.lessonProgress.findMany({
    where: { userId, lesson: { section: { courseId } } },
  }) as LPExtended[]
  return Object.fromEntries(
    rows.map((r) => [
      r.lessonId,
      {
        videoCompleted: !!r.videoCompletedAt,
        quizPassed: !!r.quizPassedAt,
      },
    ]),
  )
}

async function isEnrolled(userId: string, courseId: string) {
  return !!(await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  }))
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getCourseGates(
  user: SessionUser,
  courseId: string,
): Promise<{ lessons: CurriculumLesson[]; gates: LessonGate[] }> {
  const lessons = await loadCurriculum(courseId)
  if (isStaff(user)) {
    const gates = computeGates(lessons, {}).map((g) => ({
      ...g,
      locked: false,
      state: g.state === 'locked' ? ('available' as const) : g.state,
    }))
    return { lessons, gates }
  }
  return { lessons, gates: computeGates(lessons, await getProgressFlags(user.id, courseId)) }
}

/**
 * Call from every route / page that serves lesson content, including the signed
 * video/file endpoint. Hiding a button is not enough: direct URLs must 403.
 */
export async function assertLessonAccess(user: SessionUser, lessonId: string) {
  const { lesson, courseId } = await loadLesson(lessonId)
  if (isStaff(user) || lesson.isFreePreview) return { lesson, courseId }
  if (!(await isEnrolled(user.id, courseId)))
    throw new ApiError(403, 'NOT_ENROLLED', 'Enrol to access this lesson')
  const { gates } = await getCourseGates(user, courseId)
  if (gates.find((g) => g.lessonId === lessonId)?.locked) {
    throw new ApiError(
      403,
      'LESSON_LOCKED',
      'Finish the previous video and pass its quiz (80%) to unlock this lesson',
    )
  }
  return { lesson, courseId }
}

export async function recordWatch(
  user: SessionUser,
  lessonId: string,
  rawRanges: unknown,
  reportedDuration: number,
) {
  const { lesson, courseId } = await assertLessonAccess(user, lessonId)
  if (lesson.type !== 'VIDEO') throw new ApiError(400, 'NOT_A_VIDEO', 'Only video lessons track watch progress')
  if (isStaff(user)) return { videoCompleted: true, coverage: 1 }

  const duration =
    lesson.durationSeconds > 0
      ? lesson.durationSeconds
      : Math.min(12 * 3600, Math.max(0, Math.round(reportedDuration || 0)))
  if (duration < 1) throw new ApiError(400, 'NO_DURATION', 'Video duration unknown')

  const existing = (await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  })) as LPExtended | null

  const stored = normalizeRanges(existing?.watchedRanges, duration)
  const merged = mergeRanges(stored, normalizeRanges(rawRanges, duration))

  const now = new Date()
  const elapsed = existing?.lastHeartbeatAt
    ? (now.getTime() - existing.lastHeartbeatAt.getTime()) / 1000
    : 30
  if (coveredSeconds(merged) - coveredSeconds(stored) > elapsed * MAX_RATE + SLACK) {
    throw new ApiError(422, 'IMPLAUSIBLE_WATCH', 'Watch data rejected')
  }

  const done = coverage(merged, duration) >= WATCH_COMPLETE_RATIO
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extendedData: Record<string, any> = {
    watchedRanges: merged as unknown as Prisma.InputJsonValue,
    durationSeconds: duration,
    lastHeartbeatAt: now,
    ...(done && !existing?.videoCompletedAt ? { videoCompletedAt: now } : {}),
  }

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: { userId: user.id, lessonId, courseId, completed: false, ...extendedData } as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: extendedData as any,
  })
  return { videoCompleted: done || !!existing?.videoCompletedAt, coverage: coverage(merged, duration) }
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

interface QuizRow {
  id: string
  title: string
  passPercent: number
  questions: Array<{
    id: string
    prompt: string
    explanation: string | null
    options: Array<{ id: string; text: string; isCorrect: boolean }>
  }>
}

async function loadQuiz(lessonId: string): Promise<QuizRow | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (db as any).quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    })
  } catch {
    return null
  }
}

/** Quiz for the student: NEVER includes isCorrect. Only after the video is watched. */
export async function getQuizForStudent(user: SessionUser, lessonId: string) {
  await assertLessonAccess(user, lessonId)
  const quiz = await loadQuiz(lessonId)
  if (!quiz) throw new ApiError(404, 'NO_QUIZ', 'This lesson has no quiz')

  const progress = (await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  })) as LPExtended | null

  if (!isStaff(user) && !progress?.videoCompletedAt) {
    throw new ApiError(403, 'VIDEO_NOT_COMPLETED', 'Finish watching the video to unlock the quiz')
  }

  interface AttemptRow { scorePercent: number; passed: boolean; createdAt: Date }
  let lastAttempt: AttemptRow | null = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastAttempt = await (db as any).quizAttempt.findFirst({
      where: { userId: user.id, lessonId },
      orderBy: { createdAt: 'desc' },
    })
  } catch { /* model not yet present */ }

  return {
    quizId: quiz.id,
    title: quiz.title,
    passPercent: quiz.passPercent,
    alreadyPassed: !!progress?.quizPassedAt,
    lastAttempt: lastAttempt
      ? { scorePercent: lastAttempt.scorePercent, passed: lastAttempt.passed, at: lastAttempt.createdAt }
      : null,
    questions: shuffle(quiz.questions).map((q) => ({
      id: q.id,
      prompt: q.prompt,
      multiple: q.options.filter((o) => o.isCorrect).length > 1,
      options: shuffle(q.options).map((o) => ({ id: o.id, text: o.text })), // isCorrect omitted
    })),
  }
}

export async function submitQuiz(
  user: SessionUser,
  lessonId: string,
  answers: Record<string, string[]>,
) {
  await assertLessonAccess(user, lessonId)
  const quiz = await loadQuiz(lessonId)
  if (!quiz) throw new ApiError(404, 'NO_QUIZ', 'This lesson has no quiz')

  const progress = (await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  })) as LPExtended | null

  if (!isStaff(user) && !progress?.videoCompletedAt) {
    throw new ApiError(403, 'VIDEO_NOT_COMPLETED', 'Finish watching the video first')
  }

  const result = gradeQuiz(
    quiz.questions.map((q) => ({
      id: q.id,
      correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
    })),
    answers,
    quiz.passPercent ?? PASS_PERCENT_DEFAULT,
  )

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).quizAttempt.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        lessonId,
        correct: result.correct,
        total: result.total,
        scorePercent: result.scorePercent,
        passed: result.passed,
        answers: answers as unknown as Prisma.InputJsonValue,
      },
    })
  } catch { /* model not yet migrated */ }

  if (result.passed && !isStaff(user)) {
    await db.lessonProgress.update({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { quizPassedAt: progress?.quizPassedAt ?? new Date() } as any,
    })
  }

  const { courseId } = await loadLesson(lessonId).then((r) => r)
  const lessons = await loadCurriculum(courseId)
  return {
    ...result,
    passPercent: quiz.passPercent,
    explanations: result.passed
      ? Object.fromEntries(
          quiz.questions.filter((q) => q.explanation).map((q) => [q.id, q.explanation]),
        )
      : undefined,
    nextLessonId: result.passed ? nextLessonId(lessons, lessonId) : null,
  }
}

export async function getProgressSummary(user: SessionUser, courseId: string) {
  const { gates } = await getCourseGates(user, courseId)
  return { gates, summary: summarise(gates) }
}

export type { Range }
