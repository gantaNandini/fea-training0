import { db } from '@/lib/db'
import { computeProgress } from '@/lib/utils/progress'
import type { CourseCardDTO, EnrolledCourseDTO, PlayerSectionDTO } from '@/lib/types'
import { getCourseCardsByIds } from './courses'

export async function isEnrolled(userId: string, courseId: string): Promise<boolean> {
  const e = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  })
  return !!e
}

export async function getEnrolledCourseIds(userId: string): Promise<string[]> {
  const rows = await db.enrollment.findMany({ where: { userId }, select: { courseId: true } })
  return rows.map((r) => r.courseId)
}

/** Completion for one course. No cache (per-user). */
export async function getCourseProgress(userId: string, courseId: string) {
  const lessons = await db.lesson.findMany({
    where: { section: { courseId } },
    select: { id: true },
  })
  const done = await db.lessonProgress.findMany({
    where: { userId, completed: true, lessonId: { in: lessons.map((l) => l.id) } },
    select: { lessonId: true },
  })
  return {
    totalLessons: lessons.length,
    completedLessonIds: done.map((d) => d.lessonId),
    percent: computeProgress(done.length, lessons.length),
  }
}

/** Orders lessons by section.order then lesson.order. */
async function orderedLessonIds(courseId: string): Promise<string[]> {
  const sections = await db.section.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: { lessons: { orderBy: { order: 'asc' }, select: { id: true } } },
  })
  return sections.flatMap((s) => s.lessons.map((l) => l.id))
}

/** REQ-171..173: enrolled courses with progress and the resume target. */
export async function getEnrolledCourses(userId: string): Promise<EnrolledCourseDTO[]> {
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: 'desc' },
  })
  if (enrollments.length === 0) return []

  const courseIds = enrollments.map((e) => e.courseId)

  // Fetch cards, all lessons (ordered), and all completion records in 3 parallel queries
  // instead of 3 queries × N enrollments (the old N+1 loop).
  const [cards, allSections, allDone] = await Promise.all([
    getCourseCardsByIds(courseIds),
    // All sections + ordered lessons for every enrolled course in one query
    db.section.findMany({
      where: { courseId: { in: courseIds } },
      orderBy: { order: 'asc' },
      select: {
        courseId: true,
        order: true,
        lessons: { orderBy: { order: 'asc' }, select: { id: true, order: true } },
      },
    }),
    // All completed lesson records for this user across all enrolled courses in one query
    db.lessonProgress.findMany({
      where: {
        userId,
        completed: true,
        lesson: { section: { courseId: { in: courseIds } } },
      },
      select: { lessonId: true },
    }),
  ])

  const cardById = new Map<string, CourseCardDTO>(cards.map((c) => [c.id, c]))

  // Build ordered lesson id list per course from the bulk result
  const orderedByCourse = new Map<string, string[]>()
  for (const section of allSections) {
    const list = orderedByCourse.get(section.courseId) ?? []
    for (const lesson of section.lessons) list.push(lesson.id)
    orderedByCourse.set(section.courseId, list)
  }

  // Build total lesson count per course
  const totalByCourse = new Map<string, number>()
  for (const [courseId, ids] of orderedByCourse) {
    totalByCourse.set(courseId, ids.length)
  }

  // Build completed lesson ids per course
  // We need lesson→courseId mapping — derive from allSections
  const lessonCourse = new Map<string, string>()
  for (const section of allSections) {
    for (const lesson of section.lessons) {
      lessonCourse.set(lesson.id, section.courseId)
    }
  }
  const doneByCourse = new Map<string, Set<string>>()
  for (const { lessonId } of allDone) {
    const courseId = lessonCourse.get(lessonId)
    if (!courseId) continue
    const set = doneByCourse.get(courseId) ?? new Set<string>()
    set.add(lessonId)
    doneByCourse.set(courseId, set)
  }

  const out: EnrolledCourseDTO[] = []
  for (const e of enrollments) {
    const course = cardById.get(e.courseId)
    if (!course) continue

    const ordered = orderedByCourse.get(e.courseId) ?? []
    const doneSet = doneByCourse.get(e.courseId) ?? new Set<string>()
    const totalLessons = totalByCourse.get(e.courseId) ?? 0
    const completedLessonIds = Array.from(doneSet)
    const percent = computeProgress(doneSet.size, totalLessons)

    let resume: string | null = null
    if (e.lastLessonId && ordered.includes(e.lastLessonId) && !doneSet.has(e.lastLessonId)) {
      resume = e.lastLessonId
    } else {
      resume = ordered.find((id) => !doneSet.has(id)) ?? ordered[0] ?? null
    }

    out.push({
      course,
      progressPercent: percent,
      completedLessons: completedLessonIds.length,
      totalLessons,
      resumeLessonId: resume,
      resumeLabel: completedLessonIds.length === 0 && !e.lastLessonId ? 'start' : 'resume',
    })
  }
  return out
}

/**
 * Upserts LessonProgress (REQ-184). Returns null when the user is not enrolled in the lesson's
 * course — callers answer 403.
 */
export async function setLessonProgress(
  userId: string,
  lessonId: string,
  completed: boolean,
): Promise<{ courseId: string; percent: number; completedLessonIds: string[] } | null> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, section: { select: { courseId: true } } },
  })
  if (!lesson) return null
  const courseId = lesson.section.courseId
  if (!(await isEnrolled(userId, courseId))) return null

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, completed, completedAt: completed ? new Date() : null },
    update: { completed, completedAt: completed ? new Date() : null },
  })
  await db.enrollment.update({
    where: { userId_courseId: { userId, courseId } },
    data: { lastLessonId: lessonId, lastAccessedAt: new Date() },
  })
  const progress = await getCourseProgress(userId, courseId)
  return { courseId, percent: progress.percent, completedLessonIds: progress.completedLessonIds }
}

export async function touchEnrollment(userId: string, courseId: string, lessonId: string) {
  await db.enrollment.update({
    where: { userId_courseId: { userId, courseId } },
    data: { lastLessonId: lessonId, lastAccessedAt: new Date() },
  })
}

/** Server-side lesson lookup for the player and the signed-URL API. Raw URLs stay on the server. */
export async function getLessonAccess(userId: string, courseSlug: string, lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { include: { course: { select: { id: true, slug: true, status: true } } } } },
  })
  if (!lesson || lesson.section.course.slug !== courseSlug) return null
  const courseId = lesson.section.course.id
  const enrolled = await isEnrolled(userId, courseId)
  return {
    lessonId: lesson.id,
    courseId,
    type: lesson.type,
    videoUrl: lesson.videoUrl,
    fileUrl: lesson.fileUrl,
    isFreePreview: lesson.isFreePreview,
    enrolled,
    allowed: enrolled || lesson.isFreePreview,
  }
}

export async function getPlayerData(userId: string, courseSlug: string, lessonId: string) {
  const course = await db.course.findUnique({
    where: { slug: courseSlug },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  })
  if (!course || course.status === 'DRAFT') return null
  const enrolled = await isEnrolled(userId, course.id)
  if (!enrolled) return { enrolled: false as const, courseSlug }
  const progress = await getCourseProgress(userId, course.id)
  const done = new Set(progress.completedLessonIds)
  const sections: PlayerSectionDTO[] = course.sections.map((s) => ({
    id: s.id,
    title: s.title,
    lessons: s.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      durationSeconds: l.durationSeconds,
      isFreePreview: l.isFreePreview,
      completed: done.has(l.id),
      locked: false,
    })),
  }))
  const flat = sections.flatMap((s) => s.lessons)
  const index = flat.findIndex((l) => l.id === lessonId)
  if (index === -1) return { enrolled: true as const, missingLesson: true as const, courseSlug, flat }
  return {
    enrolled: true as const,
    missingLesson: false as const,
    course: { id: course.id, slug: course.slug, title: course.title },
    sections,
    lesson: flat[index],
    prevId: index > 0 ? flat[index - 1].id : null,
    nextId: index < flat.length - 1 ? flat[index + 1].id : null,
    percent: progress.percent,
  }
}

export async function enrollFree(userId: string, courseId: string) {
  await db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId },
    update: {},
  })
}

export async function getFirstLessonId(courseId: string): Promise<string | null> {
  return (await orderedLessonIds(courseId))[0] ?? null
}
