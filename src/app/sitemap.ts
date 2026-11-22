import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { SITE_URL } from '@/lib/utils/seo'

export const revalidate = 3600

const STATIC_PAGES = [
  '/',
  '/courses',
  '/upcoming-courses',
  '/events',
  '/consultancy',
  '/corporate-training',
  '/featured-programme',
  '/instructors',
  '/about',
  '/contact',
  '/fees',
  '/privacy-policy',
  '/refund-policy',
  '/terms',
  '/cookie-policy',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: path === '/' ? 1 : 0.8,
  }))

  try {
    const courses = await db.course.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    })
    for (const c of courses) {
      entries.push({
        url: `${SITE_URL}/courses/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })
    }
  } catch {
    // Database unreachable during build — return static pages only.
  }

  return entries
}
