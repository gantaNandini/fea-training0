'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Mail, Pencil, Trash2 } from 'lucide-react'
import { AInput, ATextarea, FieldRow, btn } from './ui'
import { deleteMessage, sendMessage, setMessageRead } from '@/app/(admin)/admin/actions'

export interface Msg { id: string; name: string; email: string; subject: string; message: string; read: boolean; date: string }

export function MessageInbox({ messages }: { messages: Msg[] }) {
  const router = useRouter()
  const [sel, setSel] = React.useState<string | 'new' | null>(null)
  const [pending, start] = React.useTransition()
  const [draft, setDraft] = React.useState({ to: '', subject: '', body: '' })
  const current = messages.find((m) => m.id === sel)

  function open(m: Msg) {
    setSel(m.id)
    setDraft({ to: m.email, subject: `Re: ${m.subject}`, body: '' })
    if (!m.read) start(async () => { await setMessageRead(m.id, true); router.refresh() })
  }
  function send(e: React.FormEvent) {
    e.preventDefault()
    start(async () => {
      const res = await sendMessage(draft.to, draft.subject, draft.body)
      if (res.ok) { toast.success(res.message ?? 'Sent.'); setDraft({ ...draft, body: '' }) } else toast.error(res.error)
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <div>
        <button type="button" className={`${btn('primary')} w-full !bg-emerald-500 hover:!bg-emerald-600`} onClick={() => { setSel('new'); setDraft({ to: '', subject: '', body: '' }) }}>
          New message <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
        <ul className="mt-4 space-y-2" aria-label="Messages">
          {messages.length === 0 ? <li className="text-sm text-slate-500">No messages yet.</li> : messages.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => open(m)} aria-current={sel === m.id} className={`block min-h-11 w-full rounded-md px-3 py-2 text-left text-sm shadow-sm hover:bg-slate-200 ${sel === m.id ? 'bg-adm-accent-soft' : 'bg-slate-100'}`}>
                <span className={`block truncate ${m.read ? 'text-slate-700' : 'font-bold text-slate-900'}`}>{m.name}</span>
                <span className="block truncate text-xs text-slate-500">{m.subject}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-h-64 rounded-md">
        {sel === null ? (
          <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 text-slate-500"><Mail className="h-14 w-14 text-adm-accent/70" aria-hidden="true" /><p>Choose an option from the left side</p></div>
        ) : (
          <div>
            {current ? (
              <article className="mb-6 rounded-md border border-slate-200 p-5">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div><h3 className="font-display text-lg font-bold text-slate-800">{current.subject}</h3><p className="text-sm text-slate-500">{current.name} · {current.email} · {current.date}</p></div>
                  <button type="button" aria-label="Delete message" className={btn('danger', 'sm')} onClick={() => { if (window.confirm('Delete this message?')) start(async () => { const r = await deleteMessage(current.id); if (r.ok) { setSel(null); router.refresh() } else toast.error(r.error) }) }}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{current.message}</p>
              </article>
            ) : null}
            <form onSubmit={send}>
              <h3 className="mb-3 font-semibold text-slate-800">{current ? 'Reply' : 'New message'}</h3>
              <FieldRow label="To" htmlFor="m-to" required><AInput id="m-to" type="email" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} required /></FieldRow>
              <FieldRow label="Subject" htmlFor="m-sub" required><AInput id="m-sub" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} required /></FieldRow>
              <FieldRow label="Message" htmlFor="m-body" required><ATextarea id="m-body" rows={7} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} required /></FieldRow>
              <button type="submit" className={btn('primary')} disabled={pending}>Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
