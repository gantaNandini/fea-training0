'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CompareCourseDTO } from '@/lib/types'
import { Button, ButtonLink } from '@/components/ui/button'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { PriceTag } from '@/components/shared/PriceTag'
import { StarRating } from '@/components/shared/StarRating'
import { EmptyState } from '@/components/shared/EmptyState'
import { useCart } from '@/hooks/useCart'
import { useCompare } from '@/hooks/useCompare'
import { formatHours } from '@/lib/utils/pricing'
import { messages } from '@/lib/messages'

const levelLabel = {
  BEGINNER: messages.course.levelBeginner,
  INTERMEDIATE: messages.course.levelIntermediate,
  ADVANCED: messages.course.levelAdvanced,
} as const

/**
 * Server-rendered from ?ids= (shareable). localStorage only mirrors the ids (REQ-150). When the URL
 * has no ids but localStorage does, the URL is filled in.
 */
export function CompareTable({ courses, urlHadIds }: { courses: CompareCourseDTO[]; urlHadIds: boolean }) {
  const router = useRouter()
  const compare = useCompare()
  const cart = useCart()
  const synced = React.useRef(false)

  React.useEffect(() => {
    if (synced.current) return
    if (!urlHadIds && compare.ids.length > 0) {
      synced.current = true
      router.replace(`/compare?ids=${compare.ids.join(',')}`)
    }
  }, [urlHadIds, compare.ids, router])

  // Keep localStorage aligned with a shared URL.
  React.useEffect(() => {
    if (urlHadIds && courses.length > 0 && compare.ids.join() !== courses.map((c) => c.id).join()) {
      try {
        window.localStorage.setItem('compare_ids', JSON.stringify(courses.map((c) => c.id)))
        window.dispatchEvent(new Event('compare:change'))
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlHadIds, courses])

  function remove(id: string) {
    compare.remove(id)
    const rest = courses.filter((c) => c.id !== id).map((c) => c.id)
    router.replace(rest.length ? `/compare?ids=${rest.join(',')}` : '/compare')
  }

  function clearAll() {
    compare.clear()
    router.replace('/compare')
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        title={messages.compare.empty}
        body={messages.compare.emptyBody}
        action={<ButtonLink href="/courses">{messages.common.browseCourses}</ButtonLink>}
      />
    )
  }

  const cell = 'min-w-56 border-t border-border p-4 align-top'
  const head = 'sticky left-0 z-10 w-36 min-w-36 border-t border-border bg-surface-alt p-4 text-left align-top text-sm font-semibold'
  const rows: { label: string; render: (c: CompareCourseDTO) => React.ReactNode }[] = [
    { label: messages.compare.rowPrice, render: (c) => <PriceTag price={c.price} discountPrice={c.discountPrice} isFree={c.isFree} /> },
    { label: messages.compare.rowLevel, render: (c) => levelLabel[c.level] },
    { label: messages.compare.rowLanguage, render: (c) => c.language },
    { label: messages.compare.rowLessons, render: (c) => (c.lessonCount > 0 ? c.lessonCount : messages.course.curriculumSoon) },
    { label: messages.compare.rowHours, render: (c) => (c.lessonCount > 0 ? formatHours(c.totalSeconds) : '—') },
    { label: messages.compare.rowRating, render: (c) => <StarRating value={c.avgRating} count={c.reviewCount} /> },
    { label: messages.compare.rowInstructor, render: (c) => c.instructorName },
    { label: messages.compare.rowCategories, render: (c) => c.categoryNames.join(', ') },
    {
      label: messages.compare.rowOutcomes,
      render: (c) => (
        <ul className="list-disc space-y-1 pl-4 text-sm">
          {c.topOutcomes.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" onClick={clearAll}>
          {messages.compare.clear}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border" data-testid="compare-table">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{messages.compare.title}</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-surface-alt p-4 text-left text-sm font-semibold">
                <span className="sr-only">Attribute</span>
              </th>
              {courses.map((c) => (
                <th key={c.id} scope="col" className="min-w-56 p-4 text-left align-top font-normal">
                  <div className="relative aspect-card overflow-hidden rounded-md bg-muted">
                    <PlaceholderArt src={c.thumbnail} alt={c.title} fill sizes="224px" className="object-cover" />
                  </div>
                  <Link href={`/courses/${c.slug}`} className="mt-3 block font-display font-bold hover:text-link">
                    {c.title}
                  </Link>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => remove(c.id)}>
                      {messages.common.remove}
                    </Button>
                    <Button
                      size="sm"
                      disabled={c.status !== 'PUBLISHED' || cart.has(c.id)}
                      onClick={() => cart.add(c.id)}
                    >
                      {cart.has(c.id) ? messages.course.inCart : messages.course.addToCart}
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className={head}>
                  {r.label}
                </th>
                {courses.map((c) => (
                  <td key={c.id} className={cell}>
                    {r.render(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
