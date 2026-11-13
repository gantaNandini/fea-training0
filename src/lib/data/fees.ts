import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'

export interface FeeRow {
  slug: string
  title: string
  hours: number
  price: number // paise
  discountPrice: number | null
  isFree: boolean
  syllabusUrl: string | null
}

/** Rows for the home page "Course Duration and Fees" table. Tag: `courses`. */
export const getFeeRows = unstable_cache(
  async (): Promise<FeeRow[]> => {
    const courses = await db.course.findMany({
      where: { status: { in: ['PUBLISHED', 'UPCOMING'] } },
      orderBy: [{ featuredOrder: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
      select: {
        slug: true,
        title: true,
        durationHours: true,
        price: true,
        discountPrice: true,
        isFree: true,
        syllabusUrl: true,
        sections: { select: { lessons: { select: { durationSeconds: true } } } },
      },
    })
    return courses.map((c) => {
      const seconds = c.sections.reduce((n, s) => n + s.lessons.reduce((m, l) => m + l.durationSeconds, 0), 0)
      return {
        slug: c.slug,
        title: c.title,
        hours: c.durationHours ?? Math.round(seconds / 3600),
        price: c.price,
        discountPrice: c.discountPrice,
        isFree: c.isFree,
        syllabusUrl: c.syllabusUrl,
      }
    })
  },
  ['fee-rows-v2'],
  { tags: ['courses'], revalidate: 3600 },
)
