'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { SettingField } from '@/lib/admin/settings-def'
import { AInput, ASelect, ATextarea, FieldRow, btn } from './ui'
import { saveSettings } from '@/app/(admin)/admin/actions'

export function SettingsForm({ fields, initial }: { fields: SettingField[]; initial: Record<string, string> }) {
  const router = useRouter()
  const [v, setV] = React.useState<Record<string, string>>(initial)
  const [pending, start] = React.useTransition()
  return (
    <form
      className="max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await saveSettings(v)
          if (res.ok) { toast.success(res.message ?? 'Saved.'); router.refresh() } else toast.error(res.error)
        })
      }}
    >
      {fields.map((f) => {
        const id = `s-${f.key}`
        const set = (val: string) => setV({ ...v, [f.key]: val })
        return (
          <FieldRow key={f.key} label={f.label} htmlFor={id} help={f.help}>
            {f.type === 'textarea' ? <ATextarea id={id} value={v[f.key] ?? ''} onChange={(e) => set(e.target.value)} />
              : f.type === 'select' ? <ASelect id={id} value={v[f.key] ?? ''} onChange={(e) => set(e.target.value)}>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</ASelect>
              : <AInput id={id} type={f.type === 'number' ? 'number' : 'text'} value={v[f.key] ?? ''} onChange={(e) => set(e.target.value)} placeholder={f.placeholder} autoComplete="off" />}
          </FieldRow>
        )
      })}
      <button type="submit" className={btn('primary')} disabled={pending}>{pending ? 'Saving…' : 'Save settings'}</button>
    </form>
  )
}
