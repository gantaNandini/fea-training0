'use client'

import * as React from 'react'
import Link from 'next/link'
import type { RatingBreakdownDTO, ReviewDTO } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/shared/StarRating'
import { RatingBreakdown } from './RatingBreakdown'
import { ReviewForm } from './ReviewForm'
import { messages } from '@/lib/messages'

interface Mine {
  authenticated: boolean
  enrolled: boolean
  review: (ReviewDTO & { approved: boolean }) | null
}

function ReviewItem({ r, pending }: { r: ReviewDTO; pending?: boolean }) {
  return (
    <li className="border-b border-border py-4 last:border-0" data-testid="review-item">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{r.userName}</span>
        <StarRating value={r.rating} count={1} compact />
        {pending ? <Badge tone="warning">{messages.course.pendingApproval}</Badge> : null}
        <time dateTime={r.createdAt} className="text-xs text-muted-foreground">
          {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
        </time>
      </div>
      <p className="mt-2 text-sm">{r.comment}</p>
    </li>
  )
}

/**
 * Student feedback (REQ-097/098). Public data (breakdown + first page) is server-rendered; the
 * viewer's own review/eligibility is fetched client-side so the page stays cacheable.
 */
export function ReviewsSection({
  courseId,
  slug,
  breakdown,
  initial,
}: {
  courseId: string
  slug: string
  breakdown: RatingBreakdownDTO
  initial: { items: ReviewDTO[]; total: number; page: number; pageSize: number }
}) {
  const [items, setItems] = React.useState(initial.items)
  const [page, setPage] = React.useState(initial.page)
  const [mine, setMine] = React.useState<Mine | null>(null)
  const [loading, setLoading] = React.useState(false)

  const loadMine = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/mine?courseId=${encodeURIComponent(courseId)}`, { cache: 'no-store' })
      if (res.ok) setMine((await res.json()) as Mine)
    } catch {
      /* ignore */
    }
  }, [courseId])

  React.useEffect(() => {
    void loadMine()
  }, [loadMine])

  async function loadMore() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews?slug=${encodeURIComponent(slug)}&page=${page + 1}`)
      if (res.ok) {
        const data = (await res.json()) as typeof initial
        setItems((prev) => [...prev, ...data.items])
        setPage(data.page)
      }
    } finally {
      setLoading(false)
    }
  }

  const hasMore = items.length < initial.total

  return (
    <div className="space-y-8">
      <RatingBreakdown data={breakdown} />

      {mine?.review && !mine.review.approved ? (
        <ul className="rounded-lg bg-amber-50 px-4 dark:bg-amber-950/30">
          <ReviewItem r={mine.review} pending />
        </ul>
      ) : null}

      {mine && !mine.authenticated ? (
        <p>
          <Link
            href={`/login?redirect=${encodeURIComponent(`/courses/${slug}`)}`}
            className="font-semibold text-link underline underline-offset-4"
          >
            {messages.course.loginToReview}
          </Link>
        </p>
      ) : null}

      {mine?.authenticated && mine.enrolled && !mine.review ? (
        <ReviewForm courseId={courseId} onSubmitted={loadMine} />
      ) : null}
      {mine?.review?.approved ? <p className="text-sm text-muted-foreground">{messages.course.alreadyReviewed}</p> : null}

      {items.length > 0 ? (
        <div>
          <ul>
            {items.map((r) => (
              <ReviewItem key={r.id} r={r} />
            ))}
          </ul>
          {hasMore ? (
            <Button variant="outline" onClick={loadMore} disabled={loading} className="mt-4">
              {messages.common.viewMore}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
