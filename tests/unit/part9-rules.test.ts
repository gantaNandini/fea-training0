import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { computeGates, flattenCurriculum, type CurriculumSection } from '@/lib/course-gating'
import { buildReview, gradeQuiz, unansweredQuestionIds } from '@/lib/quiz-grading'
import { coverage } from '@/lib/watch-ranges'

/** Part 9: 7 videos (quizzes on 2, 4, 5, 7) and 3 slide files, in the order students see them. */
const lessons = [
  { id: 'v1', type: 'VIDEO', hasQuiz: false },
  { id: 'v2', type: 'VIDEO', hasQuiz: true },
  { id: 'v3', type: 'VIDEO', hasQuiz: false },
  { id: 'v4', type: 'VIDEO', hasQuiz: true },
  { id: 's1', type: 'DOCUMENT', hasQuiz: false },
  { id: 'v5', type: 'VIDEO', hasQuiz: true },
  { id: 's2', type: 'DOCUMENT', hasQuiz: false },
  { id: 'v6', type: 'VIDEO', hasQuiz: false },
  { id: 'v7', type: 'VIDEO', hasQuiz: true },
  { id: 's3', type: 'DOCUMENT', hasQuiz: false },
] as const
const sections: CurriculumSection[] = [
  { order: 1, lessons: lessons.map((l, i) => ({ ...l, order: i + 1, isFreePreview: false })) },
]
const flat = flattenCurriculum(sections)
const gates = (p: Parameters<typeof computeGates>[1]) => computeGates(flat, p)
const locked = (p: Parameters<typeof computeGates>[1]) => gates(p).filter((g) => g.locked).map((g) => g.lessonId)
const watched = { videoCompleted: true, quizPassed: false }
const passed = { videoCompleted: true, quizPassed: true }

describe('Part 9 lock rules (student)', () => {
  it('fresh student: only video 1 is open, everything after it is locked', () => {
    expect(locked({})).toEqual(['v2', 'v3', 'v4', 's1', 'v5', 's2', 'v6', 'v7', 's3'])
  })
  it('video 1 (no quiz) needs only the watch', () => {
    expect(locked({ v1: watched })).not.toContain('v2')
  })
  it('video 2 has a quiz: watching is not enough, the pass unlocks video 3', () => {
    expect(locked({ v1: watched, v2: watched })).toContain('v3')
    expect(locked({ v1: watched, v2: passed })).not.toContain('v3')
  })
  it('a quiz pass without the video watched does not unlock anything', () => {
    expect(locked({ v1: watched, v2: { videoCompleted: false, quizPassed: true } })).toContain('v3')
  })
  it('video 3 (no quiz) needs only the watch', () => {
    expect(locked({ v1: watched, v2: passed, v3: watched })).not.toContain('v4')
  })
  it('slide files never hold up the next video', () => {
    // after video 4 (quiz passed) the slide s1 is open and v5 is open without "completing" s1
    const l = locked({ v1: watched, v2: passed, v3: watched, v4: passed })
    expect(l).not.toContain('s1')
    expect(l).not.toContain('v5')
  })
  it('video 7 only opens after video 6 and everything before it', () => {
    const upTo6 = { v1: watched, v2: passed, v3: watched, v4: passed, v5: passed, v6: watched }
    // v7 is open; only slide 3 (which comes after v7) is still locked
    expect(locked(upTo6)).toEqual(['s3'])
    expect(locked({ ...upTo6, v6: undefined })).toContain('v7')
  })
})

describe('90% watch rule', () => {
  it('seeking to the end does not count; 90% of seconds played does', () => {
    expect(coverage([[1190, 1200]], 1200)).toBeLessThan(0.9)
    expect(coverage([[0, 1079]], 1200)).toBeLessThan(0.9)
    expect(coverage([[0, 1080]], 1200)).toBeGreaterThanOrEqual(0.9)
  })
})

interface Item {
  lessonTitle: string
  passPercent: number
  questions: Array<{ prompt: string; options: string[]; correct: number[]; explanation?: string }>
}
const quizzes = JSON.parse(readFileSync('scripts/quizzes.part9.json', 'utf8')) as Item[]
const ids = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `q${i}`, correctOptionIds: ['right'] }))
const answersWithRight = (n: number, right: number) =>
  Object.fromEntries(Array.from({ length: n }, (_, i) => [`q${i}`, [i < right ? 'right' : 'wrong']]))

describe('Part 9 quizzes (80% pass mark)', () => {
  const expected: Array<[string, number, number]> = [
    ['Crack-Like Flaws – Part 2', 8, 7],
    ['Flaw Characterization – Part 2', 5, 4],
    ['Flaw Depth Characterization', 4, 4],
    ['Branched & Multiple Flaws – Part 2', 8, 7],
  ]
  it.each(expected)('%s: %i questions, %i needed to pass', (title, n, need) => {
    const q = quizzes.find((x) => x.lessonTitle === title)
    expect(q, title).toBeDefined()
    expect(q!.questions).toHaveLength(n)
    expect(q!.passPercent).toBe(80)
    expect(gradeQuiz(ids(n), answersWithRight(n, need), 80).passed).toBe(true)
    expect(gradeQuiz(ids(n), answersWithRight(n, need - 1), 80).passed).toBe(false)
  })
  it('every question has valid options and at least one correct answer', () => {
    for (const q of quizzes) for (const x of q.questions) {
      expect(x.options.length).toBeGreaterThanOrEqual(2)
      expect(x.correct.length).toBeGreaterThan(0)
      expect(x.correct.every((c) => c >= 0 && c < x.options.length)).toBe(true)
    }
  })
})

describe('quiz form: graded only when fully answered, then reviewed', () => {
  const qs = [
    { id: 'a', correctOptionIds: ['a1'], explanation: 'because' },
    { id: 'b', correctOptionIds: ['b2'], explanation: null },
  ]
  it('reports questions left unanswered', () => {
    expect(unansweredQuestionIds(qs, { a: ['a1'] })).toEqual(['b'])
    expect(unansweredQuestionIds(qs, { a: ['a1'], b: [] })).toEqual(['b'])
    expect(unansweredQuestionIds(qs, { a: ['a1'], b: ['b1'] })).toEqual([])
  })
  it('review shows the mistake, the student pick and the correct answer', () => {
    const r = buildReview(qs, { a: ['a1'], b: ['b1'] })
    expect(r[0]).toMatchObject({ questionId: 'a', correct: true, explanation: 'because' })
    expect(r[1]).toMatchObject({ questionId: 'b', correct: false, selectedOptionIds: ['b1'], correctOptionIds: ['b2'] })
  })
})
