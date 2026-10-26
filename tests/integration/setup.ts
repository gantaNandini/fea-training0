import { afterAll, beforeEach } from 'vitest'
import { db } from '@/lib/db'

const TABLES = [
  'LessonProgress', 'Payment', 'Enrollment', 'OrderItem', 'Order', 'CartItem', 'WishlistItem',
  'Review', 'Lesson', 'Section', 'CourseCategory', 'Course', 'Category', 'Coupon', 'RateLimit',
  'PasswordResetToken', 'InstructorProfile', 'User',
]

beforeEach(async () => {
  await db.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`)
})

afterAll(async () => {
  await db.$disconnect()
})
