import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import type { RatingBreakdownDTO, ReviewDTO } from '@/lib/types'

const PAGE_SIZE = 5

function toDTO(r: {
  id: string
  rating: number
  comment: string
  createdAt: Date
  user: { name: string | null }
}): ReviewDTO {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    userName: r.user.name ?? 'Student',
  }
}

/** Approved reviews only (REQ-097). Tag: `course-{slug}`. */
export function getApprovedReviews(
  courseId: string,
  slug: string,
  page = 1,
): Promise<{ items: ReviewDTO[]; total: number; page: number; pageSize: number }> {
  return unstable_cache(
    async () => {
      const [rows, total] = await Promise.all([
        db.review.findMany({
          where: { courseId, approved: true },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          include: { user: { select: { name: true } } },
        }),
        db.review.count({ where: { courseId, approved: true } }),
      ])
      return { items: rows.map(toDTO), total, page, pageSize: PAGE_SIZE }
    },
    ['approved-reviews', courseId, String(page)],
    { tags: [`course-${slug}`, 'reviews'], revalidate: 3600 },
  )()
}

export function getRatingBreakdown(courseId: string, slug: string): Promise<RatingBreakdownDTO> {
  return unstable_cache(
    async () => {
      const groups = await db.review.groupBy({
        by: ['rating'],
        where: { courseId, approved: true },
        _count: { _all: true },
      })
      const counts: [number, number, number, number, number] = [0, 0, 0, 0, 0]
      let sum = 0
      let total = 0
      for (const g of groups) {
        if (g.rating >= 1 && g.rating <= 5) {
          counts[g.rating - 1] = g._count._all
          sum += g.rating * g._count._all
          total += g._count._all
        }
      }
      return { counts, total, average: total > 0 ? sum / total : null }
    },
    ['rating-breakdown', courseId],
    { tags: [`course-${slug}`, 'reviews'], revalidate: 3600 },
  )()
}

/** The viewer's own review (pending or approved). Never cached. */
export async function getOwnReview(userId: string, courseId: string) {
  const r = await db.review.findUnique({
    where: { userId_courseId: { userId, courseId } },
    include: { user: { select: { name: true } } },
  })
  return r ? { ...toDTO(r), approved: r.approved } : null
}

export async function createReview(input: {
  userId: string
  courseId: string
  rating: number
  comment: string
}) {
  return db.review.create({
    data: { ...input, approved: false },
    select: { id: true },
  })
}
