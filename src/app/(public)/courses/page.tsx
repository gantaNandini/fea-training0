import type { Metadata } from 'next'
import { getCourses, getLanguages } from '@/lib/data/courses'
import { getCategoryBySlug, getCategoryTree } from '@/lib/data/categories'
import { parseCatalogueParams, toQueryString, type RawParams } from '@/lib/utils/catalogue-params'
import { CourseCard } from '@/components/course/CourseCard'
import { FilterSidebar } from '@/components/course/FilterSidebar'
import { CourseSortBar } from '@/components/course/CourseSortBar'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { ButtonLink } from '@/components/ui/button'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'
import { cn } from '@/lib/utils/cn'

type Props = { searchParams: Promise<RawParams> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const state = parseCatalogueParams(await searchParams)
  const cat = state.category ? await getCategoryBySlug(state.category) : null
  const title = cat ? `${cat.name} courses` : messages.catalogue.title
  return buildMetadata({
    title,
    description: `${messages.catalogue.subtitle}. Browse ${cat ? cat.name.toLowerCase() : 'all'} engineering courses.`,
    path: '/courses',
    noIndex: Object.keys(await searchParams).some((k) => k !== 'category' && k !== 'page') || undefined,
  })
}

export default async function CataloguePage({ searchParams }: Props) {
  const state = parseCatalogueParams(await searchParams)
  const [result, categories, languages, category] = await Promise.all([
    getCourses({ ...state, pageSize: 12 }),
    getCategoryTree(),
    getLanguages(),
    state.category ? getCategoryBySlug(state.category) : Promise.resolve(null),
  ])
  const visibleCategories = categories.filter((c) => c.courseCount > 0)
  const href = (page: number) => `/courses${toQueryString({ ...state, page })}`

  return (
    <div className="container-page py-8 md:py-12">
      <Breadcrumb
        items={[
          { label: messages.course.breadcrumbHome, href: '/' },
          { label: messages.nav.courses, href: category ? '/courses' : undefined },
          ...(category ? [{ label: category.name }] : []),
        ]}
      />
      <div className="mb-8 mt-4">
        <h1>{category ? category.name : messages.catalogue.title}</h1>
        <p className="mt-2 text-muted-foreground">{messages.catalogue.subtitle}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
        <FilterSidebar categories={visibleCategories} languages={languages} state={state} />
        <div>
          <CourseSortBar total={result.total} state={state} />
          <div className="mt-6">
            {result.items.length === 0 ? (
              <EmptyState
                title={messages.catalogue.emptyTitle}
                body={messages.catalogue.emptyBody}
                action={<ButtonLink href="/courses">{messages.catalogue.clearFilters}</ButtonLink>}
              />
            ) : (
              <div
                className={cn(
                  'grid gap-6',
                  state.view === 'list' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
                )}
              >
                {result.items.map((c, i) => (
                  <CourseCard key={c.id} course={c} layout={state.view} priority={i < 3} />
                ))}
              </div>
            )}
          </div>
          <Pagination page={result.page} totalPages={result.totalPages} hrefFor={href} />
        </div>
      </div>
    </div>
  )
}
