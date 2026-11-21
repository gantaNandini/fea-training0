/**
 * Creates (or repairs) the "API 579-1 / ASME FFS-1 – Part 9" course skeleton. Safe to re-run.
 *   pnpm exec tsx scripts/seed-part9-course.ts            # dry run
 *   pnpm exec tsx scripts/seed-part9-course.ts --apply     # write
 * New course starts as DRAFT so the home page keeps its 12 cards until published in Admin.
 */
import { PrismaClient } from '@prisma/client'
import { PART9, sectionDescription } from './part9-spec'

const db = new PrismaClient()

/**
 * Placeholder fields for required Course columns. These are neutral values that the
 * admin will replace when publishing:
 *   price: 0 (free placeholder)
 *   level: ADVANCED
 *   language: English
 *   shortDescription / description: neutral text
 *   isFree: false
 *   status: DRAFT
 */
function courseFields(instructorId: string) {
  return {
    title: PART9.courseTitle,
    subtitle: 'Crack-Like Flaws — Flaw Characterization, Interaction and Re-Categorization',
    shortDescription:
      'A detailed study of API 579-1 / ASME FFS-1 Part 9: crack-like flaw characterization, branched cracks, multiple flaws, alignment, combination and re-categorization criteria.',
    description: sectionDescription(),
    level: 'ADVANCED' as const,
    language: 'English',
    price: 0,
    discountPrice: null,
    isFree: false,
    thumbnail: null,
    previewVideoUrl: null,
    status: 'DRAFT' as const,
    featured: false,
    featuredOrder: null,
    instructorId,
    requirements: [
      'B.E / B.Tech in Mechanical, Civil or related streams',
      'Familiarity with fracture mechanics and FEA',
    ],
    outcomes: [
      'Characterize crack-like flaws per API 579-1 Part 9',
      'Assess branched and multiple flaws',
      'Apply alignment and combination criteria',
      'Re-categorize flaws for Level 2 assessment',
    ],
    tags: ['api-579', 'asme-ffs', 'part-9', 'crack-like-flaws'],
    eligibility: [
      'B.E / B.Tech in Mechanical, Civil or related streams',
      'Familiarity with fracture mechanics and FEA',
    ],
    syllabusUrl: null,
    durationHours: null,
    seoTitle: null,
    seoDescription: null,
  }
}

export async function seedPart9(apply: boolean) {
  const log = (msg: string) => console.log(`${apply ? '' : '[DRY] '}${msg}`)

  let course = await db.course.findUnique({ where: { slug: PART9.courseSlug } })
  if (!course) {
    // Find an instructor (User with role INSTRUCTOR who has an InstructorProfile)
    const instructor = await db.user.findFirst({
      where: { role: 'INSTRUCTOR' },
      select: { id: true, name: true },
    })
    if (!instructor) throw new Error('No instructor found — create a user with role INSTRUCTOR in Admin first')
    log(`CREATE course "${PART9.courseTitle}" (slug=${PART9.courseSlug}, instructor=${instructor.name})`)
    if (apply) {
      course = await db.course.create({ data: { slug: PART9.courseSlug, ...courseFields(instructor.id) } })
    }
  } else {
    log(`exists: course ${PART9.courseSlug} (status=${course.status})`)
  }

  let section = course
    ? await db.section.findFirst({ where: { courseId: course.id, title: PART9.sectionTitle } })
    : null
  if (!section) {
    log(`CREATE section "${PART9.sectionTitle}"`)
    if (apply && course) {
      const last = await db.section.findFirst({
        where: { courseId: course.id },
        orderBy: { order: 'desc' },
      })
      section = await db.section.create({
        data: {
          courseId: course.id,
          title: PART9.sectionTitle,
          order: (last?.order ?? 0) + 1,
        },
      })
    }
  } else {
    log('exists: section')
  }

  for (const [i, l] of PART9.lessons.entries()) {
    const found = section
      ? await db.lesson.findFirst({ where: { sectionId: section.id, title: l.title } })
      : null
    if (found) {
      const needDuration = l.durationSeconds > 0 && found.durationSeconds === 0
      if (found.order !== i + 1 || found.type !== l.type || needDuration) {
        log(`FIX   ${l.title} (order/type/duration)`)
        if (apply) {
          await db.lesson.update({
            where: { id: found.id },
            data: {
              order: i + 1,
              type: l.type,
              ...(needDuration ? { durationSeconds: l.durationSeconds } : {}),
            },
          })
        }
      } else {
        log(`exists: ${l.title}`)
      }
      continue
    }
    log(`CREATE ${l.type.padEnd(8)} ${i + 1}. ${l.title}`)
    if (apply && section) {
      await db.lesson.create({
        data: {
          sectionId: section.id,
          title: l.title,
          type: l.type,
          order: i + 1,
          durationSeconds: l.durationSeconds,
          isFreePreview: false,
        },
      })
    }
  }
}

if (process.argv[1]?.endsWith('seed-part9-course.ts')) {
  const apply = process.argv.includes('--apply')
  seedPart9(apply)
    .then(() => console.log(apply ? '\nDone.' : '\nDry run only — add --apply to write.'))
    .finally(() => db.$disconnect())
}
