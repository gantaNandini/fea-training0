/**
 * Imports the courses of the OLD site (www.fea-training.com) into this LMS with the exact text.
 *
 *   pnpm tsx scripts/import-fea-courses.ts path/to/fea-courses-full.json            # dry run (default)
 *   pnpm tsx scripts/import-fea-courses.ts path/to/fea-courses-full.json --apply    # write to the database
 *
 * - Matches each old course to an existing course by title (exact, then "contains"), otherwise creates it.
 * - Overwrites title, subtitle, descriptions, outcomes, requirements, eligibility, duration, syllabus link.
 * - Never overwrites price/discount of an existing course unless the JSON has a price.
 * - Curriculum: section and lesson NAMES are created as empty slots (placeholder video/document).
 *   Upload the real videos/PDFs later in Admin → Courses → Edit → Curriculum. A course that already
 *   has real uploaded lessons is left untouched.
 * - New courses are created as DRAFT when no price is known, so nothing goes live by accident.
 *
 * The importer is deliberately tolerant about key names (title|name|course_name, ...). If your JSON uses
 * other names, it prints the keys it found so they can be added to the `pick` lists below.
 */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- standalone CLI script
import { PrismaClient, type CourseLevel, type LessonType } from '@prisma/client'
import fs from 'node:fs'

const db = new PrismaClient()

type Obj = Record<string, unknown>
const pick = (o: Obj, keys: string[]): unknown => {
  for (const k of keys) if (o[k] != null && o[k] !== '') return o[k]
  return undefined
}
const str = (v: unknown): string => (v == null ? '' : String(v).trim())
const num = (v: unknown): number | null => {
  const n = Number(String(v ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}
const list = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(str).filter(Boolean)
  return str(v)
    .split(/\r?\n|<br\s*\/?>|•|;/)
    .map((x) => x.replace(/<[^>]*>/g, '').trim())
    .filter(Boolean)
}
const html = (s: string) => (/<[a-z][\s\S]*>/i.test(s) ? s : s.split(/\n{2,}/).map((p) => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join(''))
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const slugify = (s: string) => norm(s).replace(/ /g, '-').slice(0, 100)

interface OldLesson { title: string; type: LessonType }
interface OldSection { title: string; lessons: OldLesson[] }

function sectionsOf(c: Obj): OldSection[] {
  const raw = pick(c, ['curriculum', 'sections', 'modules', 'chapters']) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map((s, i) => {
    const o = (typeof s === 'string' ? { title: s } : s) as Obj
    const ls = (pick(o, ['lessons', 'topics', 'items', 'lectures', 'contents']) as unknown[]) ?? []
    return {
      title: str(pick(o, ['title', 'name', 'section_title', 'section'])) || `Section ${i + 1}`,
      lessons: (Array.isArray(ls) ? ls : []).map((l, j) => {
        const lo = (typeof l === 'string' ? { title: l } : l) as Obj
        const t = str(pick(lo, ['type', 'lesson_type', 'lesson_provider'])).toLowerCase()
        return {
          title: str(pick(lo, ['title', 'name', 'lesson_title'])) || `Lesson ${j + 1}`,
          type: (/pdf|doc|file|attach|document/.test(t) ? 'DOCUMENT' : 'VIDEO') as LessonType,
        }
      }),
    }
  })
}

async function main() {
  const file = process.argv[2]
  const apply = process.argv.includes('--apply')
  if (!file || !fs.existsSync(file)) throw new Error('Usage: tsx scripts/import-fea-courses.ts <fea-courses-full.json> [--apply]')
  const json = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown
  const courses = (Array.isArray(json) ? json : ((json as Obj).courses as unknown[]) ?? Object.values(json as Obj)) as Obj[]
  console.log(`Found ${courses.length} old courses. Mode: ${apply ? 'APPLY' : 'DRY RUN'}\n`)

  const instructor = await db.user.findFirst({ where: { role: { in: ['INSTRUCTOR', 'ADMIN'] } }, orderBy: { createdAt: 'asc' } })
  if (!instructor) throw new Error('No instructor/admin user exists yet.')
  const existing = await db.course.findMany({ include: { sections: { include: { lessons: true } } } })

  for (const c of courses) {
    const title = str(pick(c, ['title', 'name', 'course_name', 'course_title']))
    if (!title) { console.log('SKIP (no title). Keys found:', Object.keys(c).join(', ')); continue }
    const mt = str(pick(c, ['matchTitle']))
    const match =
      (mt ? existing.find((e) => norm(e.title) === norm(mt)) : undefined) ??
      existing.find((e) => norm(e.title) === norm(title)) ??
      existing.find((e) => norm(e.title).includes(norm(title)) || norm(title).includes(norm(e.title)))
    const description = str(pick(c, ['description', 'details', 'about', 'long_description']))
    const short = str(pick(c, ['short_description', 'shortDescription', 'summary'])) || description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 300)
    const price = num(pick(c, ['price', 'fee', 'fees', 'actual_price', 'amount']))
    const discount = num(pick(c, ['discounted_price', 'discount_price', 'offer_price', 'discount']))
    const level = (({ beginner: 'BEGINNER', intermediate: 'INTERMEDIATE', advanced: 'ADVANCED' }) as Record<string, CourseLevel>)[str(pick(c, ['level'])).toLowerCase()]
    const sections = sectionsOf(c)
    const lessonCount = sections.reduce((n, s) => n + s.lessons.length, 0)

    console.log(`${match ? 'UPDATE' : 'CREATE'}  "${title}"${match ? `  ← existing "${match.title}"` : ''}  [${sections.length} sections, ${lessonCount} lessons${price ? `, ₹${price}` : ', no price'}]`)
    if (!apply) continue

    const out = list(pick(c, ['outcomes', 'what_you_will_learn', 'learning_outcomes', 'outcome']))
    const req = list(pick(c, ['requirements', 'prerequisites']))
    const elig = list(pick(c, ['eligibility', 'who_can_join']))
    const hours = num(pick(c, ['duration_hours', 'durationHours', 'hours', 'duration']))
    const subtitle = str(pick(c, ['subtitle', 'tagline']))
    // only overwrite what the JSON actually provides (a titles-only file must not blank existing text)
    const data = {
      title,
      ...(subtitle ? { subtitle } : {}),
      ...(description ? { description: html(description), shortDescription: short.length >= 10 ? short : title } : {}),
      ...(out.length ? { outcomes: out } : {}),
      ...(req.length ? { requirements: req } : {}),
      ...(elig.length ? { eligibility: elig } : {}),
      ...(hours ? { durationHours: hours } : {}),
      ...(level ? { level } : {}),
      ...(price ? { price: price * 100, discountPrice: discount && discount < price ? discount * 100 : null } : {}),
    }
    let courseId: string
    if (match) {
      courseId = (await db.course.update({ where: { id: match.id }, data })).id
    } else {
      let slug = slugify(title)
      while (await db.course.findUnique({ where: { slug } })) slug += '-x'
      courseId = (
        await db.course.create({
          data: { shortDescription: title, description: '<p></p>', ...data, slug, level: level ?? 'BEGINNER', price: price ? price * 100 : 0, instructorId: instructor.id, status: price ? 'PUBLISHED' : 'DRAFT' },
        })
      ).id
    }

    const hasRealLessons = (match?.sections ?? []).some((s) => s.lessons.some((l) => (l.videoUrl && !l.videoUrl.startsWith('placeholder:')) || (l.fileUrl && !l.fileUrl.startsWith('placeholder:'))))
    if (sections.length && !hasRealLessons) {
      await db.section.deleteMany({ where: { courseId } }) // cascades lessons; no real uploads exist
      for (const [si, s] of sections.entries()) {
        const sec = await db.section.create({ data: { courseId, title: s.title, order: si + 1 } })
        if (s.lessons.length)
          await db.lesson.createMany({
            data: s.lessons.map((l, li) => ({
              sectionId: sec.id,
              title: l.title,
              type: l.type,
              durationSeconds: 0,
              isFreePreview: false,
              videoUrl: l.type === 'VIDEO' ? 'placeholder:video' : null,
              fileUrl: l.type === 'DOCUMENT' ? 'placeholder:document' : null,
              order: li + 1,
            })),
          })
      }
    }
  }
  if (apply) console.log('\nDone. In production, open /admin and save any course once (or redeploy) to refresh the cached pages.')
  else console.log('\nDry run only. Re-run with --apply to write.')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
