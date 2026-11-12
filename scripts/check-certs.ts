import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  // Check existing certificates
  const certs = await db.certificate.findMany({
    select: { code: true, learnerName: true, courseTitle: true, issuedAt: true, userId: true, courseId: true },
    orderBy: { issuedAt: 'desc' },
    take: 5,
  })
  console.log(`Existing certificates: ${certs.length}`)
  for (const c of certs) {
    console.log(`  ${c.code} — ${c.learnerName} — "${c.courseTitle}" — ${c.issuedAt.toISOString()}`)
  }

  // Check the first published course for testing
  const course = await db.course.findFirst({
    where: { status: 'PUBLISHED' },
    select: { id: true, slug: true, title: true, outcomes: true },
    orderBy: { featuredOrder: 'asc' },
  })
  console.log(`\nFirst course for testing: ${course?.slug}`)
  console.log(`  Title: ${course?.title}`)
  console.log(`  Outcomes: ${JSON.stringify(course?.outcomes?.slice(0, 3))}`)

  await db.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
