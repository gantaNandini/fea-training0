import type { Metadata } from 'next'
import { CompareTable } from '@/components/course/CompareTable'
import { getCompareCourses } from '@/lib/data/courses'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const metadata: Metadata = buildMetadata({
  title: messages.compare.title,
  description: 'Compare courses side by side.',
  path: '/compare',
  noIndex: true,
})

/** REQ-150: server-rendered and shareable via ?ids=a,b,c (max 3). No /api/compare route. */
export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams
  const list = Array.from(new Set((ids ?? '').split(',').map((s) => s.trim()).filter(Boolean))).slice(0, 3)
  const courses = await getCompareCourses(list)
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="mb-8">{messages.compare.title}</h1>
      <CompareTable courses={courses} urlHadIds={list.length > 0} />
    </div>
  )
}
