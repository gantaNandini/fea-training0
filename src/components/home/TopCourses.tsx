import type { CourseCardDTO } from '@/lib/types'
import { getFeaturedCourses } from '@/lib/data/courses'
import { CourseCard } from '@/components/course/CourseCard'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { messages } from '@/lib/messages'

/** REQ-065: exactly the featured + PUBLISHED courses, ordered by featuredOrder; 3x2 grid. */
export async function TopCourses({ courses }: { courses?: CourseCardDTO[] }) {
  const all = courses ?? await getFeaturedCourses()
  const list = all.slice(0, 6)
  if (list.length === 0) return null
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </div>
    </section>
  )
}
