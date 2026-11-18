'use client'

import { useCallback, useEffect, useState } from 'react'

interface QuizData {
  title: string
  passPercent: number
  alreadyPassed: boolean
  lastAttempt: { scorePercent: number; passed: boolean } | null
  questions: Array<{
    id: string
    prompt: string
    multiple: boolean
    options: Array<{ id: string; text: string }>
  }>
}

interface Result {
  passed: boolean
  scorePercent: number
  correct: number
  total: number
  passPercent: number
  perQuestion: Array<{ questionId: string; correct: boolean }>
  explanations?: Record<string, string>
  nextLessonId: string | null
}

/** Quiz shown under the player once the video is completed. Needs ≥ passPercent (80) to continue (R7). */
export function QuizPanel({
  lessonId,
  onPassed,
}: {
  lessonId: string
  onPassed?: (nextLessonId: string | null) => void
}) {
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    setResult(null)
    setAnswers({})
    const res = await fetch(`/api/lessons/${lessonId}/quiz`, { cache: 'no-store' })
    const j = await res.json() as QuizData & { error?: { message?: string } }
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

  if (error)
    return (
      <p role="alert" className="rounded-lg border border-border p-4 text-sm">
        {error}
      </p>
    )
  if (!quiz)
    return <p className="p-4 text-sm text-muted-foreground">Loading quiz…</p>

  const allAnswered = quiz.questions.every((q) => (answers[q.id]?.length ?? 0) > 0)

  const pick = (qid: string, oid: string, multiple: boolean) =>
    setAnswers((a) => {
      const cur = a[qid] ?? []
      return {
        ...a,
        [qid]: multiple
          ? cur.includes(oid)
            ? cur.filter((x) => x !== oid)
            : [...cur, oid]
          : [oid],
      }
    })

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/lessons/${lessonId}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const j = await res.json() as Result & { error?: { message?: string } }
      if (!res.ok) throw new Error(j?.error?.message ?? 'Submit failed')
      setResult(j)
      if (j.passed) onPassed?.(j.nextLessonId)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const wrong = new Set(result?.perQuestion.filter((p) => !p.correct).map((p) => p.questionId))

  return (
    <section aria-labelledby="quiz-heading" className="rounded-xl border border-border bg-card p-5">
      <h2 id="quiz-heading" className="text-lg font-semibold">{quiz.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Score at least {quiz.passPercent}% to unlock the next video. You can retake the quiz as many times as you need.
      </p>

      {quiz.alreadyPassed && !result && (
        <p className="mt-3 text-sm font-medium text-success-text">✓ You have already passed this quiz.</p>
      )}

      {result && (
        <div
          role="status"
          className={`mt-4 rounded-lg border p-4 ${result.passed ? 'border-success bg-green-50' : 'border-danger bg-red-50'}`}
        >
          <p className="font-semibold">
            {result.passed ? 'Passed' : 'Not passed'} — {result.scorePercent}% ({result.correct}/{result.total})
          </p>
          {!result.passed && (
            <p className="mt-1 text-sm">
              You need {result.passPercent}% to continue. Review the video and retake the quiz.
            </p>
          )}
        </div>
      )}

      <form
        className="mt-4 space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (!result?.passed) void submit()
        }}
      >
        {quiz.questions.map((q, i) => (
          <fieldset
            key={q.id}
            className={`rounded-lg border p-4 ${result && wrong.has(q.id) ? 'border-danger' : 'border-border'}`}
          >
            <legend className="px-1 text-sm font-semibold">
              {i + 1}. {q.prompt}
            </legend>
            {q.multiple && <p className="text-xs text-muted-foreground">Select all that apply</p>}
            <div className="mt-2 space-y-2">
              {q.options.map((o) => (
                <label
                  key={o.id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-muted"
                >
                  <input
                    type={q.multiple ? 'checkbox' : 'radio'}
                    name={q.id}
                    className="h-4 w-4"
                    checked={(answers[q.id] ?? []).includes(o.id)}
                    disabled={!!result?.passed}
                    onChange={() => pick(q.id, o.id, q.multiple)}
                  />
                  <span className="text-sm">{o.text}</span>
                </label>
              ))}
            </div>
            {result?.passed && result.explanations?.[q.id] && (
              <p className="mt-2 text-sm text-muted-foreground">{result.explanations[q.id]}</p>
            )}
          </fieldset>
        ))}

        <div className="flex flex-wrap gap-3">
          {!result?.passed && (
            <button
              type="submit"
              disabled={!allAnswered || busy}
              className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? 'Checking…' : result ? 'Submit again' : 'Submit quiz'}
            </button>
          )}
          {result && !result.passed && (
            <button
              type="button"
              onClick={() => void load()}
              className="min-h-11 rounded-md border border-border px-5 text-sm font-semibold hover:bg-muted"
            >
              Retake quiz (new question order)
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
