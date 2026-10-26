'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AInput, ASelect, ATextarea, FieldRow, btn } from './ui'
import { savePage } from '@/app/(admin)/admin/actions'

export interface PageRow { slug: string; title: string; body: string }

/** Edits the static pages (about, policies). Content is HTML; it is sanitised on save and again on render. */
export function PageEditor({ pages }: { pages: PageRow[] }) {
  const router = useRouter()
  const [slug, setSlug] = React.useState(pages[0]?.slug ?? 'about')
  const current = pages.find((p) => p.slug === slug)
  const [title, setTitle] = React.useState(current?.title ?? '')
  const [body, setBody] = React.useState(current?.body ?? '')
  const [pending, start] = React.useTransition()

  function pick(s: string) {
    const p = pages.find((x) => x.slug === s)
    setSlug(s); setTitle(p?.title ?? ''); setBody(p?.body ?? '')
  }
  return (
    <form
      className="max-w-3xl"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await savePage(slug, title, body)
          if (res.ok) { toast.success(res.message ?? 'Saved.'); router.refresh() } else toast.error(res.error)
        })
      }}
    >
      <FieldRow label="Page" htmlFor="pg-slug">
        <ASelect id="pg-slug" value={slug} onChange={(e) => pick(e.target.value)}>
          {pages.map((p) => <option key={p.slug} value={p.slug}>{p.title} (/{p.slug})</option>)}
        </ASelect>
      </FieldRow>
      <FieldRow label="Title" htmlFor="pg-title" required><AInput id="pg-title" value={title} onChange={(e) => setTitle(e.target.value)} required /></FieldRow>
      <FieldRow label="Content (HTML)" htmlFor="pg-body" help="Allowed: headings, paragraphs, lists, links, bold/italic, tables, images. Scripts are removed."><ATextarea id="pg-body" rows={16} className="font-mono text-xs" value={body} onChange={(e) => setBody(e.target.value)} /></FieldRow>
      <button type="submit" className={btn('primary')} disabled={pending}>{pending ? 'Saving…' : 'Save page'}</button>
    </form>
  )
}
