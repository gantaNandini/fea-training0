import { describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import { makeUser } from './factories'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/guards', () => ({ getFreshUser: vi.fn(async () => ({ id: 'admin', role: 'ADMIN' })) }))
vi.mock('@/lib/email', () => ({ emailProvider: {} }))
vi.mock('@/lib/orders/complete-order', () => ({ completeOrder: vi.fn() }))

import { saveCourse } from '@/app/(admin)/admin/actions'

const q = (n: number) => ({ prompt: `Question ${n}?`, explanation: `Because ${n}`, options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }, { text: 'C', isCorrect: true }] })
const lesson = (title: string, seconds: number, id?: string, quiz?: unknown) => ({ id, title, type: 'VIDEO' as const, durationSeconds: seconds, isFreePreview: false, videoUrl: null, fileUrl: null, quiz })

async function base() {
  const ins = await makeUser({ role: 'INSTRUCTOR' })
  return (sections: unknown[], id?: string) => ({
    id, title: 'Quiz course', slug: null, subtitle: null, shortDescription: 'A short description', description: '<p>A long description</p>',
    level: 'BEGINNER' as const, language: 'English', price: 1000, discountPrice: null, isFree: false, thumbnail: null, previewVideoUrl: null,
    status: 'DRAFT' as const, featured: false, featuredOrder: null, instructorId: ins.id, requirements: [], outcomes: [], tags: [],
    syllabusUrl: null, durationHours: null, upcomingMonth: null, eligibility: [], seoTitle: null, seoDescription: null, categoryIds: [], primaryCategoryId: null,
    sections: sections as never,
  })
}

describe('saveCourse: quiz after any video + free-form durations', () => {
  it('stores 9.55 / 9.9 / 7.45 minutes exactly and attaches the quiz to the chosen lesson only', async () => {
    const mk = await base()
    const res = await saveCourse(mk([
      { title: 'Code Overview', lessons: [lesson('V1', 573, undefined, { questions: [q(1), q(2), q(3), q(4), q(5)] }), lesson('V2', 594)] },
      { title: 'Material Models', lessons: [lesson('V3', 447)] },
    ]))
    expect(res.ok).toBe(true)
    const sections = await db.section.findMany({ orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' }, include: { quiz: { include: { questions: { include: { options: true } } } } } } } })
    expect(sections[0].lessons.map((l) => l.durationSeconds)).toEqual([573, 594])
    expect(sections[1].lessons[0].durationSeconds).toBe(447)
    const quiz = sections[0].lessons[0].quiz!
    expect(quiz.passPercent).toBe(80)
    expect(quiz.questions).toHaveLength(5)
    expect(quiz.questions[0].options.filter((o) => o.isCorrect)).toHaveLength(2)
    expect(sections[0].lessons[1].quiz).toBeNull()
    expect(sections[1].lessons[0].quiz).toBeNull()
  })

  it('untouched quiz is left alone, edits replace questions (attempts kept), null removes it', async () => {
    const mk = await base()
    const first = await saveCourse(mk([{ title: 'S1', lessons: [lesson('V1', 60, undefined, { questions: [q(1), q(2)] }), lesson('V2', 60)] }]))
    if (!first.ok) throw new Error(first.error)
    const s = await db.section.findFirstOrThrow({ include: { lessons: { orderBy: { order: 'asc' }, include: { quiz: true } } } })
    const [l1, l2] = s.lessons
    const quizId = l1.quiz!.id
    const user = await makeUser()
    await db.quizAttempt.create({ data: { userId: user.id, quizId, lessonId: l1.id, correct: 1, total: 2, scorePercent: 50, passed: false, answers: {} } })

    await saveCourse(mk([{ id: s.id, title: 'S1', lessons: [lesson('V1', 60, l1.id), lesson('V2', 90, l2.id)] }], first.id))
    expect(await db.quizQuestion.count({ where: { quizId } })).toBe(2)

    await saveCourse(mk([{ id: s.id, title: 'S1', lessons: [lesson('V1', 60, l1.id, { questions: [q(1), q(2), q(3)] }), lesson('V2', 90, l2.id)] }], first.id))
    expect((await db.quiz.findUniqueOrThrow({ where: { lessonId: l1.id } })).id).toBe(quizId)
    expect(await db.quizQuestion.count({ where: { quizId } })).toBe(3)
    expect(await db.quizAttempt.count({ where: { quizId } })).toBe(1)

    await saveCourse(mk([{ id: s.id, title: 'S1', lessons: [lesson('V1', 60, l1.id, null), lesson('V2', 90, l2.id)] }], first.id))
    expect(await db.quiz.count()).toBe(0)
  })

  it('a quiz can only follow a video lesson', async () => {
    const mk = await base()
    const doc = { title: 'D', type: 'DOCUMENT' as const, durationSeconds: 0, isFreePreview: false, videoUrl: null, fileUrl: null, quiz: { questions: [q(1)] } }
    expect((await saveCourse(mk([{ title: 'S', lessons: [doc] }]))).ok).toBe(false)
  })

  it('rejects a question with no correct option', async () => {
    const mk = await base()
    const bad = { prompt: 'Q', explanation: null, options: [{ text: 'A', isCorrect: false }, { text: 'B', isCorrect: false }] }
    expect((await saveCourse(mk([{ title: 'S', lessons: [lesson('V', 60, undefined, { questions: [bad] })] }]))).ok).toBe(false)
  })
})

describe('server lock after a lesson quiz', () => {
  it('lesson 2 stays locked for a student until lesson 1 quiz is passed; staff are never locked', async () => {
    const { getCourseGates } = await import('@/lib/progress-service')
    const mk = await base()
    const res = await saveCourse(mk([{ title: 'Code Overview', lessons: [lesson('L1', 60, undefined, { questions: [q(1), q(2)] }), lesson('L2', 60)] }]))
    if (!res.ok) throw new Error(res.error)
    const [l1, l2] = await db.lesson.findMany({ orderBy: { order: 'asc' } })
    const student = await makeUser()
    const locked = async () => (await getCourseGates({ id: student.id, role: 'STUDENT' }, res.id)).gates.find((g) => g.lessonId === l2.id)!.locked

    expect(await locked()).toBe(true) // nothing watched
    await db.lessonProgress.create({ data: { userId: student.id, lessonId: l1.id, videoCompletedAt: new Date() } })
    expect(await locked()).toBe(true) // watched, quiz not passed (e.g. 70%)
    await db.lessonProgress.update({ where: { userId_lessonId: { userId: student.id, lessonId: l1.id } }, data: { quizPassedAt: new Date() } })
    expect(await locked()).toBe(false) // passed -> lesson 2 opens
    expect((await getCourseGates({ id: 'x', role: 'ADMIN' }, res.id)).gates.every((g) => !g.locked)).toBe(true)
  })
})
