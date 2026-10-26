import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import type { PageDTO } from '@/lib/types'

/** Static pages from the `Page` table (REQ-200). Tag: `page-{slug}`. */
export function getPage(slug: string): Promise<PageDTO | null> {
  return unstable_cache(
    async () => {
      const p = await db.page.findUnique({ where: { slug } })
      return p ? { slug: p.slug, title: p.title, body: p.body } : null
    },
    ['page', slug],
    { tags: [`page-${slug}`], revalidate: 3600 },
  )()
}
