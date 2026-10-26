'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, FileUp, ListPlus, Plus, Trash2 } from 'lucide-react'
import { AInput, ASelect, ATextarea, Card, FieldRow, btn } from './ui'
import { ImageField } from './ImageField'
import { Tabs } from './Tabs'
import { saveCourse } from '@/app/(admin)/admin/actions'

export interface LessonState { key: string; id?: string; title: string; type: 'VIDEO' | 'DOCUMENT' | 'QUIZ'; minutes: string; isFreePreview: boolean; videoUrl: string; fileUrl: string }
export interface SectionState { key: string; id?: string; title: string; lessons: LessonState[] }
export interface CourseState {
  id?: string
  title: string; slug: string; subtitle: string; shortDescription: string; description: string
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'; language: string; status: 'DRAFT' | 'PUBLISHED' | 'UPCOMING'
  price: string; discountPrice: string; isFree: boolean; featured: boolean; featuredOrder: string
  thumbnail: string; previewVideoUrl: string; instructorId: string
  categoryIds: string[]; primaryCategoryId: string
  requirements: string; outcomes: string; tags: string; seoTitle: string; seoDescription: string
  sections: SectionState[]
}

let counter = 0
const k = () => `k${++counter}`
export const newLesson = (title = ''): LessonState => ({ key: k(), title, type: 'VIDEO', minutes: '10', isFreePreview: false, videoUrl: '', fileUrl: '' })
export const newSection = (title = ''): SectionState => ({ key: k(), title, lessons: [] })

function move<T>(arr: T[], i: number, d: -1 | 1): T[] {
  const j = i + d
  if (j < 0 || j >= arr.length) return arr
  const out = [...arr]
  ;[out[i], out[j]] = [out[j], out[i]]
  return out
}
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)

export function CourseEditor({
  initial,
  categories,
  instructors,
}: {
  initial: CourseState
  categories: { id: string; name: string }[]
  instructors: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [c, setC] = React.useState<CourseState>(initial)
  const [pending, start] = React.useTransition()
  const [bulk, setBulk] = React.useState<Record<string, string>>({})
  const set = <K extends keyof CourseState>(key: K, v: CourseState[K]) => setC((p) => ({ ...p, [key]: v }))
  const text = (key: keyof CourseState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(key, e.target.value as never)

  const setSection = (si: number, fn: (s: SectionState) => SectionState) => set('sections', c.sections.map((s, i) => (i === si ? fn(s) : s)))
  const setLesson = (si: number, li: number, patch: Partial<LessonState>) =>
    setSection(si, (s) => ({ ...s, lessons: s.lessons.map((l, i) => (i === li ? { ...l, ...patch } : l)) }))

  async function uploadPdf(si: number, li: number, file: File | undefined) {
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    form.append('kind', 'document')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
    const body = (await res.json().catch(() => ({}))) as { key?: string; error?: { message?: string } }
    if (res.ok && body.key) { setLesson(si, li, { fileUrl: body.key }); toast.success('PDF uploaded.') } else toast.error(body.error?.message ?? 'Upload failed.')
  }

  function submit(status?: CourseState['status']) {
    const payload = {
      id: c.id,
      title: c.title, slug: c.slug || null, subtitle: c.subtitle || null,
      shortDescription: c.shortDescription, description: c.description,
      level: c.level, language: c.language,
      price: Math.round(Number(c.price) || 0),
      discountPrice: c.discountPrice.trim() === '' ? null : Math.round(Number(c.discountPrice) || 0),
      isFree: c.isFree,
      thumbnail: c.thumbnail || null, previewVideoUrl: c.previewVideoUrl || null,
      status: status ?? c.status,
      featured: c.featured, featuredOrder: c.featured && c.featuredOrder ? Math.round(Number(c.featuredOrder)) : null,
      instructorId: c.instructorId,
      requirements: lines(c.requirements), outcomes: lines(c.outcomes),
      tags: c.tags.split(',').map((t) => t.trim()).filter(Boolean),
      seoTitle: c.seoTitle || null, seoDescription: c.seoDescription || null,
      categoryIds: c.categoryIds, primaryCategoryId: c.primaryCategoryId || null,
      sections: c.sections.map((s) => ({
        id: s.id, title: s.title,
        lessons: s.lessons.map((l) => ({
          id: l.id, title: l.title, type: l.type,
          durationSeconds: l.type === 'DOCUMENT' ? 0 : Math.max(0, Math.round((Number(l.minutes) || 0) * 60)),
          isFreePreview: l.isFreePreview,
          videoUrl: l.type === 'VIDEO' ? l.videoUrl || null : null,
          fileUrl: l.type === 'DOCUMENT' ? l.fileUrl || null : null,
        })),
      })),
    }
    start(async () => {
      const res = await saveCourse(payload)
      if (res.ok) {
        toast.success(res.message ?? 'Saved.')
        if (!c.id) router.push(`/admin/courses/${res.id}`)
        else router.refresh()
        if (status) set('status', status)
      } else toast.error(res.error)
    })
  }

  const totalLessons = c.sections.reduce((n, s) => n + s.lessons.length, 0)
  const totalMinutes = c.sections.reduce((n, s) => n + s.lessons.reduce((m, l) => m + (l.type === 'DOCUMENT' ? 0 : Number(l.minutes) || 0), 0), 0)

  const basic = (
    <div className="grid gap-x-6 md:grid-cols-2">
      <FieldRow label="Course title" htmlFor="c-title" required className="md:col-span-2"><AInput id="c-title" value={c.title} onChange={text('title')} /></FieldRow>
      <FieldRow label="Sub-title" htmlFor="c-sub" className="md:col-span-2"><AInput id="c-sub" value={c.subtitle} onChange={text('subtitle')} /></FieldRow>
      <FieldRow label="Short description" htmlFor="c-short" required className="md:col-span-2" help="Shown on course cards (10–500 characters)."><ATextarea id="c-short" rows={3} value={c.shortDescription} onChange={text('shortDescription')} /></FieldRow>
      <FieldRow label="Description (HTML allowed)" htmlFor="c-desc" required className="md:col-span-2" help="Use <p>, <h3>, <ul><li>, <strong>. Scripts are removed automatically."><ATextarea id="c-desc" rows={10} className="font-mono text-xs" value={c.description} onChange={text('description')} /></FieldRow>
      <FieldRow label="Level" htmlFor="c-level"><ASelect id="c-level" value={c.level} onChange={text('level')}><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></ASelect></FieldRow>
      <FieldRow label="Language" htmlFor="c-lang"><AInput id="c-lang" value={c.language} onChange={text('language')} /></FieldRow>
      <FieldRow label="Status" htmlFor="c-status" help="Draft is hidden. Upcoming shows “Coming soon”. Published is on sale."><ASelect id="c-status" value={c.status} onChange={text('status')}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="UPCOMING">Upcoming</option></ASelect></FieldRow>
      <FieldRow label="Instructor" htmlFor="c-inst" required><ASelect id="c-inst" value={c.instructorId} onChange={text('instructorId')}><option value="">Select…</option>{instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</ASelect></FieldRow>
      <FieldRow label="Custom URL slug" htmlFor="c-slug" help="Leave empty to generate from the title." className="md:col-span-2"><AInput id="c-slug" value={c.slug} onChange={text('slug')} /></FieldRow>
      <fieldset className="mb-4 md:col-span-2">
        <legend className="mb-1.5 text-sm font-semibold">Categories <span className="font-normal text-slate-500">(select all that apply, then choose the primary one)</span></legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((cat) => {
            const on = c.categoryIds.includes(cat.id)
            return (
              <div key={cat.id} className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-slate-200 px-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={on} onChange={(e) => setC((p) => ({ ...p, categoryIds: e.target.checked ? [...p.categoryIds, cat.id] : p.categoryIds.filter((x) => x !== cat.id), primaryCategoryId: !e.target.checked && p.primaryCategoryId === cat.id ? '' : p.primaryCategoryId || (e.target.checked ? cat.id : '') }))} /> {cat.name}</label>
                {on ? <label className="flex items-center gap-1 text-xs text-slate-600"><input type="radio" name="primary-cat" checked={c.primaryCategoryId === cat.id} onChange={() => set('primaryCategoryId', cat.id)} /> Primary</label> : null}
              </div>
            )
          })}
        </div>
      </fieldset>
      <FieldRow label="Thumbnail" htmlFor="c-thumb" className="md:col-span-2" help="Recommended 1280×720. Uploaded images are converted to WebP."><ImageField id="c-thumb" value={c.thumbnail} onChange={(v) => set('thumbnail', v)} /></FieldRow>
      <FieldRow label="Preview video URL (YouTube / Vimeo embed)" htmlFor="c-prev" className="md:col-span-2" help="Optional. Example: https://www.youtube.com/embed/VIDEO_ID"><AInput id="c-prev" value={c.previewVideoUrl} onChange={text('previewVideoUrl')} /></FieldRow>
    </div>
  )

  const pricing = (
    <div className="max-w-xl">
      <label className="mb-4 flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" className="h-5 w-5" checked={c.isFree} onChange={(e) => set('isFree', e.target.checked)} /> This course is free</label>
      {!c.isFree ? (
        <>
          <FieldRow label="Price (₹)" htmlFor="c-price" required><AInput id="c-price" type="number" min={0} value={c.price} onChange={text('price')} /></FieldRow>
          <FieldRow label="Discounted price (₹)" htmlFor="c-disc" help="Optional. Must be lower than the price."><AInput id="c-disc" type="number" min={0} value={c.discountPrice} onChange={text('discountPrice')} /></FieldRow>
        </>
      ) : null}
      <label className="mb-4 flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" className="h-5 w-5" checked={c.featured} onChange={(e) => set('featured', e.target.checked)} /> Feature on the home page</label>
      {c.featured ? <FieldRow label="Featured order" htmlFor="c-fo" help="1 appears first."><AInput id="c-fo" type="number" min={1} value={c.featuredOrder} onChange={text('featuredOrder')} /></FieldRow> : null}
    </div>
  )

  const curriculum = (
    <div>
      <p className="mb-4 text-sm text-slate-600">{c.sections.length} sections · {totalLessons} lessons · about {(totalMinutes / 60).toFixed(1)} hours</p>
      {c.sections.map((s, si) => (
        <div key={s.key} className="mb-5 rounded-lg border border-slate-200">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-3">
            <span className="text-sm font-bold text-slate-500">Section {si + 1}</span>
            <AInput aria-label={`Section ${si + 1} title`} className="min-w-48 flex-1" value={s.title} onChange={(e) => setSection(si, (x) => ({ ...x, title: e.target.value }))} placeholder="Section title" />
            <button type="button" aria-label="Move section up" className={btn('outline', 'sm')} onClick={() => set('sections', move(c.sections, si, -1))}><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" aria-label="Move section down" className={btn('outline', 'sm')} onClick={() => set('sections', move(c.sections, si, 1))}><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" aria-label="Delete section" className={btn('danger', 'sm')} onClick={() => { if (s.lessons.length === 0 || window.confirm(`Delete this section and its ${s.lessons.length} lessons?`)) set('sections', c.sections.filter((_, i) => i !== si)) }}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
          </div>
          <div className="space-y-2 p-3">
            {s.lessons.length === 0 ? <p className="text-sm text-slate-500">No lessons yet.</p> : null}
            {s.lessons.map((l, li) => (
              <div key={l.key} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-6 text-sm text-slate-500">{li + 1}.</span>
                  <AInput aria-label={`Lesson ${li + 1} title`} className="min-w-48 flex-1" value={l.title} onChange={(e) => setLesson(si, li, { title: e.target.value })} placeholder="Lesson title" />
                  <ASelect aria-label="Lesson type" className="w-32" value={l.type} onChange={(e) => setLesson(si, li, { type: e.target.value as LessonState['type'] })}><option value="VIDEO">Video</option><option value="DOCUMENT">Document</option><option value="QUIZ">Quiz</option></ASelect>
                  {l.type !== 'DOCUMENT' ? <AInput aria-label="Duration in minutes" type="number" min={0} step="0.5" className="w-24" value={l.minutes} onChange={(e) => setLesson(si, li, { minutes: e.target.value })} title="Duration (minutes)" /> : null}
                  <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" className="h-4 w-4" checked={l.isFreePreview} onChange={(e) => setLesson(si, li, { isFreePreview: e.target.checked })} /> Free preview</label>
                  <button type="button" aria-label="Move lesson up" className={btn('outline', 'sm')} onClick={() => setSection(si, (x) => ({ ...x, lessons: move(x.lessons, li, -1) }))}><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
                  <button type="button" aria-label="Move lesson down" className={btn('outline', 'sm')} onClick={() => setSection(si, (x) => ({ ...x, lessons: move(x.lessons, li, 1) }))}><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
                  <button type="button" aria-label="Delete lesson" className={btn('danger', 'sm')} onClick={() => setSection(si, (x) => ({ ...x, lessons: x.lessons.filter((_, i) => i !== li) }))}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                </div>
                {l.type === 'VIDEO' ? (
                  <AInput aria-label="Video URL" className="mt-2" value={l.videoUrl} onChange={(e) => setLesson(si, li, { videoUrl: e.target.value })} placeholder="Video embed URL (https://www.youtube.com/embed/… or player.vimeo.com/video/…) — empty shows a demo player" />
                ) : null}
                {l.type === 'DOCUMENT' ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <label className={`${btn('outline', 'sm')} cursor-pointer`}><FileUp className="h-4 w-4" aria-hidden="true" /> Upload PDF<input type="file" accept="application/pdf" className="sr-only" onChange={(e) => { void uploadPdf(si, li, e.target.files?.[0]); e.target.value = '' }} /></label>
                    <span className="text-slate-500">{l.fileUrl && !l.fileUrl.startsWith('placeholder:') ? `Uploaded: ${l.fileUrl.split('/').pop()}` : 'No file yet (placeholder shown to students)'}</span>
                  </div>
                ) : null}
              </div>
            ))}
            <div className="flex flex-wrap items-start gap-3 pt-2">
              <button type="button" className={btn('outline', 'sm')} onClick={() => setSection(si, (x) => ({ ...x, lessons: [...x.lessons, newLesson(`Lesson ${x.lessons.length + 1}`)] }))}><Plus className="h-4 w-4" aria-hidden="true" /> Add lesson</button>
              <details className="flex-1 text-sm">
                <summary className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 text-xs font-semibold"><ListPlus className="h-4 w-4" aria-hidden="true" /> Add many lessons</summary>
                <ATextarea aria-label="One lesson title per line" className="mt-2" rows={5} placeholder={'One lesson title per line\nIntroduction\nSetting up the model\n…'} value={bulk[s.key] ?? ''} onChange={(e) => setBulk({ ...bulk, [s.key]: e.target.value })} />
                <button type="button" className={`${btn('info', 'sm')} mt-2`} onClick={() => { const titles = lines(bulk[s.key] ?? ''); if (!titles.length) return; setSection(si, (x) => ({ ...x, lessons: [...x.lessons, ...titles.map((t) => newLesson(t))] })); setBulk({ ...bulk, [s.key]: '' }) }}>Add these lessons</button>
              </details>
            </div>
          </div>
        </div>
      ))}
      <button type="button" className={btn('info')} onClick={() => set('sections', [...c.sections, newSection(`Section ${c.sections.length + 1}`)])}><Plus className="h-4 w-4" aria-hidden="true" /> Add section</button>
    </div>
  )

  const extras = (
    <div className="grid max-w-3xl gap-x-6">
      <FieldRow label="What students will learn (one per line)" htmlFor="c-out"><ATextarea id="c-out" rows={6} value={c.outcomes} onChange={text('outcomes')} /></FieldRow>
      <FieldRow label="Requirements (one per line)" htmlFor="c-req"><ATextarea id="c-req" rows={4} value={c.requirements} onChange={text('requirements')} /></FieldRow>
      <FieldRow label="Tags (comma separated)" htmlFor="c-tags"><AInput id="c-tags" value={c.tags} onChange={text('tags')} /></FieldRow>
      <FieldRow label="SEO title" htmlFor="c-seot"><AInput id="c-seot" value={c.seoTitle} onChange={text('seoTitle')} /></FieldRow>
      <FieldRow label="SEO description" htmlFor="c-seod"><ATextarea id="c-seod" rows={3} value={c.seoDescription} onChange={text('seoDescription')} /></FieldRow>
    </div>
  )

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit() }}>
      <Card>
        <Tabs tabs={[
          { id: 'basic', label: 'Basic', content: basic },
          { id: 'pricing', label: 'Pricing', content: pricing },
          { id: 'curriculum', label: `Curriculum (${totalLessons})`, content: curriculum },
          { id: 'extras', label: 'Outcomes & SEO', content: extras },
        ]} />
      </Card>
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 rounded-lg bg-white/95 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur">
        <button type="submit" className={btn('primary')} disabled={pending}>{pending ? 'Saving…' : c.id ? 'Save changes' : 'Create course'}</button>
        {c.status !== 'PUBLISHED' ? <button type="button" className={btn('info')} disabled={pending} onClick={() => submit('PUBLISHED')}>Save &amp; publish</button> : null}
        <button type="button" className={btn('outline')} onClick={() => router.push('/admin/courses')}>Back to courses</button>
      </div>
    </form>
  )
}
