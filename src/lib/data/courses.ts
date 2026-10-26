// Next.js 15 — using unstable_cache + revalidateTag (REQ-270). On Next.js 16+, migrate to
// the `use cache` directive + cacheTag().
import { unstable_cache } from 'next/cache'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { effectivePrice } from '@/lib/utils/pricing'
import { getCategoryBySlug, getCategoryTree } from './categories'
import type {
  CompareCourseDTO,
  CourseCardDTO,
  CourseDetailDTO,
  CourseFilters,
  CourseListResult,
  InstructorDTO,
  SearchSuggestionsDTO,
  SectionDTO,
} from '@/lib/types'

interface StatRow {
  courseId: string
  lessonCount: number
  totalSeconds: number
  avgRating: number | null
  reviewCount: number
  studentCount: number
}

/** Card + the extra fields needed for server-side filtering. Never sent to the client as-is. */
interface CourseRecord extends CourseCardDTO {
  createdAt: string
  categorySlugs: string[]
  categoryNames: string[]
  allOutcomes: string[]
  tags: string[]
}

const cardInclude = {
  instructor: { select: { id: true, name: true } },
  categories: { include: { category: { select: { name: true, slug: true } } } },
} satisfies Prisma.CourseInclude

function toRecord(
  c: Prisma.CourseGetPayload<{ include: typeof cardInclude }>,
  stats: StatRow | undefined,
): CourseRecord {
  const primary = c.categories.find((x) => x.isPrimary)?.category
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    shortDescription: c.shortDescription,
    level: c.level,
    language: c.language,
    price: c.price,
    discountPrice: c.discountPrice,
    isFree: c.isFree,
    thumbnail: c.thumbnail,
    status: c.status,
    featured: c.featured,
    instructorId: c.instructorId,
    instructorName: c.instructor.name ?? 'Instructor',
    primaryCategoryName: primary?.name ?? null,
    primaryCategorySlug: primary?.slug ?? null,
    lessonCount: stats?.lessonCount ?? 0,
    totalSeconds: stats?.totalSeconds ?? 0,
    avgRating: stats?.avgRating ?? null,
    reviewCount: stats?.reviewCount ?? 0,
    studentCount: stats?.studentCount ?? 0,
    outcomes: c.outcomes.slice(0, 4),
    updatedAt: c.updatedAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    categorySlugs: c.categories.map((x) => x.category.slug),
    categoryNames: c.categories.map((x) => x.category.name),
    allOutcomes: c.outcomes,
    tags: c.tags,
  }
}

function toCard(r: CourseRecord): CourseCardDTO {
  // strip internal-only fields
  const { createdAt: _c, categorySlugs: _s, categoryNames: _n, allOutcomes: _o, tags: _t, ...card } = r
  void _c; void _s; void _n; void _o; void _t
  return card
}

/** Every PUBLISHED/UPCOMING course with CourseStats joined (REQ-002, REQ-080). Tag: `courses`. */
const getAllRecords = unstable_cache(
  async (): Promise<CourseRecord[]> => {
    const [courses, stats] = await Promise.all([
      db.course.findMany({
        where: { status: { in: ['PUBLISHED', 'UPCOMING'] } },
        include: cardInclude,
      }),
      db.$queryRaw<StatRow[]>`SELECT * FROM "CourseStats"`,
    ])
    const byId = new Map(stats.map((s) => [s.courseId, s]))
    return courses.map((c) => toRecord(c, byId.get(c.id)))
  },
  ['course-records'],
  { tags: ['courses'], revalidate: 3600 },
)

const DEFAULT_PAGE_SIZE = 12

export async function getCourses(filters: CourseFilters = {}): Promise<CourseListResult> {
  let list = await getAllRecords()

  if (filters.category) {
    const cat = await getCategoryBySlug(filters.category)
    const slugs = new Set<string>([filters.category])
    for (const ch of cat?.children ?? []) slugs.add(ch.slug)
    list = list.filter((c) => c.categorySlugs.some((s) => slugs.has(s)))
  }
  if (filters.q) {
    const words = filters.q.toLowerCase().split(/\s+/).filter(Boolean)
    list = list.filter((c) => {
      const hay = [c.title, c.subtitle ?? '', c.shortDescription, c.tags.join(' '), c.categoryNames.join(' ')]
        .join(' ')
        .toLowerCase()
      return words.every((w) => hay.includes(w))
    })
  }
  if (filters.levels?.length) list = list.filter((c) => filters.levels!.includes(c.level))
  if (filters.languages?.length) list = list.filter((c) => filters.languages!.includes(c.language))

  const eff = (c: CourseRecord) => (c.isFree ? 0 : effectivePrice(c.price, c.discountPrice))
  if (filters.price === 'free') list = list.filter((c) => eff(c) === 0)
  if (filters.price === 'paid') list = list.filter((c) => eff(c) > 0)
  if (filters.minPrice != null) list = list.filter((c) => eff(c) >= filters.minPrice!)
  if (filters.maxPrice != null) list = list.filter((c) => eff(c) <= filters.maxPrice!)
  if (filters.minRating != null)
    list = list.filter((c) => c.avgRating != null && c.avgRating >= filters.minRating!)

  const byTitle = (a: CourseRecord, b: CourseRecord) => a.title.localeCompare(b.title)
  const sorters: Record<string, (a: CourseRecord, b: CourseRecord) => number> = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt) || byTitle(a, b),
    'price-asc': (a, b) => eff(a) - eff(b) || byTitle(a, b),
    'price-desc': (a, b) => eff(b) - eff(a) || byTitle(a, b),
    rating: (a, b) =>
      (b.avgRating ?? -1) - (a.avgRating ?? -1) || b.reviewCount - a.reviewCount || byTitle(a, b),
    popular: (a, b) => b.studentCount - a.studentCount || byTitle(a, b),
  }
  list = [...list].sort(sorters[filters.sort ?? 'newest'] ?? sorters.newest)

  const pageSize = Math.min(Math.max(filters.pageSize ?? DEFAULT_PAGE_SIZE, 1), 50)
  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(filters.page ?? 1, 1), totalPages)
  const items = list.slice((page - 1) * pageSize, page * pageSize).map(toCard)
  return { items, total, page, pageSize, totalPages }
}

/** Distinct languages across visible courses (REQ-081). */
export async function getLanguages(): Promise<string[]> {
  const all = await getAllRecords()
  return Array.from(new Set(all.map((c) => c.language))).sort()
}

/** Exactly the featured+PUBLISHED courses ordered by featuredOrder (REQ-065). */
export const getFeaturedCourses = unstable_cache(
  async (limit = 6): Promise<CourseCardDTO[]> => {
    const rows = await db.course.findMany({
      where: { featured: true, status: 'PUBLISHED' },
      orderBy: { featuredOrder: 'asc' },
      take: limit,
      include: cardInclude,
    })
    const stats = await db.$queryRaw<StatRow[]>`SELECT * FROM "CourseStats"`
    const byId = new Map(stats.map((s) => [s.courseId, s]))
    return rows.map((c) => toCard(toRecord(c, byId.get(c.id))))
  },
  ['featured-courses'],
  { tags: ['courses'], revalidate: 3600 },
)

/** Live count of PUBLISHED courses only — UPCOMING are excluded (REQ-064). */
export const getPublishedCourseCount = unstable_cache(
  async (): Promise<number> => db.course.count({ where: { status: 'PUBLISHED' } }),
  ['published-course-count'],
  { tags: ['courses'], revalidate: 3600 },
)

export async function getCourseCardsByIds(ids: string[]): Promise<CourseCardDTO[]> {
  if (ids.length === 0) return []
  const all = await getAllRecords()
  const byId = new Map(all.map((c) => [c.id, c]))
  return ids.map((id) => byId.get(id)).filter((c): c is CourseRecord => !!c).map(toCard)
}

export async function getCompareCourses(ids: string[]): Promise<CompareCourseDTO[]> {
  const all = await getAllRecords()
  const byId = new Map(all.map((c) => [c.id, c]))
  return ids
    .map((id) => byId.get(id))
    .filter((c): c is CourseRecord => !!c)
    .map((r) => ({ ...toCard(r), categoryNames: r.categoryNames, topOutcomes: r.allOutcomes.slice(0, 5) }))
}

export async function getRelatedCourses(
  courseId: string,
  primaryCategorySlug: string | null,
  limit = 4,
): Promise<CourseCardDTO[]> {
  if (!primaryCategorySlug) return []
  const all = await getAllRecords()
  return all
    .filter(
      (c) => c.id !== courseId && c.status === 'PUBLISHED' && c.primaryCategorySlug === primaryCategorySlug,
    )
    .sort((a, b) => b.studentCount - a.studentCount || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map(toCard)
}

export async function getSearchSuggestions(q: string): Promise<SearchSuggestionsDTO> {
  const needle = q.trim().toLowerCase()
  if (needle.length < 2) return { courses: [], categories: [] }
  const all = await getAllRecords()
  const courses = all
    .filter((c) => c.title.toLowerCase().includes(needle))
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, 8)
    .map((c) => ({ slug: c.slug, title: c.title }))
  const tree = await getCategoryTree()
  const flat = tree.flatMap((c) => [c, ...c.children])
  const categories = flat
    .filter((c) => c.name.toLowerCase().includes(needle))
    .slice(0, 4)
    .map((c) => ({ slug: c.slug, name: c.name }))
  return { courses, categories }
}

export async function getInstructorStats(instructorId: string): Promise<{
  students: number
  reviews: number
  courses: number
  avgRating: number | null
}> {
  const [students, agg, courses] = await Promise.all([
    db.enrollment.findMany({
      where: { course: { instructorId, status: 'PUBLISHED' } },
      distinct: ['userId'],
      select: { userId: true },
    }),
    db.review.aggregate({
      where: { approved: true, course: { instructorId, status: 'PUBLISHED' } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    db.course.count({ where: { instructorId, status: 'PUBLISHED' } }),
  ])
  return {
    students: students.length,
    reviews: agg._count._all,
    courses,
    avgRating: agg._avg.rating ?? null,
  }
}

async function loadInstructor(instructorId: string): Promise<InstructorDTO | null> {
  const user = await db.user.findUnique({
    where: { id: instructorId },
    include: { instructorProfile: true },
  })
  if (!user) return null
  const stats = await getInstructorStats(instructorId)
  const p = user.instructorProfile
  return {
    id: user.id,
    name: user.name ?? 'Instructor',
    image: user.image,
    title: p?.title ?? null,
    bio: p?.bio ?? user.bio ?? null,
    linkedin: p?.socialLinkedIn ?? null,
    twitter: p?.socialTwitter ?? null,
    website: p?.socialWebsite ?? null,
    ...stats,
  }
}

export function getInstructor(id: string): Promise<InstructorDTO | null> {
  return unstable_cache(() => loadInstructor(id), ['instructor', id], {
    tags: ['courses', `instructor-${id}`],
    revalidate: 3600,
  })()
}

export async function getInstructorCourses(instructorId: string): Promise<CourseCardDTO[]> {
  const all = await getAllRecords()
  return all
    .filter((c) => c.instructorId === instructorId && c.status === 'PUBLISHED')
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.title.localeCompare(b.title))
    .map(toCard)
}

async function loadCourseDetail(slug: string): Promise<CourseDetailDTO | null> {
  const c = await db.course.findUnique({
    where: { slug },
    include: {
      ...cardInclude,
      sections: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  })
  if (!c || c.status === 'DRAFT') return null
  const [statsRows, instructor] = await Promise.all([
    db.$queryRaw<StatRow[]>`SELECT * FROM "CourseStats" WHERE "courseId" = ${c.id}`,
    loadInstructor(c.instructorId),
  ])
  const stats = statsRows[0]
  const record = toRecord(c, stats)
  if (!instructor) return null

  // REQ-181: video/file URLs are deliberately NOT part of this DTO.
  const sections: SectionDTO[] = c.sections.map((s) => ({
    id: s.id,
    title: s.title,
    order: s.order,
    lessons: s.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      durationSeconds: l.durationSeconds,
      isFreePreview: l.isFreePreview,
      order: l.order,
    })),
  }))

  return {
    ...toCard(record),
    description: c.description,
    requirements: c.requirements,
    allOutcomes: c.outcomes,
    sections,
    instructor,
    categories: c.categories.map((x) => ({
      id: x.categoryId,
      name: x.category.name,
      slug: x.category.slug,
      isPrimary: x.isPrimary,
    })),
    previewVideoUrl: c.previewVideoUrl,
    seoTitle: c.seoTitle,
    seoDescription: c.seoDescription,
    createdAt: c.createdAt.toISOString(),
  }
}

export function getCourseBySlug(slug: string): Promise<CourseDetailDTO | null> {
  return unstable_cache(() => loadCourseDetail(slug), ['course-detail', slug], {
    tags: ['courses', `course-${slug}`],
    revalidate: 3600,
  })()
}

/** For generateStaticParams: slugs of publicly visible courses. */
export async function getCourseSlugs(): Promise<string[]> {
  const all = await getAllRecords()
  return all.map((c) => c.slug)
}

/** Minimal lookup used by write paths (cart, orders) — fresh, uncached. */
export async function getCoursesForPurchase(ids: string[]) {
  return db.course.findMany({
    where: { id: { in: ids } },
    select: { id: true, slug: true, title: true, price: true, discountPrice: true, isFree: true, status: true },
  })
}
