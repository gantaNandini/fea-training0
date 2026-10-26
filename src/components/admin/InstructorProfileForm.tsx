'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AInput, ATextarea, FieldRow, btn } from './ui'
import { saveInstructorProfile } from '@/app/(admin)/admin/actions'

/** Public instructor details shown on course pages (title, bio, social links). */
export function InstructorProfileForm({ initial }: { initial: { title: string; bio: string; linkedin: string; twitter: string; website: string } }) {
  const router = useRouter()
  const [v, setV] = React.useState(initial)
  const [pending, start] = React.useTransition()
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value })
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await saveInstructorProfile(v); if (r.ok) { toast.success(r.message ?? 'Saved.'); router.refresh() } else toast.error(r.error) }) }}>
      <FieldRow label="Title / speciality" htmlFor="ip-title"><AInput id="ip-title" value={v.title} onChange={set('title')} /></FieldRow>
      <FieldRow label="Biography" htmlFor="ip-bio"><ATextarea id="ip-bio" rows={5} value={v.bio} onChange={set('bio')} /></FieldRow>
      <FieldRow label="LinkedIn link" htmlFor="ip-li"><AInput id="ip-li" value={v.linkedin} onChange={set('linkedin')} /></FieldRow>
      <FieldRow label="Twitter link" htmlFor="ip-tw"><AInput id="ip-tw" value={v.twitter} onChange={set('twitter')} /></FieldRow>
      <FieldRow label="Website" htmlFor="ip-web"><AInput id="ip-web" value={v.website} onChange={set('website')} /></FieldRow>
      <button type="submit" className={btn('primary')} disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
    </form>
  )
}
