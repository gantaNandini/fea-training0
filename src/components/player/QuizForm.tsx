'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/**
 * Quiz as a form: every question on one page, the student answers all of them and presses Submit.
 * Nothing is marked until Submit. The server then returns the score, which answers were wrong and
 * the correct answers. 80% or more passes and unlocks the next video; below that the quiz can be retaken.
 */
interface QuizData {
  title: string
  passPercent: number
  alreadyPassed: boolean
  lastAttempt: { scorePercent: number; passed: boolean } | null
  questions: Array<{ id: string; prompt: string; multiple: boolean; options: Array<{ id: string; text: string }> }>
}
interface ReviewItem {
  questionId: string
  correct: boolean
  selectedOptionIds: string[]
  correctOptionIds: string[]
  explanation: string | null
}
interface Result {
  passed: boolean
  scorePercent: number
  correct: number
  total: number
  passPercent: number
  review: ReviewItem[]
  nextLessonId: string | null
}
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export function QuizForm({ lessonId, courseSlug }: { lessonId: string; courseSlug: string }) {
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const resultRef = useRef<HTMLHeadingElement>(null)

  const load = useCallback(async () => {
    setError(null)
    setResult(null)
    setAnswers({})
    const res = await fetch(`/api/lessons/${lessonId}/quiz`, { cache: 'no-store' })
    const j = (await res.json().catch(() => null)) as QuizData & { error?: { message?: string } }
    if (!res.ok) {
      setQuiz(null)
      setError(j?.error?.message ?? 'Could not load the quiz')
      return
    }
    setQuiz(j)
  }, [lessonId])

  useEffect(() => {
    void load()
  }, [load])
  useEffect(() => {
    if (result) {
      resultRef.current?.focus()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [result])

  if (!quiz) {
    return error ? (
      <p role="alert" className="rounded-lg border border-border p-4 text-sm">
        {error}
      </p>
    ) : (
      <p className="p-4 text-sm text-muted-foreground">Loading quiz…</p>
    )
  }

  const total = quiz.questions.length
  const answered = quiz.questions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length
  const allAnswered = total > 0 && answered === total

  function pick(qid: string, oid: string, multiple: boolean) {
    setAnswers((cur) => {
      const had = cur[qid] ?? []
      const next = multiple ? (had.includes(oid) ? had.filter((x) => x !== oid) : [...had, oid]) : [oid]
      return { ...cur, [qid]: next }
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!allAnswered || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/lessons/${lessonId}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const j = (await res.json().catch(() => null)) as Result & { error?: { message?: string } }
      if (!res.ok) throw new Error(j?.error?.message ?? 'Submit failed. Please try again.')
      setResult(j)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  // ── Result: score, mistakes and correct answers ──
  if (result) {
    const byId = new Map(result.review.map((r) => [r.questionId, r]))
    const wrong = result.review.filter((r) => !r.correct).length
    return (
      <section data-testid="quiz-result" aria-live="polite" className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-5 md:p-8">
          <h2 ref={resultRef} tabIndex={-1} className="text-xl font-semibold">
            {result.passed ? 'You passed!' : 'Not passed yet'}
          </h2>
          <p className={`mt-2 text-3xl font-bold ${result.passed ? 'text-success-text' : 'text-danger-text'}`}>
            {result.scorePercent}%{' '}
            <span className="text-base font-medium text-muted-foreground">
              ({result.correct} of {result.total} correct)
            </span>
          </p>
          <p className="mt-2 text-sm">
            {result.passed
              ? 'The next video is now unlocked.'
              : `You need ${result.passPercent}% to continue. Check the mistakes below, rewatch the video if you need to, then retake the quiz.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {result.passed ? (
              <Link
                href={result.nextLessonId ? `/learn/${courseSlug}/${result.nextLessonId}` : `/courses/${courseSlug}`}
                data-testid="quiz-continue"
                className="inline-flex min-h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground"
              >
                {result.nextLessonId ? 'Continue to next video' : 'Back to course'}
              </Link>
            ) : (
              <button
                type="button"
                data-testid="quiz-retake"
                onClick={() => void load()}
                className="min-h-11 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground"
              >
                Retake quiz
              </button>
            )}
            <Link
              href={`/learn/${courseSlug}/${lessonId}`}
              className="inline-flex min-h-11 items-center rounded-md border border-border px-5 text-sm font-semibold hover:bg-muted"
            >
              Back to video
            </Link>
          </div>
        </div>

        <h3 className="text-lg font-semibold">
          Review {wrong > 0 ? `· ${wrong} mistake${wrong === 1 ? '' : 's'}` : '· no mistakes'}
        </h3>
        <ol className="space-y-4">
          {quiz.questions.map((q, qi) => {
            const r = byId.get(q.id)
            if (!r) return null
            return (
              <li
                key={q.id}
                data-testid="review-item"
                data-correct={r.correct}
                className={`rounded-xl border p-4 md:p-5 ${r.correct ? 'border-green-700/50 bg-green-50/40' : 'border-red-700/50 bg-red-50/40'}`}
              >
                <p className="font-semibold">
                  {qi + 1}. {q.prompt}
                </p>
                <p className={`mt-1 text-sm font-semibold ${r.correct ? 'text-success-text' : 'text-danger-text'}`}>
                  {r.correct ? '✓ Correct' : '✗ Wrong'}
                </p>
                <ul className="mt-3 space-y-2">
                  {q.options.map((o, oi) => {
                    const isRight = r.correctOptionIds.includes(o.id)
                    const isMine = r.selectedOptionIds.includes(o.id)
                    const tone = isRight
                      ? 'border-green-700 bg-green-50'
                      : isMine
                        ? 'border-red-700 bg-red-50'
                        : 'border-border bg-card opacity-70'
                    return (
                      <li key={o.id} className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${tone}`}>
                        <span className="font-bold">{LETTERS[oi]}</span>
                        <span className="flex-1">{o.text}</span>
                        {isRight && <span className="shrink-0 font-semibold text-success-text">Correct answer</span>}
                        {isMine && !isRight && <span className="shrink-0 font-semibold text-danger-text">Your answer</span>}
                        {isMine && isRight && <span className="shrink-0 text-xs text-muted-foreground">(your answer)</span>}
                      </li>
                    )
                  })}
                </ul>
                {r.explanation && <p className="mt-3 text-sm text-muted-foreground">{r.explanation}</p>}
              </li>
            )
          })}
        </ol>
      </section>
    )
  }

  // ── The form ──
  return (
    <form onSubmit={submit} data-testid="quiz-form" className="space-y-6" noValidate>
      <div className="rounded-xl border border-border bg-card p-5 md:p-6">
        <h2 className="text-xl font-semibold">{quiz.title}</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>{total} questions. Answer all of them, then press Submit.</li>
          <li>You see your score, your mistakes and the correct answers after you submit.</li>
          <li>
            You need <strong>{quiz.passPercent}%</strong> to unlock the next video. If you miss it, you can retake the quiz.
          </li>
        </ul>
        {quiz.alreadyPassed && <p className="mt-3 text-sm font-medium text-success-text">✓ You have already passed this quiz.</p>}
        {quiz.lastAttempt && !quiz.alreadyPassed && (
          <p className="mt-3 text-sm">
            Last attempt: {quiz.lastAttempt.scorePercent}% — {quiz.lastAttempt.passed ? 'passed' : 'not passed'}.
          </p>
        )}
        {total === 0 && <p className="mt-4 text-sm">This quiz has no questions yet.</p>}
      </div>

      {quiz.questions.map((q, qi) => (
        <fieldset key={q.id} data-testid="quiz-question" className="rounded-xl border border-border bg-card p-4 md:p-5">
          <legend className="px-1 text-base font-semibold leading-snug">
            {qi + 1}. {q.prompt}
          </legend>
          {q.multiple && <p className="mt-1 text-xs text-muted-foreground">Select all that apply</p>}
          <div className="mt-3 space-y-2">
            {q.options.map((o, oi) => {
              const on = (answers[q.id] ?? []).includes(o.id)
              return (
                <label
                  key={o.id}
                  className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
                    on ? 'border-primary bg-muted ring-2 ring-primary' : 'border-border hover:bg-muted'
                  }`}
                >
                  <input
                    type={q.multiple ? 'checkbox' : 'radio'}
                    name={q.id}
                    checked={on}
                    onChange={() => pick(q.id, o.id, q.multiple)}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="font-bold">{LETTERS[oi]}</span>
                  <span className="flex-1">{o.text}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
      ))}

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {answered} of {total} answered
        </span>
        <div className="flex items-center gap-3">
          {error && (
            <span role="alert" className="text-sm text-danger-text">
              {error}
            </span>
          )}
          <button
            type="submit"
            data-testid="quiz-submit"
            disabled={!allAnswered || busy}
            className="min-h-11 rounded-md bg-primary px-8 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </form>
  )
}
