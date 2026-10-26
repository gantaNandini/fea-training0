import { describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { getLessonAccess } from '@/lib/data/progress'
import { makeCourse, makeUser } from './factories'

/**
 * REQ-181 at the data layer (the route turns allowed=false into 403 and no session into 401; the
 * 401 path is covered by the e2e suite). Raw video/file URLs never reach the client.
 */
describe('lesson access rules', () => {
  async function fixture() {
    const teacher = await makeUser({ role: 'INSTRUCTOR' })
    const course = await makeCourse({ instructorId: teacher.id, lessons: [60, 60] })
    const lessons = await db.lesson.findMany({ where: { section: { courseId: course.id } }, orderBy: { order: 'asc' } })
    return { course, preview: lessons[0], paid: lessons[1] }
  }

  it('non-enrolled user is blocked from a non-preview lesson', async () => {
    const { course, paid } = await fixture()
    const user = await makeUser()
    const a = await getLessonAccess(user.id, course.slug, paid.id)
    expect(a?.allowed).toBe(false)
  })

  it('free-preview lessons are allowed without enrolment', async () => {
    const { course, preview } = await fixture()
    const user = await makeUser()
    expect((await getLessonAccess(user.id, course.slug, preview.id))?.allowed).toBe(true)
  })

  it('enrolled user can open any lesson', async () => {
    const { course, paid } = await fixture()
    const user = await makeUser()
    await db.enrollment.create({ data: { userId: user.id, courseId: course.id } })
    expect((await getLessonAccess(user.id, course.slug, paid.id))?.allowed).toBe(true)
  })

  it('a lesson under a different course slug is not found', async () => {
    const { paid } = await fixture()
    const user = await makeUser()
    expect(await getLessonAccess(user.id, 'wrong-slug', paid.id)).toBeNull()
  })
})
