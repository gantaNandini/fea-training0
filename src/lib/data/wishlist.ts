import { db } from '@/lib/db'
import { getCourseCardsByIds } from './courses'

export async function getWishlistIds(userId: string): Promise<string[]> {
  const rows = await db.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { courseId: true },
  })
  return rows.map((r) => r.courseId)
}

export async function getWishlistCourses(userId: string) {
  return getCourseCardsByIds(await getWishlistIds(userId))
}

export async function addWishlist(userId: string, courseId: string) {
  await db.wishlistItem.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId },
    update: {},
  })
}

export async function removeWishlist(userId: string, courseId: string) {
  await db.wishlistItem.deleteMany({ where: { userId, courseId } })
}
