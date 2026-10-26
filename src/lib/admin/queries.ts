import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { DEFAULT_INSTRUCTOR_PERCENT } from './settings-def'

export async function getInstructorPercent(): Promise<number> {
  const s = await db.siteSetting.findUnique({ where: { key: 'instructor_revenue_percent' } })
  const n = Number(s?.value)
  return Number.isFinite(n) && s?.value !== '' && n >= 0 && n <= 100 ? n : DEFAULT_INSTRUCTOR_PERCENT
}

/** yyyy-mm-dd query params → inclusive local range; defaults to the current month. */
export function parseRange(from?: string, to?: string) {
  const now = new Date()
  const parse = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`) : null)
  const start = parse(from) ?? new Date(now.getFullYear(), now.getMonth(), 1)
  const endDay = parse(to) ?? new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const end = new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate() + 1)
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start, end, fromStr: iso(start), toStr: iso(endDay) }
}

export async function getDashboard() {
  const year = new Date().getFullYear()
  const yearStart = new Date(year, 0, 1)
  const monthStart = new Date(year, new Date().getMonth(), 1)
  const percent = await getInstructorPercent()

  const [monthly, totals, monthTotals, courses, published, students, instructors, enrolments, unread, recent, top] = await Promise.all([
    db.$queryRaw<{ m: number; total: bigint }[]>(Prisma.sql`
      SELECT EXTRACT(MONTH FROM "createdAt")::int AS m, COALESCE(SUM("total"),0)::bigint AS total
      FROM "Order" WHERE "status" = 'COMPLETED' AND "createdAt" >= ${yearStart}
      GROUP BY 1 ORDER BY 1`),
    db.order.aggregate({ where: { status: 'COMPLETED' }, _sum: { total: true }, _count: true }),
    db.order.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: monthStart } }, _sum: { total: true }, _count: true }),
    db.course.count(),
    db.course.count({ where: { status: 'PUBLISHED' } }),
    db.user.count({ where: { role: 'STUDENT' } }),
    db.user.count({ where: { role: 'INSTRUCTOR' } }),
    db.enrollment.count(),
    db.contactMessage.count({ where: { read: false } }),
    db.enrollment.findMany({
      orderBy: { enrolledAt: 'desc' },
      take: 6,
      include: { user: { select: { name: true, email: true } }, course: { select: { title: true } } },
    }),
    db.$queryRaw<{ id: string; title: string; students: number }[]>(Prisma.sql`
      SELECT c."id", c."title", COUNT(e."id")::int AS students
      FROM "Course" c LEFT JOIN "Enrollment" e ON e."courseId" = c."id"
      GROUP BY c."id" ORDER BY students DESC, c."title" LIMIT 5`),
  ])

  const byMonth = Array.from({ length: 12 }, (_, i) => Number(monthly.find((r) => r.m === i + 1)?.total ?? 0))
  return {
    percent,
    year,
    byMonth,
    revenueTotal: totals._sum.total ?? 0,
    orderCount: totals._count,
    revenueMonth: monthTotals._sum.total ?? 0,
    orderCountMonth: monthTotals._count,
    courses,
    published,
    students,
    instructors,
    enrolments,
    unread,
    recent,
    top,
  }
}

export async function getRevenueRows(from?: string, to?: string) {
  const { start, end, fromStr, toStr } = parseRange(from, to)
  const percent = await getInstructorPercent()
  const items = await db.orderItem.findMany({
    where: { order: { status: 'COMPLETED', createdAt: { gte: start, lt: end } } },
    include: {
      order: { select: { createdAt: true } },
      course: { select: { title: true, instructor: { select: { id: true, name: true } } } },
    },
    orderBy: { order: { createdAt: 'desc' } },
    take: 2000,
  })
  return { percent, fromStr, toStr, items }
}

export async function getEnrolments(from?: string, to?: string) {
  const { start, end, fromStr, toStr } = parseRange(from, to)
  const rows = await db.enrollment.findMany({
    where: { enrolledAt: { gte: start, lt: end } },
    orderBy: { enrolledAt: 'desc' },
    take: 2000,
    include: { user: { select: { id: true, name: true, email: true, image: true } }, course: { select: { title: true, slug: true } } },
  })
  return { fromStr, toStr, rows }
}
