'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AInput, ATextarea, FieldRow, btn } from './ui'
import { createUser } from '@/app/(admin)/admin/actions'

export function UserForm({ role, backTo }: { role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'; backTo: string }) {
  const router = useRouter()
  const [v, setV] = React.useState({ name: '', email: '', password: '', title: '', bio: '' })
  const [pending, start] = React.useTransition()
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value })
  return (
    <form
      className="mx-auto max-w-xl"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await createUser({ ...v, role })
          if (res.ok) {
            toast.success('User created.')
            router.push(backTo)
            router.refresh()
          } else toast.error(res.error)
        })
      }}
    >
      <FieldRow label="Full name" htmlFor="u-name" required><AInput id="u-name" value={v.name} onChange={set('name')} required /></FieldRow>
      <FieldRow label="Email" htmlFor="u-email" required><AInput id="u-email" type="email" value={v.email} onChange={set('email')} required /></FieldRow>
      <FieldRow label="Temporary password" htmlFor="u-pass" required help="At least 8 characters. Ask the user to change it after the first login."><AInput id="u-pass" type="text" value={v.password} onChange={set('password')} minLength={8} required autoComplete="new-password" /></FieldRow>
      {role === 'INSTRUCTOR' ? (
        <>
          <FieldRow label="Title / speciality" htmlFor="u-title"><AInput id="u-title" value={v.title} onChange={set('title')} /></FieldRow>
          <FieldRow label="Biography" htmlFor="u-bio"><ATextarea id="u-bio" value={v.bio} onChange={set('bio')} /></FieldRow>
        </>
      ) : null}
      <button type="submit" className={btn('primary')} disabled={pending}>{pending ? 'Creating…' : 'Create user'}</button>
    </form>
  )
}
