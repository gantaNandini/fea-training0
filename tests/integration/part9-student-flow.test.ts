import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { db } from '@/lib/db'
import { getPlayerData } from '@/lib/data/progress'
import { assertLessonAccess, getQuizForStudent, recordWatch, submitQuiz } from '@/lib/progress-service'
import { makeCourse, makeUser } from './factories'

/**
 * The Part 9 rules, run against the real server code and a real database:
 * 90% watch → quiz opens → 80% pass → next video unlocks; locked lessons are refused by address.
 * Layout: 7 videos (quizzes on 2, 4, 5, 7) and 3 slide files, in the order students see them.
 */
const LAYOUT = [
  ['v1', 'Crack-Like Flaws – Part 1', 'VIDEO'],
  ['v2', 'Crack-Like Flaws – Part 2', 'VIDEO'],
  ['v3', 'Flaw Characterization – Part 1', 'VIDEO'],
  ['v4', 'Flaw Characterization – Part 2', 'VIDEO'],
  ['s1', 'Lecture slides 1', 'DOCUMENT'],
  ['v5', 'Flaw Depth Characterization', 'VIDEO'],
  ['s2', 'Lecture slides 2', 'DOCUMENT'],
  ['v6', 'Branched & Multiple Flaws – Part 1', 'VIDEO'],
  ['v7', 'Branched & Multiple Flaws – Part 2', 'VIDEO'],
  ['s3', 'Lecture slides 3', 'DOCUMENT'],
] as const
const DURATION = 1200

interface QuizJson {
  lessonTitle: string
  title: string
  passPercent: number
  questions: Array<{ prompt: string; options: string[]; correct: number[]; explanation?: string }>
}

async function fixture() {
  const teacher = await makeUser({ role: 'INSTRUCTOR' })
  const student = await makeUser()
  const admin = await makeUser({ role: 'ADMIN' })
  const course = await makeCourse({ instructorId: teacher.id })
  const section = await db.section.create({ data: { courseId: course.id, title: 'Part 9', order: 1 } })
  const L: Record<string, { id: string }> = {}
  for (const [i, [key, title, type]] of LAYOUT.entries()) {
    L[key] = await db.lesson.create({
      data: {
        sectionId: section.id,
        title,
        type,
        order: i + 1,
        durationSeconds: type === 'VIDEO' ? DURATION : 0,
        isFreePreview: false,
      },
    })
  }
  // the same quizzes the import script writes
  const quizzes = JSON.parse(readFileSync('scripts/quizzes.part9.json', 'utf8')) as QuizJson[]
  for (const q of quizzes) {
    const lesson = await db.lesson.findFirstOrThrow({ where: { title: q.lessonTitle, section: { courseId: course.id } } })
    const quiz = await db.quiz.create({ data: { lessonId: lesson.id, title: q.title, passPercent: q.passPercent } })
    for (const [qi, x] of q.questions.entries()) {
      await db.quizQuestion.create({
        data: {
          quizId: quiz.id,
          prompt: x.prompt,
          explanation: x.explanation ?? null,
          order: qi + 1,
          options: { create: x.options.map((t, oi) => ({ text: t, isCorrect: x.correct.includes(oi), order: oi + 1 })) },
        },
      })
    }
  }
  await db.enrollment.createMany({
    data: [
      { userId: student.id, courseId: course.id },
      { userId: admin.id, courseId: course.id },
    ],
  })
  return {
    slug: course.slug,
    L,
    student: { id: student.id, role: student.role as string },
    admin: { id: admin.id, role: admin.role as string },
  }
}
type Fx = Awaited<ReturnType<typeof fixture>>

/** a genuine watch: the heartbeat is old enough that covering 95% of the video is plausible */
async function watch(fx: Fx, key: string, fraction = 0.95) {
  const lessonId = fx.L[key].id
  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: fx.student.id, lessonId } },
    create: { userId: fx.student.id, lessonId, courseId: '', lastHeartbeatAt: new Date(Date.now() - 3600_000) },
    update: { lastHeartbeatAt: new Date(Date.now() - 3600_000) },
  })
  return recordWatch(fx.student, lessonId, [[0, Math.floor(DURATION * fraction)]], DURATION)
}

/** answers for a quiz with exactly `right` questions correct */
async function answers(fx: Fx, key: string, right: number) {
  const quiz = await getQuizForStudent(fx.student, fx.L[key].id)
  const out: Record<string, string[]> = {}
  for (const [i, q] of quiz.questions.entries()) {
    const opts = await db.quizOption.findMany({ where: { questionId: q.id } })
    const pick = i < right ? opts.filter((o) => o.isCorrect) : opts.filter((o) => !o.isCorrect).slice(0, 1)
    out[q.id] = pick.map((o) => o.id)
  }
  return out
}
const view = (fx: Fx, key: string, user = fx.student) => getPlayerData(user, fx.slug, fx.L[key].id)
const isLocked = async (fx: Fx, key: string) => {
  const d = await view(fx, key)
  return !!d && 'locked' in d && d.locked === true
}

describe('Part 9 student rules on the real server code', () => {
  it('a fresh student can open only video 1; lessons 2..10 are refused by address', async () => {
    const fx = await fixture()
    expect(await isLocked(fx, 'v1')).toBe(false)
    for (const k of ['v2', 'v3', 'v4', 's1', 'v5', 's2', 'v6', 'v7', 's3']) expect(await isLocked(fx, k), k).toBe(true)
    await expect(assertLessonAccess(fx.student, fx.L.v7.id)).rejects.toMatchObject({ status: 403, code: 'LESSON_LOCKED' })
  })

  it('locked lesson redirects to the video the student still has to finish', async () => {
    const fx = await fixture()
    const d = await view(fx, 'v7')
    expect(d).toMatchObject({ locked: true, resumeLessonId: fx.L.v1.id })
  })

  it('rule 1: skipping to the end does not complete a video; 90% of the playing time does', async () => {
    const fx = await fixture()
    // a huge jump with no real playing time is rejected
    await expect(recordWatch(fx.student, fx.L.v1.id, [[0, DURATION]], DURATION)).rejects.toMatchObject({ code: 'IMPLAUSIBLE_WATCH' })
    // only the last 10 seconds played → not complete
    expect((await watch(fx, 'v1', 0.01)).videoCompleted).toBe(false)
    expect(await isLocked(fx, 'v2')).toBe(true)
    // 95% played → complete
    expect((await watch(fx, 'v1')).videoCompleted).toBe(true)
  })

  it('rule 6: video 1 has no quiz, so the 90% watch alone unlocks video 2', async () => {
    const fx = await fixture()
    expect(await isLocked(fx, 'v2')).toBe(true)
    await watch(fx, 'v1')
    expect(await isLocked(fx, 'v2')).toBe(false)
  })

  it('rule 2: the quiz is closed until the video is complete (read and submit both refused)', async () => {
    const fx = await fixture()
    await watch(fx, 'v1')
    await expect(getQuizForStudent(fx.student, fx.L.v2.id)).rejects.toMatchObject({ code: 'VIDEO_NOT_COMPLETED' })
    await expect(submitQuiz(fx.student, fx.L.v2.id, { x: ['y'] })).rejects.toMatchObject({ code: 'VIDEO_NOT_COMPLETED' })
    await watch(fx, 'v2', 0.5) // half is not enough
    await expect(getQuizForStudent(fx.student, fx.L.v2.id)).rejects.toMatchObject({ code: 'VIDEO_NOT_COMPLETED' })
    await watch(fx, 'v2')
    const quiz = await getQuizForStudent(fx.student, fx.L.v2.id)
    expect(quiz.questions).toHaveLength(8)
    // the answer key is never sent to the student
    expect(JSON.stringify(quiz)).not.toContain('isCorrect')
  })

  it('rule 5: finishing the video is not enough on its own; video 3 stays locked until the quiz is passed', async () => {
    const fx = await fixture()
    await watch(fx, 'v1')
    await watch(fx, 'v2')
    expect(await isLocked(fx, 'v3')).toBe(true)
  })

  it('rule 3/4: the form must be fully answered; 6/8 fails and can be retaken; 7/8 passes and unlocks video 3', async () => {
    const fx = await fixture()
    await watch(fx, 'v1')
    await watch(fx, 'v2')

    // unanswered questions → refused, not graded
    const partial = await answers(fx, 'v2', 8)
    delete partial[Object.keys(partial)[0]]
    await expect(submitQuiz(fx.student, fx.L.v2.id, partial)).rejects.toMatchObject({ status: 400, code: 'INCOMPLETE' })

    // 6 of 8 = 75% → not passed, next video still locked, mistakes and correct answers are shown
    const fail = await submitQuiz(fx.student, fx.L.v2.id, await answers(fx, 'v2', 6))
    expect(fail).toMatchObject({ passed: false, correct: 6, total: 8, scorePercent: 75 })
    expect(fail.review.filter((r) => !r.correct)).toHaveLength(2)
    for (const r of fail.review) expect(r.correctOptionIds.length).toBeGreaterThan(0)
    expect(await isLocked(fx, 'v3')).toBe(true)

    // retake allowed; 7 of 8 = 87.5% → passed
    const pass = await submitQuiz(fx.student, fx.L.v2.id, await answers(fx, 'v2', 7))
    expect(pass).toMatchObject({ passed: true, correct: 7, nextLessonId: fx.L.v3.id })
    expect(await isLocked(fx, 'v3')).toBe(false)
    // every attempt is kept
    expect(await db.quizAttempt.count({ where: { userId: fx.student.id, lessonId: fx.L.v2.id } })).toBe(2)
  })

  it('pass marks per quiz: 7/8, 4/5, 4/4, 7/8 (one question fewer fails)', async () => {
    const fx = await fixture()
    const plan: Array<[string, number, number]> = [['v2', 8, 7], ['v4', 5, 4], ['v5', 4, 4], ['v7', 8, 7]]
    await watch(fx, 'v1')
    for (const [key, total, need] of plan) {
      // unlock path: finish whatever precedes this video so it is reachable
      if (key === 'v4') { await watch(fx, 'v3') }
      if (key === 'v5') { /* slides never block */ }
      if (key === 'v7') { await watch(fx, 'v6') }
      await watch(fx, key)
      const below = await submitQuiz(fx.student, fx.L[key].id, await answers(fx, key, need - 1))
      expect(below.passed, `${key} ${need - 1}/${total}`).toBe(false)
      const ok = await submitQuiz(fx.student, fx.L[key].id, await answers(fx, key, need))
      expect(ok.passed, `${key} ${need}/${total}`).toBe(true)
      expect(ok.total).toBe(total)
    }
  })

  it('rule 7: slide files never block; they open after video 4 and video 5 opens without touching them', async () => {
    const fx = await fixture()
    await watch(fx, 'v1'); await watch(fx, 'v2'); await submitQuiz(fx.student, fx.L.v2.id, await answers(fx, 'v2', 8))
    await watch(fx, 'v3'); await watch(fx, 'v4'); await submitQuiz(fx.student, fx.L.v4.id, await answers(fx, 'v4', 5))
    expect(await isLocked(fx, 's1')).toBe(false)
    expect(await isLocked(fx, 'v5')).toBe(false) // slide 1 was never opened or marked
    expect(await isLocked(fx, 'v6')).toBe(true)
  })

  it('rule 8: an admin skips every lock and can open any quiz', async () => {
    const fx = await fixture()
    for (const k of ['v3', 'v7', 's3']) {
      const d = await view(fx, k, fx.admin)
      expect(d && 'locked' in d && d.locked, k).toBe(false)
    }
    await expect(getQuizForStudent(fx.admin, fx.L.v7.id)).resolves.toBeDefined()
  })

  it('a quiz pass for a video that was never watched cannot be forged by submitting', async () => {
    const fx = await fixture()
    await watch(fx, 'v1')
    await expect(submitQuiz(fx.student, fx.L.v2.id, { fake: ['x'] })).rejects.toMatchObject({ code: 'VIDEO_NOT_COMPLETED' })
    expect(await isLocked(fx, 'v3')).toBe(true)
  })
})
