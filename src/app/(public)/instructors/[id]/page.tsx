import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CourseCard } from '@/components/course/CourseCard'
import { InstructorCard } from '@/components/course/InstructorCard'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getInstructor, getInstructorCourses } from '@/lib/data/courses'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const i = await getInstructor(id)
  if (!i) return { title: messages.errors.notFoundTitle }
  return buildMetadata({
    title: i.name,
    description: i.bio?.slice(0, 155) ?? `Courses taught by ${i.name}.`,
    path: `/instructors/${id}`,
  })
}

export default async function InstructorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const instructor = await getInstructor(id)
  if (!instructor) notFound()
  const courses = await getInstructorCourses(id)
  return (
    <div className="container-page py-10 md:py-14">
      <Breadcrumb items={[{ label: messages.nav.home, href: '/' }, { label: messages.nav.courses, href: '/courses' }, { label: instructor.name }]} />
      <div className="mt-6">
        <InstructorCard instructor={instructor} link={false} />
      </div>
      <h2 className="mb-6 mt-12 text-2xl">Courses by {instructor.name}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </div>
  )
}
