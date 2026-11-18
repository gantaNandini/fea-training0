import { getAllPublishedCourses } from '@/lib/data/courses'
import { CourseCard } from '@/components/course/CourseCard'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { messages } from '@/lib/messages'

/**
 * R4: all PUBLISHED courses (not UPCOMING) in a responsive grid.
 * 1 col (phone) → 2 (tablet) → 3 (laptop) → 4 (≥1280 px, 3 rows of 4).
 * Uses data-testid="home-courses" on the section and "home-course-card" on each card wrapper
 * for the verify-live.mjs checker.
 */
export async function TopCourses() {
  const courses = await getAllPublishedCourses()
  if (courses.length === 0) return null
  return (
    <section className="section-y" aria-labelledby="top-courses-heading" data-testid="home-courses">
      <div className="container-page">
        <SectionHeader
          id="top-courses-heading"
          title={messages.home.topCourses}
          subtitle={messages.home.topCoursesSub}
          linkHref="/courses"
          linkLabel={messages.common.viewAllCourses}
        />
        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0 sm:auto-rows-fr">
          {courses.map((c, i) => (
            <div key={c.id} className="reveal flex h-full" data-testid="home-course-card">
              <div className="h-full w-full">
                <CourseCard course={c} priority={i < 4} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
