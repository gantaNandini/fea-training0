import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  // Clean up existing test certificates
  await db.certificate.deleteMany({ where: { code: { startsWith: 'PYT-' } } })
  console.log('Cleaned up existing test certificates')

  // Get courses and instructor
  const courses = await db.course.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, title: true, instructorId: true }, orderBy: { featuredOrder: 'asc' }, take: 3 })
  if (courses.length < 3) { console.log('Not enough courses'); process.exit(1) }
  const user = await db.user.findFirst({ where: { id: courses[0].instructorId }, select: { id: true } })
  if (!user) { console.log('No user found'); process.exit(1) }

  // Test 1: Normal certificate (code matches PYT-XXXXX-XXXXX format)
  const cert1 = await db.certificate.create({
    data: { code: 'PYT-ABCDE-FGHIJ', userId: user.id, courseId: courses[0].id,
      learnerName: 'Dr. Jane Smith',
      courseTitle: 'Full Course: Pressure Vessel Design by Analysis (DBA) as per ASME Section VIII Div 2' },
  })
  console.log(`Certificate 1: ${cert1.code} — ${cert1.learnerName} — "${cert1.courseTitle}"`)

  // Test 2: Long recipient name (overflow test)
  const cert2 = await db.certificate.create({
    data: { code: 'PYT-KLMNO-PQRST', userId: user.id, courseId: courses[1].id,
      learnerName: 'Dr. Srinivasa Ramanujan Venkateshwara Iyer Krishnamurthy Subramaniam',
      courseTitle: '3D Fracture Mechanics Simulation using ANSYS Mechanical' },
  })
  console.log(`Certificate 2: ${cert2.code} — ${cert2.learnerName} — "${cert2.courseTitle}"`)

  // Test 3: Long course title (overflow test)
  const cert3 = await db.certificate.create({
    data: { code: 'PYT-UVWXY-ZABCD', userId: user.id, courseId: courses[2].id,
      learnerName: 'John Doe',
      courseTitle: 'Advanced Finite Element Analysis using ANSYS Workbench and APDL with Comprehensive Coverage of Nonlinear Analysis, Contact Mechanics, and Submodelling Techniques for Industrial Applications' },
  })
  console.log(`Certificate 3: ${cert3.code} — ${cert3.learnerName} — "${cert3.courseTitle}"`)

  await db.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
