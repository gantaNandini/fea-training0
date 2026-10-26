import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/admin/ui'
import { CourseEditor } from '@/components/admin/CourseEditor'
import { getEditorLookups, loadCourseState } from '@/lib/admin/course-editor-data'

export const metadata = { title: 'Edit course' }

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [state, lookups] = await Promise.all([loadCourseState(id), getEditorLookups()])
  if (!state) notFound()
  return (
    <>
      <PageHeader title={`Edit course: ${state.title}`} />
      <CourseEditor key={state.id} initial={state} {...lookups} />
    </>
  )
}
