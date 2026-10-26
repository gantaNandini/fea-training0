import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCourseBySlug, getCourseSlugs, getRelatedCourses } from '@/lib/data/courses'
import { getApprovedReviews, getRatingBreakdown } from '@/lib/data/reviews'
import { getSettings } from '@/lib/data/settings'
import { sanitizeRichText } from '@/lib/utils/sanitize'
import { buildMetadata, absoluteUrl } from '@/lib/utils/seo'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { StarRating } from '@/components/shared/StarRating'
import { Badge } from '@/components/ui/badge'
import { CurriculumAccordion } from '@/components/course/CurriculumAccordion'
import { ExpandableHtml, OutcomesList, RequirementsList } from '@/components/course/ExpandableList'
import { InstructorCard } from '@/components/course/InstructorCard'
import { MobilePurchaseBar } from '@/components/course/MobilePurchaseBar'
import { PurchaseCard } from '@/components/course/PurchaseCard'
import { RelatedCourses } from '@/components/course/RelatedCourses'
import { ReviewsSection } from '@/components/course/ReviewsSection'
import { effectivePrice, formatHours } from '@/lib/utils/pricing'
import { isPlaceholder } from '@/lib/placeholder'
import { messages } from '@/lib/messages'

// ISR; the page never reads cookies or the session (REQ-270). Per-user state is client-side.
export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    return (await getCourseSlugs()).map((slug) => ({ slug }))
  } catch {
    return [] // DB not reachable at build time: render on demand
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const course = await getCourseBySlug(slug)
  if (!course) return { title: messages.errors.notFoundTitle }
  const image = course.thumbnail && !isPlaceholder(course.thumbnail) ? course.thumbnail : undefined
  return buildMetadata({
    title: course.seoTitle ?? course.title,
    description: course.seoDescription ?? course.shortDescription,
    path: `/courses/${course.slug}`,
    image,
  })
}

const levelLabel = {
  BEGINNER: messages.course.levelBeginner,
  INTERMEDIATE: messages.course.levelIntermediate,
  ADVANCED: messages.course.levelAdvanced,
} as const

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params
  const course = await getCourseBySlug(slug)
  if (!course) notFound()

  const [related, breakdown, reviews, settings] = await Promise.all([
    getRelatedCourses(course.id, course.primaryCategorySlug),
    getRatingBreakdown(course.id, course.slug),
    getApprovedReviews(course.id, course.slug, 1),
    getSettings(),
  ])

  const html = sanitizeRichText(course.description)
  const wordCount = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
  const updated = new Date(course.updatedAt).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.shortDescription,
    provider: { '@type': 'Organization', name: settings.company_name ?? 'PYTHAGORAS', sameAs: absoluteUrl('/') },
    offers: {
      '@type': 'Offer',
      price: (effectivePrice(course.price, course.discountPrice) / 100).toFixed(2),
      priceCurrency: 'INR',
      availability: course.status === 'PUBLISHED' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      url: absoluteUrl(`/courses/${course.slug}`),
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: course.totalSeconds > 0 ? `PT${Math.round(course.totalSeconds / 60)}M` : undefined,
    },
    ...(course.avgRating != null && course.reviewCount > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: course.avgRating.toFixed(1), reviewCount: course.reviewCount } }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="border-b border-border bg-surface-alt">
        <div className="container-page py-8 md:py-10">
          <Breadcrumb
            items={[
              { label: messages.course.breadcrumbHome, href: '/' },
              { label: messages.nav.courses, href: '/courses' },
              ...(course.primaryCategoryName && course.primaryCategorySlug
                ? [{ label: course.primaryCategoryName, href: `/courses?category=${course.primaryCategorySlug}` }]
                : []),
              { label: course.title },
            ]}
          />
          <div className="mt-5 max-w-3xl lg:max-w-[calc(100%-24rem)]">
            <h1 data-testid="course-title">{course.title}</h1>
            {course.subtitle ? <p className="mt-3 text-lg text-muted-foreground">{course.subtitle}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <Badge tone="plum">{levelLabel[course.level]}</Badge>
              {course.status === 'UPCOMING' ? <Badge tone="warning">{messages.course.comingSoon}</Badge> : null}
              <StarRating value={course.avgRating} count={course.reviewCount} size="md" />
              {course.studentCount >= 1 ? (
                <span>
                  {course.studentCount.toLocaleString('en-IN')}{' '}
                  {course.studentCount === 1 ? messages.course.student : messages.course.students}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {messages.course.createdBy}{' '}
              <Link href={`/instructors/${course.instructor.id}`} className="font-semibold text-link underline-offset-4 hover:underline">
                {course.instructor.name}
              </Link>{' '}
              · {messages.course.lastUpdated} {updated} · {course.language}
              {course.lessonCount > 0 ? ` · ${course.lessonCount} ${messages.course.lessons} · ${formatHours(course.totalSeconds)}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-10 py-10 pb-28 lg:grid-cols-[1fr_22rem] lg:pb-10">
        <div className="min-w-0 space-y-12">
          {course.allOutcomes.length > 0 ? (
            <section aria-labelledby="outcomes-heading" className="rounded-xl border border-border p-6">
              <h2 id="outcomes-heading" className="mb-4 text-2xl">{messages.course.whatYouLearn}</h2>
              <OutcomesList items={course.allOutcomes} />
            </section>
          ) : null}

          <section aria-labelledby="curriculum-heading">
            <h2 id="curriculum-heading" className="mb-4 text-2xl">{messages.course.curriculum}</h2>
            <CurriculumAccordion slug={course.slug} sections={course.sections} />
          </section>

          {course.requirements.length > 0 ? (
            <section aria-labelledby="requirements-heading">
              <h2 id="requirements-heading" className="mb-4 text-2xl">{messages.course.requirements}</h2>
              <RequirementsList items={course.requirements} />
            </section>
          ) : null}

          <section aria-labelledby="description-heading">
            <h2 id="description-heading" className="mb-4 text-2xl">{messages.course.description}</h2>
            <ExpandableHtml html={html} wordCount={wordCount} />
          </section>

          <section aria-labelledby="instructor-heading">
            <h2 id="instructor-heading" className="mb-4 text-2xl">{messages.course.instructor}</h2>
            <InstructorCard instructor={course.instructor} />
          </section>

          <section aria-labelledby="feedback-heading">
            <h2 id="feedback-heading" className="mb-4 text-2xl">{messages.course.feedback}</h2>
            <ReviewsSection courseId={course.id} slug={course.slug} breakdown={breakdown} initial={reviews} />
          </section>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <PurchaseCard course={course} />
          </div>
        </div>
      </div>

      <RelatedCourses courses={related} />
      <MobilePurchaseBar course={course} />
    </>
  )
}
