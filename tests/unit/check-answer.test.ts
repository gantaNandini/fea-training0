import { describe, expect, it } from 'vitest'
import { checkAnswer } from '@/lib/quiz-grading'

describe('checkAnswer (used when the quiz form is graded)', () => {
  it('single answer needs an exact match', () => {
    expect(checkAnswer(['a'], ['a'])).toBe(true)
    expect(checkAnswer(['a'], ['b'])).toBe(false)
    expect(checkAnswer(['a'], [])).toBe(false)
    expect(checkAnswer(['a'], undefined)).toBe(false)
  })
  it('multiple answers need all correct options and nothing extra', () => {
    expect(checkAnswer(['a', 'c'], ['c', 'a'])).toBe(true)
    expect(checkAnswer(['a', 'c'], ['a'])).toBe(false)
    expect(checkAnswer(['a', 'c'], ['a', 'b', 'c'])).toBe(false)
  })
  it('a question with no correct option is never correct', () => {
    expect(checkAnswer([], [])).toBe(false)
  })
})
