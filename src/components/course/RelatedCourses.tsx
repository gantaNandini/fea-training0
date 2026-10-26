import type { CourseCardDTO } from '@/lib/types'
import { CourseCard } from './CourseCard'
import { messages } from '@/lib/messages'

/** Up to 4 from the same primary category, excluding the current course (REQ-095). */
export function RelatedCourses({ courses }: { courses: CourseCardDTO[] }) {
  if (courses.length === 0) return null
  return (
    <section className="section-y bg-surface-alt" aria-labelledby="related-heading">
      <div className="container-page">
        <h2 id="related-heading" className="mb-8">{messages.course.related}</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </div>
    </section>
  )
}
