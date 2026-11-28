import { describe, expect, it } from 'vitest'
import { neededToPass, quizProblem, newQuizQuestion } from '@/components/admin/LessonQuizEditor'
import { courseInput } from '@/lib/admin/course-schema'
import { computeGates } from '@/lib/course-gating'

describe('lesson quiz: 80% rule', () => {
  it.each([[8, 7], [5, 4], [4, 4], [10, 8], [1, 1]])('%i questions need %i correct', (total, need) => {
    expect(neededToPass(total)).toBe(need)
  })
})

describe('lesson quiz validation (admin)', () => {
  const ok = { prompt: 'Q?', explanation: '', options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }] }
  it('accepts a complete question', () => expect(quizProblem([ok])).toBeNull())
  it('rejects a blank question', () => expect(quizProblem([newQuizQuestion()])).toMatch(/question 1 has no text/))
  it('needs a correct answer', () => expect(quizProblem([{ ...ok, options: [{ text: 'A', isCorrect: false }, { text: 'B', isCorrect: false }] }])).toMatch(/correct/))
  it('needs two filled options', () => expect(quizProblem([{ ...ok, options: [{ text: 'A', isCorrect: true }, { text: '', isCorrect: false }] }])).toMatch(/at least 2/))
})

describe('lesson duration is not constrained', () => {
  const base = { title: 'L', type: 'VIDEO' as const, isFreePreview: false, videoUrl: null, fileUrl: null }
  const seconds = (m: string) => Math.round(Number(m) * 60)
  it.each(['9.55', '9.9', '7.45', '0.1', '12.333'])('%s minutes is accepted and round-trips', (m) => {
    const sec = seconds(m)
    const parsed = courseInput.shape.sections.element.shape.lessons.element.safeParse({ ...base, durationSeconds: sec })
    expect(parsed.success).toBe(true)
    expect(Math.round((sec / 60) * 100) / 100).toBeCloseTo(Number(m), 2)
  })
})

describe('a quiz after lesson 1 locks lesson 2 until 80% is reached', () => {
  // Code Overview: lesson 1 (quiz), lesson 2; then Material Models
  const lessons = [
    { id: 'l1', type: 'VIDEO', isFreePreview: false, hasQuiz: true },
    { id: 'l2', type: 'VIDEO', isFreePreview: false, hasQuiz: false },
    { id: 'm1', type: 'VIDEO', isFreePreview: false, hasQuiz: false },
  ]
  it('watched but quiz not passed (e.g. 70%): lesson 2 and later stay locked', () => {
    const g = computeGates(lessons, { l1: { videoCompleted: true, quizPassed: false } })
    expect(g[0].locked).toBe(false)
    expect(g[1].locked).toBe(true)
    expect(g[2].locked).toBe(true)
  })
  it('quiz passed: lesson 2 opens', () => {
    const g = computeGates(lessons, { l1: { videoCompleted: true, quizPassed: true } })
    expect(g[1].locked).toBe(false)
  })
})
