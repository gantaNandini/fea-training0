import { PageHeader } from '@/components/admin/ui'
import { CourseEditor } from '@/components/admin/CourseEditor'
import { getFreshUser } from '@/lib/auth/guards'
import { getEditorLookups, emptyCourseState } from '@/lib/admin/course-editor-data'

export const metadata = { title: 'Add new course' }

export default async function NewCoursePage() {
  const [user, lookups] = await Promise.all([getFreshUser(), getEditorLookups()])
  return (
    <>
      <PageHeader title="Add new course" />
      <CourseEditor initial={emptyCourseState(user?.id ?? '')} {...lookups} />
    </>
  )
}
