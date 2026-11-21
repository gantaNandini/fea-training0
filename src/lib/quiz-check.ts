/**
 * One-question-at-a-time check for the KBC-style quiz player.
 * Returns ONLY { correct: boolean } — never which option is right — so a wrong answer
 * can't be used to harvest the key. The final grade/unlock still comes from submitQuiz().
 */
import { db } from '@/lib/db'
import { ApiError } from '@/lib/api/http'
import { isStaff, assertLessonAccess, type SessionUser } from '@/lib/progress-service'
import { checkAnswer } from '@/lib/quiz-grading'

export async function checkQuizQuestion(
  user: SessionUser,
  lessonId: string,
  questionId: string,
  optionIds: string[],
): Promise<{ correct: boolean }> {
  await assertLessonAccess(user, lessonId)
  const question = await db.quizQuestion.findFirst({
    where: { id: questionId, quiz: { lessonId } },
    include: { options: true },
  })
  if (!question) throw new ApiError(404, 'NOT_FOUND', 'Question not found')
  const progress = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  })
  if (!isStaff(user) && !progress?.videoCompletedAt) {
    throw new ApiError(403, 'VIDEO_NOT_COMPLETED', 'Finish watching the video first')
  }
  return { correct: checkAnswer(question.options.filter((o) => o.isCorrect).map((o) => o.id), optionIds) }
}
