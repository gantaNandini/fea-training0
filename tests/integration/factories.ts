import { db } from '@/lib/db'

let n = 0
const uid = () => `${Date.now()}-${++n}`

export async function makeUser(over: Partial<{ email: string; role: 'STUDENT' | 'ADMIN' | 'INSTRUCTOR' }> = {}) {
  const id = uid()
  return db.user.create({ data: { email: over.email ?? `u${id}@test.local`, name: `User ${id}`, role: over.role ?? 'STUDENT' } })
}

export async function makeCourse(opts: { instructorId: string; price?: number; lessons?: number[]; status?: 'PUBLISHED' | 'UPCOMING' } ) {
  const id = uid()
  const course = await db.course.create({
    data: {
      slug: `course-${id}`,
      title: `Course ${id}`,
      shortDescription: 's',
      description: 'd',
      level: 'BEGINNER',
      price: opts.price ?? 100000,
      status: opts.status ?? 'PUBLISHED',
      instructorId: opts.instructorId,
      requirements: [],
      outcomes: [],
      tags: [],
    },
  })
  if (opts.lessons?.length) {
    await db.section.create({
      data: {
        courseId: course.id,
        title: 'S1',
        order: 1,
        lessons: {
          create: opts.lessons.map((d, i) => ({ title: `L${i + 1}`, durationSeconds: d, order: i + 1, isFreePreview: i === 0 })),
        },
      },
    })
  }
  return course
}

export async function makePendingOrder(opts: {
  userId: string
  courseIds: string[]
  price?: number
  razorpayOrderId?: string
  status?: 'PENDING' | 'FAILED'
  total?: number
}) {
  const price = opts.price ?? 100000
  const total = opts.total ?? price * opts.courseIds.length
  return db.order.create({
    data: {
      orderNumber: `T-${uid()}`,
      userId: opts.userId,
      status: opts.status ?? 'PENDING',
      subtotal: price * opts.courseIds.length,
      total,
      gstMode: 'INCLUSIVE',
      razorpayOrderId: opts.razorpayOrderId ?? (total === 0 ? null : `order_${uid()}`),
      items: { create: opts.courseIds.map((courseId) => ({ courseId, price, titleSnapshot: 'T' })) },
    },
  })
}
