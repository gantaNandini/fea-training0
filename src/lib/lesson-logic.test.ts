import { describe, it, expect } from 'vitest'
import { computeGates, flattenCurriculum, summarise, nextLessonId, type CurriculumSection } from './course-gating'
import { gradeQuiz } from './quiz-grading'
import { coverage, mergeRanges, normalizeRanges } from './watch-ranges'

const sections: CurriculumSection[] = [
  { order: 2, lessons: [{ id: 'v3', order: 1, type: 'VIDEO', isFreePreview: false, hasQuiz: true }] },
  {
    order: 1,
    lessons: [
      { id: 'v2', order: 2, type: 'VIDEO', isFreePreview: false, hasQuiz: true },
      { id: 'v1', order: 1, type: 'VIDEO', isFreePreview: false, hasQuiz: true },
      { id: 'd1', order: 3, type: 'DOCUMENT', isFreePreview: false, hasQuiz: false },
    ],
  },
]
const flat = flattenCurriculum(sections)
const st = (p: Parameters<typeof computeGates>[1]) =>
  Object.fromEntries(computeGates(flat, p).map((g) => [g.lessonId, g.state]))

describe('course-gating', () => {
  it('curriculum is walked in section/lesson order', () => {
    expect(flat.map((l) => l.id)).toEqual(['v1', 'v2', 'd1', 'v3'])
  })

  it('fresh student: only the first video is open', () => {
    expect(st({})).toEqual({ v1: 'available', v2: 'locked', d1: 'locked', v3: 'locked' })
  })

  it('watching alone does not unlock the next video; quiz pass does', () => {
    expect(st({ v1: { videoCompleted: true, quizPassed: false } }).v2).toBe('locked')
    expect(st({ v1: { videoCompleted: true, quizPassed: false } }).v1).toBe('video_done')
    const s = st({ v1: { videoCompleted: true, quizPassed: true } })
    expect([s.v1, s.v2]).toEqual(['completed', 'available'])
  })

  it('quiz pass without the video watched never completes', () => {
    expect(st({ v1: { videoCompleted: false, quizPassed: true } }).v2).toBe('locked')
  })

  it('documents never block', () => {
    const s = st({
      v1: { videoCompleted: true, quizPassed: true },
      v2: { videoCompleted: true, quizPassed: true },
    })
    expect([s.d1, s.v3]).toEqual(['available', 'available'])
  })

  it('video without a quiz completes on watch (no dead-lock)', () => {
    const lessons = [
      { id: 'a', type: 'VIDEO', isFreePreview: false, hasQuiz: false },
      { id: 'b', type: 'VIDEO', isFreePreview: false, hasQuiz: true },
    ]
    const g = computeGates(lessons, { a: { videoCompleted: true, quizPassed: false } })
    expect(g.map((x) => x.state)).toEqual(['completed', 'available'])
  })

  it('free-preview lessons are never locked', () => {
    const lessons = [
      { id: 'a', type: 'VIDEO', isFreePreview: false, hasQuiz: true },
      { id: 'b', type: 'VIDEO', isFreePreview: true, hasQuiz: true },
    ]
    expect(computeGates(lessons, {})[1].state).toBe('available')
  })

  it('summary + next lesson', () => {
    const g = computeGates(flat, { v1: { videoCompleted: true, quizPassed: true } })
    expect(summarise(g)).toEqual({ totalVideos: 3, completedVideos: 1, percent: 33 })
    expect(nextLessonId(flat, 'v1')).toBe('v2')
    expect(nextLessonId(flat, 'v3')).toBeNull()
  })
})

const qs = [1, 2, 3, 4, 5].map((n) => ({ id: `q${n}`, correctOptionIds: [`o${n}`] }))

describe('quiz-grading', () => {
  it('80% pass mark: 4/5 passes, 3/5 fails', () => {
    const four = gradeQuiz(qs, { q1: ['o1'], q2: ['o2'], q3: ['o3'], q4: ['o4'], q5: ['x'] })
    expect(four.scorePercent).toBe(80)
    expect(four.passed).toBe(true)
    const three = gradeQuiz(qs, { q1: ['o1'], q2: ['o2'], q3: ['o3'] })
    expect(three.passed).toBe(false)
  })

  it('79.x% never rounds into a pass (e.g. 19/24 = 79.17%)', () => {
    const big = Array.from({ length: 24 }, (_, i) => ({ id: `q${i}`, correctOptionIds: ['a'] }))
    const ans = Object.fromEntries(big.slice(0, 19).map((q) => [q.id, ['a']]))
    expect(gradeQuiz(big, ans).passed).toBe(false)
  })

  it('multi-select needs the exact set; unanswered is wrong', () => {
    const q = [{ id: 'm', correctOptionIds: ['a', 'b'] }]
    expect(gradeQuiz(q, { m: ['a'] }).passed).toBe(false)
    expect(gradeQuiz(q, { m: ['a', 'b', 'c'] }).passed).toBe(false)
    expect(gradeQuiz(q, { m: ['b', 'a'] }).passed).toBe(true)
    expect(gradeQuiz(q, {}).passed).toBe(false)
  })

  it('custom pass mark is honoured', () => {
    expect(gradeQuiz(qs, { q1: ['o1'], q2: ['o2'], q3: ['o3'] }, 60).passed).toBe(true)
  })
})

describe('watch-ranges', () => {
  it('merges overlapping ranges', () => {
    expect(mergeRanges([[0, 10]], [[10, 20], [30, 40]])).toEqual([[0, 20], [30, 40]])
  })

  it('normalizes and clamps ranges', () => {
    const r = normalizeRanges([[0, 50], [40, 95], [-5, 3], ['x', 2], [90, 9999]], 100)
    expect(r).toEqual([[0, 100]])
  })

  it('coverage threshold: <90 fails, >=90 passes', () => {
    expect(coverage([[0, 89]], 100) < 0.9).toBe(true)
    expect(coverage([[0, 90]], 100) >= 0.9).toBe(true)
  })
})
