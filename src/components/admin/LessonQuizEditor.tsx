'use client'

import { ArrowDown, ArrowUp, ClipboardCheck, Plus, Trash2, X } from 'lucide-react'
import { AInput, ATextarea, btn } from './ui'
import { PASS_PERCENT_DEFAULT } from '@/lib/course-gating'

export interface QuizQuestionState {
  prompt: string
  explanation: string
  options: Array<{ text: string; isCorrect: boolean }>
}

export const newQuizQuestion = (): QuizQuestionState => ({
  prompt: '',
  explanation: '',
  options: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
})

/** Whole questions a student must get right: correct × 100 ≥ total × 80 (same integer rule the server uses). */
export const neededToPass = (total: number) => Math.ceil((total * PASS_PERCENT_DEFAULT) / 100)

/** First problem in the quiz, as a sentence for the admin; null when it is fine. */
export function quizProblem(qs: QuizQuestionState[]): string | null {
  for (const [i, q] of qs.entries()) {
    if (!q.prompt.trim()) return `question ${i + 1} has no text`
    const filled = q.options.filter((o) => o.text.trim())
    if (filled.length < 2) return `question ${i + 1} needs at least 2 options`
    if (q.options.some((o) => o.isCorrect && !o.text.trim())) return `question ${i + 1}: a correct option is empty`
    if (!filled.some((o) => o.isCorrect)) return `question ${i + 1} needs a correct answer ticked`
  }
  return null
}

function move<T>(arr: T[], i: number, d: -1 | 1): T[] {
  const j = i + d
  if (j < 0 || j >= arr.length) return arr
  const out = [...arr]
  ;[out[i], out[j]] = [out[j], out[i]]
  return out
}

/**
 * Quiz a student takes right after this video. Until it is passed (80 %) the next lesson stays locked.
 * Saved with the course ("Save changes"). The 80 % pass mark is fixed on purpose: there is no field for it.
 */
export function LessonQuizEditor({
  label,
  questions,
  onChange,
}: {
  label: string
  questions: QuizQuestionState[]
  onChange: (next: QuizQuestionState[]) => void
}) {
  const setQ = (i: number, fn: (q: QuizQuestionState) => QuizQuestionState) => onChange(questions.map((q, k) => (k === i ? fn(q) : q)))
  const total = questions.length

  return (
    <div className="mt-3 rounded-md border border-teal-200 bg-teal-50/40 p-3" data-testid="lesson-quiz">
      <div className="flex flex-wrap items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-teal-700" aria-hidden="true" />
        <span className="text-sm font-bold">Quiz after {label}</span>
        <span className="text-xs text-slate-600">
          {total === 0
            ? 'No quiz. Add questions and students must pass it (80%) before the next video opens.'
            : `${total} question${total === 1 ? '' : 's'} · pass mark 80% fixed · students need ${neededToPass(total)} of ${total} correct to unlock the next video`}
        </span>
      </div>

      {questions.map((q, i) => (
        <fieldset key={i} className="mt-3 space-y-2 rounded-md border border-slate-200 bg-white p-3">
          <legend className="px-1 text-xs font-bold text-slate-600">Question {i + 1}</legend>
          <div className="flex items-start gap-2">
            <ATextarea aria-label={`${label} question ${i + 1} text`} rows={2} className="flex-1" placeholder="Type the question" value={q.prompt} onChange={(e) => setQ(i, (x) => ({ ...x, prompt: e.target.value }))} />
            <button type="button" aria-label="Move question up" className={btn('outline', 'sm')} onClick={() => onChange(move(questions, i, -1))}><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" aria-label="Move question down" className={btn('outline', 'sm')} onClick={() => onChange(move(questions, i, 1))}><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" aria-label="Delete question" className={btn('danger', 'sm')} onClick={() => onChange(questions.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
          </div>
          <p className="text-xs text-slate-500">Tick every correct answer (one or more).</p>
          {q.options.map((o, k) => (
            <div key={k} className="flex items-center gap-2">
              <input type="checkbox" aria-label={`Option ${k + 1} is correct`} className="h-4 w-4" checked={o.isCorrect} onChange={(e) => setQ(i, (x) => ({ ...x, options: x.options.map((y, z) => (z === k ? { ...y, isCorrect: e.target.checked } : y)) }))} />
              <AInput aria-label={`${label} question ${i + 1} option ${k + 1}`} className="flex-1" placeholder={`Option ${k + 1}`} value={o.text} onChange={(e) => setQ(i, (x) => ({ ...x, options: x.options.map((y, z) => (z === k ? { ...y, text: e.target.value } : y)) }))} />
              {q.options.length > 2 ? <button type="button" aria-label={`Remove option ${k + 1}`} className={btn('outline', 'sm')} onClick={() => setQ(i, (x) => ({ ...x, options: x.options.filter((_, z) => z !== k) }))}><X className="h-4 w-4" aria-hidden="true" /></button> : null}
            </div>
          ))}
          {q.options.length < 6 ? <button type="button" className="text-xs font-semibold underline" onClick={() => setQ(i, (x) => ({ ...x, options: [...x.options, { text: '', isCorrect: false }] }))}>+ Add option</button> : null}
          <ATextarea aria-label={`${label} question ${i + 1} explanation`} rows={2} placeholder="Explanation (shown to the student after the quiz)" value={q.explanation} onChange={(e) => setQ(i, (x) => ({ ...x, explanation: e.target.value }))} />
        </fieldset>
      ))}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={btn('info', 'sm')} onClick={() => onChange([...questions, newQuizQuestion()])}><Plus className="h-4 w-4" aria-hidden="true" /> Add question</button>
        {total > 0 ? <button type="button" className={btn('outline', 'sm')} onClick={() => { if (window.confirm('Remove the whole quiz for this section?')) onChange([]) }}>Remove quiz</button> : null}
      </div>
    </div>
  )
}
