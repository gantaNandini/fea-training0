/** Server-side quiz grading. Pass mark is an integer percent (default 80, MoM item 7, R7). */
export interface GradeQuestion {
  id: string
  correctOptionIds: string[]
}
export interface GradeResult {
  correct: number
  total: number
  scorePercent: number
  passed: boolean
  perQuestion: Array<{ questionId: string; correct: boolean }>
}

export function gradeQuiz(
  questions: GradeQuestion[],
  answers: Record<string, string[] | undefined>,
  passPercent = 80,
): GradeResult {
  if (questions.length === 0) throw new Error('Quiz has no questions')
  const perQuestion = questions.map((q) => {
    const given = new Set(answers[q.id] ?? [])
    const want = new Set(q.correctOptionIds)
    const correct = given.size === want.size && [...want].every((id) => given.has(id))
    return { questionId: q.id, correct }
  })
  const correct = perQuestion.filter((p) => p.correct).length
  const total = questions.length
  return {
    correct,
    total,
    scorePercent: Math.floor((correct * 100) / total),
    // Integer compare: 4/5 = 80 % passes; 79.x % never rounds up into a pass
    passed: correct * 100 >= total * passPercent,
    perQuestion,
  }
}
