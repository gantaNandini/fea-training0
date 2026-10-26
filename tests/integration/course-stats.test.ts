import { describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { makeCourse, makeUser } from './factories'

type Stats = { lessonCount: number; totalSeconds: number; avgRating: number | null; reviewCount: number; studentCount: number }
const stats = async (courseId: string) =>
  (await db.$queryRaw<Stats[]>`SELECT * FROM "CourseStats" WHERE "courseId" = ${courseId}`)[0]

describe('CourseStats view (REQ-322)', () => {
  it('computes exact counts without row multiplication', async () => {
    const teacher = await makeUser({ role: 'INSTRUCTOR' })
    const durations = [60, 120, 180, 240, 300, 360, 420, 480, 540, 600]
    const course = await makeCourse({ instructorId: teacher.id, lessons: durations })
    const students = await Promise.all([makeUser(), makeUser(), makeUser(), makeUser()])
    for (const s of students) await db.enrollment.create({ data: { userId: s.id, courseId: course.id } })
    await db.review.createMany({
      data: [
        { userId: students[0].id, courseId: course.id, rating: 5, comment: 'great course here', approved: true },
        { userId: students[1].id, courseId: course.id, rating: 4, comment: 'good course here', approved: true },
        { userId: students[2].id, courseId: course.id, rating: 3, comment: 'ok course here', approved: true },
        { userId: students[3].id, courseId: course.id, rating: 1, comment: 'not approved yet', approved: false },
      ],
    })
    const s = await stats(course.id)
    expect(s.lessonCount).toBe(10)
    expect(s.totalSeconds).toBe(durations.reduce((a, b) => a + b, 0))
    expect(s.reviewCount).toBe(3)
    expect(s.avgRating).toBeCloseTo(4, 5) // (5+4+3)/3, unapproved ignored
    expect(s.studentCount).toBe(4)
  })

  it('avgRating is NULL when there are no approved reviews', async () => {
    const teacher = await makeUser({ role: 'INSTRUCTOR' })
    const course = await makeCourse({ instructorId: teacher.id, lessons: [60] })
    const s = await stats(course.id)
    expect(s.avgRating).toBeNull()
    expect(s.reviewCount).toBe(0)
  })

  it('a course with no sections reports zero lessons', async () => {
    const teacher = await makeUser({ role: 'INSTRUCTOR' })
    const course = await makeCourse({ instructorId: teacher.id, status: 'UPCOMING' })
    const s = await stats(course.id)
    expect(s.lessonCount).toBe(0)
    expect(s.totalSeconds).toBe(0)
  })
})
