'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { MODELS, type Field, type ModelKey } from '@/lib/admin/models'
import { removeRecord, saveRecord } from '@/app/(admin)/admin/actions'
import { AInput, ASelect, ATextarea, FieldRow, btn } from './ui'
import { ImageField } from './ImageField'

type Values = Record<string, string | boolean>
type Rec = Values & { id: string }

const empty = (fields: Field[], model: ModelKey): Values => {
  const v: Values = {}
  for (const f of fields) v[f.name] = f.type === 'checkbox' ? f.name === 'active' : f.type === 'select' ? f.options?.[0]?.value ?? '' : ''
  if (model === 'category' || model === 'heroSlide' || model === 'testimonial' || model === 'clientLogo') v.order = '0'
  return v
}

function show(v: string | boolean | undefined): string {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (!v) return '—'
  return v.length > 60 ? `${v.slice(0, 60)}…` : v
}

/** List + add/edit form for any whitelisted model. All writes go through admin-only server actions. */
export function RecordManager({ model, records }: { model: ModelKey; records: Rec[] }) {
  const def = MODELS[model]
  const router = useRouter()
  const [editing, setEditing] = React.useState<{ id: string | null; values: Values } | null>(null)
  const [pending, start] = React.useTransition()

  const colFields = def.columns.map((c) => def.fields.find((f) => f.name === c) ?? { name: c, label: c === 'usedCount' ? 'Used' : c === 'value' ? 'Value' : c, type: 'text' as const })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    start(async () => {
      const res = await saveRecord(model, editing.id, editing.values)
      if (res.ok) {
        toast.success(res.message ?? 'Saved.')
        setEditing(null)
        router.refresh()
      } else toast.error(res.error)
    })
  }

  function remove(id: string) {
    if (!window.confirm(`Delete this ${def.singular}?`)) return
    start(async () => {
      const res = await removeRecord(model, id)
      if (res.ok) {
        toast.success('Deleted.')
        router.refresh()
      } else toast.error(res.error)
    })
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button type="button" className={btn('primary')} onClick={() => setEditing({ id: null, values: empty(def.fields, model) })}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add {def.singular}
        </button>
      </div>

      {editing ? (
        <form onSubmit={submit} className="mb-6 rounded-lg border border-adm-accent/40 bg-adm-accent-soft/40 p-5">
          <h3 className="mb-4 font-display text-base font-bold text-slate-800">{editing.id ? `Edit ${def.singular}` : `New ${def.singular}`}</h3>
          <div className="grid gap-x-5 md:grid-cols-2">
            {def.fields.map((f) => {
              const id = `rec-${f.name}`
              const set = (v: string | boolean) => setEditing({ ...editing, values: { ...editing.values, [f.name]: v } })
              const val = editing.values[f.name]
              const wide = f.type === 'textarea' || f.type === 'image'
              return (
                <FieldRow key={f.name} label={f.label} htmlFor={id} required={f.required} help={f.help} className={wide ? 'md:col-span-2' : ''}>
                  {f.type === 'textarea' ? <ATextarea id={id} value={String(val ?? '')} onChange={(e) => set(e.target.value)} required={f.required} />
                    : f.type === 'select' ? <ASelect id={id} value={String(val ?? '')} onChange={(e) => set(e.target.value)}>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</ASelect>
                    : f.type === 'checkbox' ? <label className="flex min-h-11 items-center gap-2 text-sm"><input id={id} type="checkbox" className="h-5 w-5" checked={val === true} onChange={(e) => set(e.target.checked)} /> Enabled</label>
                    : f.type === 'image' ? <ImageField id={id} value={String(val ?? '')} onChange={set} />
                    : <AInput id={id} type={f.type === 'number' ? 'number' : f.type === 'datetime' ? 'datetime-local' : 'text'} step={f.type === 'number' ? 'any' : undefined} value={String(val ?? '')} onChange={(e) => set(e.target.value)} required={f.required} placeholder={f.placeholder} />}
                </FieldRow>
              )
            })}
          </div>
          <div className="flex gap-3">
            <button type="submit" className={btn('primary')} disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
            <button type="button" className={btn('outline')} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left">
              {colFields.map((f) => <th key={f.name} scope="col" className="px-3 py-3 font-semibold">{f.label}</th>)}
              <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={colFields.length + 1} className="bg-slate-50 px-3 py-6 text-center text-slate-600">Nothing here yet.</td></tr>
            ) : records.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                {colFields.map((f) => <td key={f.name} className="px-3 py-3">{show(f.name === 'discountType' ? (r[f.name] === 'PERCENT' ? 'Percent' : 'Flat') : r[f.name])}</td>)}
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" aria-label={`Edit ${def.singular}`} className={btn('outline', 'sm')} onClick={() => setEditing({ id: r.id, values: Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'id')) as Values })}><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                    <button type="button" aria-label={`Delete ${def.singular}`} className={btn('danger', 'sm')} disabled={pending} onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
