'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { AInput, btn } from './ui'

/** Text field holding an image reference (uploaded URL or placeholder:key) with an Upload button. */
export function ImageField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = React.useState(false)
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    const form = new FormData()
    form.append('file', file)
    form.append('kind', 'image')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
    setBusy(false)
    const body = (await res.json().catch(() => ({}))) as { url?: string; error?: { message?: string } }
    if (res.ok && body.url) {
      onChange(body.url)
      toast.success('Image uploaded.')
    } else toast.error(body.error?.message ?? 'Upload failed.')
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-slate-100">
        {value && (value.startsWith('placeholder:') || value.startsWith('/api/files/')) ? <PlaceholderArt src={value} alt="Preview" label="Preview" fill sizes="112px" className="object-cover" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <AInput id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Upload an image, or type placeholder:hero-01" />
        <label className={`${btn('outline', 'sm')} mt-2 cursor-pointer`}>
          {busy ? 'Uploading…' : 'Upload image'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={upload} disabled={busy} />
        </label>
      </div>
    </div>
  )
}
