import type { CategoryDTO } from '@/lib/types'
import Link from 'next/link'
import { getCategoriesWithCourses } from '@/lib/data/categories'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { CategoryIcon } from './CategoryIcon'
import { messages } from '@/lib/messages'

/** REQ-069: parents with >= 1 PUBLISHED/UPCOMING course; counts are computed. */
export async function BrowseCategories({ categories }: { categories?: CategoryDTO[] }) {
  const list = categories ?? await getCategoriesWithCourses()
  if (list.length === 0) return null
  return (
    <section className="section-y bg-surface-alt" aria-labelledby="categories-heading">
      <div className="container-page">
        <SectionHeader
          id="categories-heading"
          title={messages.home.browseByCategory}
          subtitle={messages.home.browseByCategorySub}
        />
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((c) => (
            <li key={c.id}>
              <Link
                href={`/courses?category=${c.slug}`}
                data-testid="category-tile"
                className="card-lift flex h-full min-h-28 items-center gap-4 rounded-xl border border-border bg-card p-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-plum-50 text-plum-700 dark:bg-plum-900 dark:text-plum-200">
                  <CategoryIcon name={c.icon} className="h-6 w-6" />
                </span>
                <span>
                  <span className="block font-display font-bold leading-snug">{c.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {c.courseCount} {c.courseCount === 1 ? messages.home.oneCourse : messages.home.courseCount}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
