import { getFeaturedCourses } from '@/lib/data/courses'
import { CourseCard } from '@/components/course/CourseCard'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { messages } from '@/lib/messages'

/** REQ-065: exactly the featured + PUBLISHED courses, ordered by featuredOrder; 3-column grid, 12 cards = 4 even rows. */
export async function TopCourses({ limit = 6 }: { limit?: number } = {}) {
  const courses = await getFeaturedCourses(limit)
  if (courses.length === 0) return null
  return (
    <section className="section-y" aria-labelledby="top-courses-heading">
      <div className="container-page">
        <SectionHeader
          id="top-courses-heading"
          title={messages.home.topCourses}
          subtitle={messages.home.topCoursesSub}
          linkHref="/courses"
          linkLabel={messages.common.viewAllCourses}
        />
        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0 sm:auto-rows-fr">
          {courses.map((c, i) => (
            <div key={c.id} className="reveal flex h-full">
              <div className="h-full w-full">
                <CourseCard course={c} priority={i < 3} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
