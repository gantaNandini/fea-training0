/**
 * Server-side enforcement: watch-to-complete → quiz (≥ pass mark) → next lesson unlocks.
 * Schema migration 20261118_trainee_footer_quiz_progress has been applied — real model types used.
 */
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { ApiError } from '@/lib/api/http'
import {
  PASS_PERCENT_DEFAULT,
  computeGates,
  flattenCurriculum,
  nextLessonId,
  summarise,
  type CurriculumLesson,
  type LessonGate,
} from '@/lib/course-gating'
import { buildReview, gradeQuiz, unansweredQuestionIds } from '@/lib/quiz-grading'
import { coverage, coveredSeconds, mergeRanges, normalizeRanges, type Range } from '@/lib/watch-ranges'

export type SessionUser = { id: string; role: string }
export const isStaff = (u: SessionUser) => u.role === 'ADMIN' || u.role === 'INSTRUCTOR'

export async function requireUser(): Promise<SessionUser> {
  // loaded lazily so the lock/quiz logic below can be imported (and tested) without the auth stack
  const { getFreshUser } = await import('@/lib/auth/guards')
  const u = await getFreshUser()
  if (!u) throw new ApiError(401, 'UNAUTHENTICATED', 'Please log in')
  return { id: u.id, role: u.role }
}

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
  const sections = await db.section.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: { quiz: { select: { id: true } } },
      },
    },
  })
  return flattenCurriculum(
    sections.map((s) => ({
      order: s.order,
      lessons: s.lessons.map((l) => ({
        id: l.id,
        order: l.order,
        type: l.type,
        isFreePreview: l.isFreePreview,
        hasQuiz: l.quiz !== null,
      })),
    })),
  )
}

async function getProgressFlags(userId: string, courseId: string) {
  const rows = await db.lessonProgress.findMany({
    where: { userId, lesson: { section: { courseId } } },
  })
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

  const existing = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  })

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
  const sharedData = {
    watchedRanges: merged as unknown as Prisma.InputJsonValue,
    durationSeconds: duration,
    lastHeartbeatAt: now,
    ...(done && !existing?.videoCompletedAt ? { videoCompletedAt: now } : {}),
  }

  // A video with no quiz is complete as soon as the 90% watch is reached; with a quiz it waits for the pass.
  const hasQuiz = (await db.quiz.count({ where: { lessonId } })) > 0
  const finishNow = done && !hasQuiz && !existing?.completed
  const completionData = finishNow ? { completed: true, completedAt: now } : {}

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, courseId, completed: false, ...sharedData, ...completionData },
    update: { ...sharedData, ...completionData },
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

export async function getQuizForStudent(user: SessionUser, lessonId: string) {
  await assertLessonAccess(user, lessonId)
  const quiz = await db.quiz.findUnique({
    where: { lessonId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: { options: { orderBy: { order: 'asc' } } },
      },
    },
  })
  if (!quiz) throw new ApiError(404, 'NO_QUIZ', 'This lesson has no quiz')

  const progress = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  })
  if (!isStaff(user) && !progress?.videoCompletedAt) {
    throw new ApiError(403, 'VIDEO_NOT_COMPLETED', 'Finish watching the video to unlock the quiz')
  }

  const lastAttempt = await db.quizAttempt.findFirst({
    where: { userId: user.id, lessonId },
    orderBy: { createdAt: 'desc' },
  })

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
      options: shuffle(q.options).map((o) => ({ id: o.id, text: o.text })),
    })),
  }
}

export async function submitQuiz(
  user: SessionUser,
  lessonId: string,
  answers: Record<string, string[]>,
) {
  await assertLessonAccess(user, lessonId)
  const quiz = await db.quiz.findUnique({
    where: { lessonId },
    include: { questions: { include: { options: true } } },
  })
  if (!quiz) throw new ApiError(404, 'NO_QUIZ', 'This lesson has no quiz')

  const progress = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  })
  if (!isStaff(user) && !progress?.videoCompletedAt) {
    throw new ApiError(403, 'VIDEO_NOT_COMPLETED', 'Finish watching the video first')
  }

  const gradeInput = [...quiz.questions]
    .sort((a, b) => a.order - b.order)
    .map((q) => ({
      id: q.id,
      explanation: q.explanation,
      correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
    }))
  // The form is graded only when every question is answered.
  const missing = unansweredQuestionIds(gradeInput, answers)
  if (missing.length > 0) {
    throw new ApiError(400, 'INCOMPLETE', `Answer every question before submitting (${missing.length} left)`)
  }
  const result = gradeQuiz(gradeInput, answers, quiz.passPercent ?? PASS_PERCENT_DEFAULT)

  await db.quizAttempt.create({
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

  if (result.passed && !isStaff(user)) {
    await db.lessonProgress.update({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      data: {
        quizPassedAt: progress?.quizPassedAt ?? new Date(),
        completed: true,
        completedAt: progress?.completedAt ?? new Date(),
      },
    })
  }

  const { courseId } = await loadLesson(lessonId).then((r) => r)
  const lessons = await loadCurriculum(courseId)
  return {
    ...result,
    passPercent: quiz.passPercent,
    // Score, mistakes and the correct answers are shown after Submit, pass or fail.
    review: buildReview(gradeInput, answers),
    nextLessonId: result.passed ? nextLessonId(lessons, lessonId) : null,
  }
}

export async function getProgressSummary(user: SessionUser, courseId: string) {
  const { gates } = await getCourseGates(user, courseId)
  return { gates, summary: summarise(gates) }
}

export type { Range }
