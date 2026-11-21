'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * KBC-style quiz: ONE question per screen → pick → "Lock answer" → "Final answer?" → Confirm →
 * right/wrong shown → Next. No going back. After the last question the whole attempt is graded
 * by the server (pass mark 80%); a failed attempt can be retaken with a fresh order.
 * Drop-in replacement for QuizPanel: same props.
 */
interface QuizData {
  title: string
  passPercent: number
  alreadyPassed: boolean
  lastAttempt: { scorePercent: number; passed: boolean } | null
  questions: Array<{ id: string; prompt: string; multiple: boolean; options: Array<{ id: string; text: string }> }>
}
interface Result {
  passed: boolean
  scorePercent: number
  correct: number
  total: number
  passPercent: number
  explanations?: Record<string, string>
  nextLessonId: string | null
}
type Phase = 'intro' | 'question' | 'result'
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export function KbcQuizPanel({
  lessonId,
  onPassed,
}: {
  lessonId: string
  onPassed?: (nextLessonId: string | null) => void
}) {
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [phase, setPhase] = useState<Phase>('intro')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)
  const [feedback, setFeedback] = useState<null | boolean>(null)
  const [locked, setLocked] = useState<Record<string, string[]>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [liveScore, setLiveScore] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const load = useCallback(async () => {
    setError(null)
    setResult(null)
    setLocked({})
    setIndex(0)
    setSelected([])
    setConfirming(false)
    setFeedback(null)
    setLiveScore(0)
    setPhase('intro')
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
    headingRef.current?.focus()
  }, [index, phase])

  const q = quiz?.questions[index]
  const total = quiz?.questions.length ?? 0
  const isLast = index === total - 1

  const toggle = useCallback(
    (oid: string) => {
      if (!q || feedback !== null || busy) return
      setConfirming(false)
      setSelected((cur) =>
        q.multiple ? (cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid]) : [oid],
      )
    },
    [q, feedback, busy],
  )

  // keyboard: pressing A–F picks that option
  useEffect(() => {
    if (phase !== 'question' || !q) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const i = LETTERS.indexOf(e.key.toUpperCase())
      if (e.key.length === 1 && i >= 0 && i < q.options.length) {
        e.preventDefault()
        toggle(q.options[i].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, q, toggle])

  async function confirmLock() {
    if (!q || selected.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/lessons/${lessonId}/quiz/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, optionIds: selected }),
      })
      const j = (await res.json().catch(() => null)) as { correct?: boolean; error?: { message?: string } }
      if (!res.ok) throw new Error(j?.error?.message ?? 'Could not check the answer. Please try again.')
      setLocked((l) => ({ ...l, [q.id]: selected }))
      setFeedback(!!j.correct)
      if (j.correct) setLiveScore((s) => s + 1)
      setConfirming(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function next() {
    if (!quiz) return
    if (!isLast) {
      setIndex((i) => i + 1)
      setSelected([])
      setFeedback(null)
      setConfirming(false)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/lessons/${lessonId}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: locked }),
      })
      const j = (await res.json().catch(() => null)) as Result & { error?: { message?: string } }
      if (!res.ok) throw new Error(j?.error?.message ?? 'Submit failed. Please try again.')
      setResult(j)
      setPhase('result')
      if (j.passed) onPassed?.(j.nextLessonId)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!quiz) {
    return error
      ? <p role="alert" className="rounded-lg border border-border p-4 text-sm">{error}</p>
      : <p className="p-4 text-sm text-muted-foreground">Loading quiz…</p>
  }

  return (
    <section aria-labelledby="quiz-h" className="rounded-xl border border-border bg-card p-5 md:p-8" data-testid="kbc-quiz">
      {phase === 'intro' && (
        <div>
          <h2 id="quiz-h" ref={headingRef} tabIndex={-1} className="text-xl font-semibold">{quiz.title}</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>{total} questions, one at a time.</li>
            <li>Pick an option, then lock it in. Once locked you cannot change it.</li>
            <li>You need <strong>{quiz.passPercent}%</strong> to unlock the next video. If you miss it, you can retake the quiz.</li>
          </ul>
          {quiz.alreadyPassed && <p className="mt-3 text-sm font-medium text-success-text">✓ You have already passed this quiz.</p>}
          {quiz.lastAttempt && !quiz.alreadyPassed && (
            <p className="mt-3 text-sm">Last attempt: {quiz.lastAttempt.scorePercent}% — {quiz.lastAttempt.passed ? 'passed' : 'not passed'}.</p>
          )}
          {total === 0
            ? <p className="mt-4 text-sm">This quiz has no questions yet.</p>
            : <button type="button" data-testid="kbc-start" onClick={() => setPhase('question')}
                className="mt-5 min-h-11 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground">
                {quiz.alreadyPassed ? 'Take it again' : 'Start quiz'}
              </button>}
        </div>
      )}

      {phase === 'question' && q && (
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold" data-testid="kbc-counter">Question {index + 1} of {total}</span>
            <span className="text-muted-foreground">Correct so far: {liveScore}</span>
          </div>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + (feedback !== null ? 1 : 0)}
               aria-label="Quiz progress" className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${((index + (feedback !== null ? 1 : 0)) / total) * 100}%` }} />
          </div>

          <h2 id="quiz-h" ref={headingRef} tabIndex={-1} className="mt-6 text-lg font-semibold leading-snug md:text-xl">{q.prompt}</h2>
          {q.multiple && <p className="mt-1 text-xs text-muted-foreground">Select all that apply</p>}

          <div className="mt-5 grid gap-3 md:grid-cols-2" role={q.multiple ? 'group' : 'radiogroup'} aria-labelledby="quiz-h">
            {q.options.map((o, i) => {
              const on = selected.includes(o.id)
              const done = feedback !== null
              const tone = !done
                ? on ? 'border-primary bg-muted ring-2 ring-primary' : 'border-border bg-card hover:bg-muted'
                : on
                  ? feedback ? 'border-green-700 bg-green-50 ring-2 ring-green-700' : 'border-red-700 bg-red-50 ring-2 ring-red-700'
                  : 'border-border bg-card opacity-60'
              return (
                <button key={o.id} type="button" data-testid={`kbc-option-${i}`}
                  role={q.multiple ? 'checkbox' : 'radio'} aria-checked={on} disabled={done || busy}
                  onClick={() => toggle(o.id)}
                  className={`flex min-h-14 items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${tone}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-xs font-bold">{LETTERS[i]}</span>
                  <span>{o.text}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-6 min-h-12" aria-live="polite">
            {feedback === true && <p data-testid="kbc-feedback" className="font-semibold text-success-text">✓ Correct!</p>}
            {feedback === false && <p data-testid="kbc-feedback" className="font-semibold text-danger-text">✗ Not correct. Move on to the next question.</p>}
            {error && <p role="alert" className="text-sm text-danger-text">{error}</p>}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {feedback === null && !confirming && (
              <button type="button" data-testid="kbc-lock" disabled={selected.length === 0 || busy} onClick={() => setConfirming(true)}
                className="min-h-11 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                Lock answer
              </button>
            )}
            {feedback === null && confirming && (
              <>
                <span className="text-sm font-semibold">Final answer?</span>
                <button type="button" data-testid="kbc-confirm" disabled={busy} onClick={() => void confirmLock()}
                  className="min-h-11 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  {busy ? 'Checking…' : 'Yes, lock it'}
                </button>
                <button type="button" disabled={busy} onClick={() => setConfirming(false)}
                  className="min-h-11 rounded-md border border-border px-5 text-sm font-semibold hover:bg-muted">Change</button>
              </>
            )}
            {feedback !== null && (
              <button type="button" data-testid="kbc-next" disabled={busy} onClick={() => void next()}
                className="min-h-11 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {busy ? 'Submitting…' : isLast ? 'Finish quiz' : 'Next question'}
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'result' && result && (
        <div role="status" data-testid="kbc-result">
          <h2 id="quiz-h" ref={headingRef} tabIndex={-1} className="text-xl font-semibold">
            {result.passed ? 'You passed!' : 'Not passed yet'}
          </h2>
          <p className={`mt-2 text-3xl font-bold ${result.passed ? 'text-success-text' : 'text-danger-text'}`}>
            {result.scorePercent}% <span className="text-base font-medium text-muted-foreground">({result.correct} of {result.total} correct)</span>
          </p>
          {result.passed
            ? <p className="mt-2 text-sm">The next video is now unlocked.</p>
            : <p className="mt-2 text-sm">You need {result.passPercent}% to continue. Rewatch the video if you need to, then retake the quiz.</p>}
          {result.passed && result.explanations && Object.keys(result.explanations).length > 0 && (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              {quiz.questions.filter((x) => result.explanations?.[x.id]).map((x) => (
                <li key={x.id}><span className="font-medium text-foreground">{x.prompt}</span> — {result.explanations?.[x.id]}</li>
              ))}
            </ol>
          )}
          {!result.passed && (
            <button type="button" data-testid="kbc-retake" onClick={() => void load()}
              className="mt-5 min-h-11 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground">
              Retake quiz (new question order)
            </button>
          )}
        </div>
      )}
    </section>
  )
}
