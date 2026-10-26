import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { WishlistGrid } from '@/components/course/WishlistGrid'
import { getFreshUser } from '@/lib/auth/guards'
import { getWishlistCourses } from '@/lib/data/wishlist'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const metadata: Metadata = buildMetadata({
  title: messages.wishlist.title,
  description: 'Courses you saved for later.',
  path: '/wishlist',
  noIndex: true,
})

export default async function WishlistPage() {
  const user = await getFreshUser()
  if (!user) redirect('/login?redirect=/wishlist') // REQ-160
  const courses = await getWishlistCourses(user.id)
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="mb-8">{messages.wishlist.title}</h1>
      <WishlistGrid initial={courses} />
    </div>
  )
}
