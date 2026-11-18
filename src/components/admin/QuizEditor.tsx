'use client'

import { useEffect, useState } from 'react'

interface Q {
  prompt: string
  explanation: string
  options: Array<{ text: string; isCorrect: boolean }>
}

/**
 * Admin editor for a VIDEO lesson's quiz (T11, R7 §10).
 * Mounts inside the admin lesson/course editor for VIDEO lessons.
 * Calls PUT /api/admin/lessons/:id/quiz to save.
 * Pass mark defaults to 80; editable per quiz (50–100).
 *
 * NOTE: requires the gating schema migration (STEP 4) before the backend works.
 */
export function QuizEditor({ lessonId }: { lessonId: string }) {
  const [title, setTitle] = useState('Lesson quiz')
  const [pass, setPass] = useState(80)
  const [qs, setQs] = useState<Q[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      const r = await fetch(`/api/admin/lessons/${lessonId}/quiz`)
      const j = await r.json() as { quiz?: { title: string; passPercent: number; questions: Array<{ prompt: string; explanation: string | null; options: Array<{ text: string; isCorrect: boolean }> }> } }
      if (!j.quiz) return
      setTitle(j.quiz.title)
      setPass(j.quiz.passPercent)
      setQs(
        j.quiz.questions.map((q) => ({
          prompt: q.prompt,
          explanation: q.explanation ?? '',
          options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
        })),
      )
    })()
  }, [lessonId])

  const upd = (i: number, f: (q: Q) => Q) => setQs((a) => a.map((q, k) => (k === i ? f(q) : q)))

  async function save() {
    setBusy(true)
    setMsg(null)
    const r = await fetch(`/api/admin/lessons/${lessonId}/quiz`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, passPercent: pass, questions: qs }),
    })
    const j = await r.json() as { error?: { message?: string } }
    setMsg(r.ok ? 'Quiz saved.' : j?.error?.message ?? 'Save failed')
    setBusy(false)
  }

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <h3 className="text-base font-semibold">Lesson quiz</h3>
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm font-medium">
          Quiz title
          <input
            className="mt-1 block rounded-md border border-border px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Pass mark (%)
          <input
            type="number"
            min={50}
            max={100}
            className="mt-1 block w-24 rounded-md border border-border px-3 py-2 text-sm"
            value={pass}
            onChange={(e) => setPass(Number(e.target.value))}
          />
        </label>
      </div>

      {qs.map((q, i) => (
        <fieldset key={i} className="space-y-2 rounded-lg border border-border p-3">
          <legend className="px-1 text-sm font-semibold">Question {i + 1}</legend>
          <textarea
            aria-label={`Question ${i + 1} text`}
            className="w-full rounded-md border border-border p-2 text-sm"
            rows={2}
            value={q.prompt}
            onChange={(e) => upd(i, (x) => ({ ...x, prompt: e.target.value }))}
          />
          {q.options.map((o, k) => (
            <div key={k} className="flex items-center gap-2">
              <input
                type="checkbox"
                aria-label="Correct answer"
                className="h-4 w-4"
                checked={o.isCorrect}
                onChange={(e) =>
                  upd(i, (x) => ({
                    ...x,
                    options: x.options.map((y, z) =>
                      z === k ? { ...y, isCorrect: e.target.checked } : y,
                    ),
                  }))
                }
              />
              <input
                aria-label={`Option ${k + 1}`}
                className="flex-1 rounded-md border border-border px-2 py-1 text-sm"
                value={o.text}
                onChange={(e) =>
                  upd(i, (x) => ({
                    ...x,
                    options: x.options.map((y, z) =>
                      z === k ? { ...y, text: e.target.value } : y,
                    ),
                  }))
                }
              />
              <button
                type="button"
                className="text-sm underline"
                onClick={() =>
                  upd(i, (x) => ({ ...x, options: x.options.filter((_, z) => z !== k) }))
                }
              >
                Remove
              </button>
            </div>
          ))}
          <div className="flex gap-3 text-sm">
            <button
              type="button"
              className="underline"
              onClick={() =>
                upd(i, (x) => ({ ...x, options: [...x.options, { text: '', isCorrect: false }] }))
              }
            >
              + Option
            </button>
            <button
              type="button"
              className="underline"
              onClick={() => setQs((a) => a.filter((_, z) => z !== i))}
            >
              Delete question
            </button>
          </div>
          <input
            aria-label="Explanation (shown after passing)"
            placeholder="Explanation (shown after passing)"
            className="w-full rounded-md border border-border px-2 py-1 text-sm"
            value={q.explanation}
            onChange={(e) => upd(i, (x) => ({ ...x, explanation: e.target.value }))}
          />
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted"
          onClick={() =>
            setQs((a) => [
              ...a,
              {
                prompt: '',
                explanation: '',
                options: [
                  { text: '', isCorrect: true },
                  { text: '', isCorrect: false },
                ],
              },
            ])
          }
        >
          + Add question
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="min-h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save quiz'}
        </button>
        {msg && (
          <span role="status" className="text-sm">
            {msg}
          </span>
        )}
      </div>
    </div>
  )
}
