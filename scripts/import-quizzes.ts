/**
 * Bulk-load quizzes from JSON and report which VIDEO lessons still have no quiz.
 *   pnpm exec tsx scripts/import-quizzes.ts quizzes.json            # dry run
 *   pnpm exec tsx scripts/import-quizzes.ts quizzes.json --apply    # write
 *   pnpm exec tsx scripts/import-quizzes.ts --report                # list videos without a quiz
 * Lessons are matched by lessonId, or by courseSlug + exact lessonTitle.
 * Refuses to write an empty quiz (would block students).
 */
import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface Item {
  lessonId?: string
  courseSlug?: string
  lessonTitle?: string
  title?: string
  passPercent?: number
  questions: Array<{
    prompt: string
    options: string[]
    correct: number[]
    explanation?: string
  }>
}

async function report() {
  const lessons = await db.lesson.findMany({
    where: { type: 'VIDEO', quiz: null },
    select: { id: true, title: true, section: { select: { course: { select: { slug: true } } } } },
  })
  console.log(`${lessons.length} VIDEO lesson(s) without a quiz`)
  const by: Record<string, number> = {}
  for (const l of lessons) by[l.section.course.slug] = (by[l.section.course.slug] ?? 0) + 1
  console.table(by)
}

async function main() {
  const [file, ...flags] = process.argv.slice(2)
  if (file === '--report') return report()
  const apply = flags.includes('--apply')
  const items: Item[] = JSON.parse(readFileSync(file, 'utf8'))
  let ok = 0
  let bad = 0
  for (const it of items) {
    const lesson = it.lessonId
      ? await db.lesson.findUnique({ where: { id: it.lessonId } })
      : await db.lesson.findFirst({
          where: {
            title: it.lessonTitle,
            type: 'VIDEO',
            section: { course: { slug: it.courseSlug } },
          },
        })
    const problems: string[] = []
    if (!lesson) problems.push('lesson not found')
    if (lesson && lesson.type !== 'VIDEO') problems.push('not a VIDEO lesson')
    if (!it.questions?.length) problems.push('no questions yet (an empty quiz would block students) — skipped')
    it.questions.forEach((q, i) => {
      if (q.options.length < 2) problems.push(`q${i + 1}: needs >= 2 options`)
      if (!q.correct?.length || q.correct.some((c) => c < 0 || c >= q.options.length))
        problems.push(`q${i + 1}: bad correct index`)
    })
    if (problems.length || !lesson) {
      bad++
      console.log('SKIP', it.lessonId ?? `${it.courseSlug}/${it.lessonTitle}`, problems.join('; '))
      continue
    }
    ok++
    console.log(apply ? 'WRITE' : 'OK   ', `${lesson.title} (${it.questions.length} questions)`)
    if (!apply) continue
    const passPercent = it.passPercent ?? 80
    const quiz = await db.quiz.upsert({
      where: { lessonId: lesson.id },
      create: { lessonId: lesson.id, title: it.title ?? 'Lesson quiz', passPercent },
      update: { title: it.title ?? 'Lesson quiz', passPercent },
    })
    await db.quizQuestion.deleteMany({ where: { quizId: quiz.id } })
    for (const [qi, q] of it.questions.entries()) {
      await db.quizQuestion.create({
        data: {
          quizId: quiz.id,
          prompt: q.prompt,
          explanation: q.explanation ?? null,
          order: qi + 1,
          options: {
            create: q.options.map((t, oi) => ({
              text: t,
              isCorrect: q.correct.includes(oi),
              order: oi + 1,
            })),
          },
        },
      })
    }
  }
  console.log(`\n${ok} ready${apply ? ' (written)' : ' (dry run — add --apply)'}, ${bad} skipped`)
}

main().finally(() => db.$disconnect())
