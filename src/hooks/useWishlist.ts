'use client'

import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useUserState } from './useUserState'
import { addCourseId, removeCourseId } from '@/lib/utils/cart'
import { messages } from '@/lib/messages'

/** REQ-162: toggle with a toast; unauthenticated users are sent to login. */
export function useWishlist() {
  const { wishlistIds, setWishlistIds, authenticated } = useUserState()
  const router = useRouter()
  const pathname = usePathname()

  async function toggle(courseId: string) {
    if (!authenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || '/')}`)
      return
    }
    const had = wishlistIds.includes(courseId)
    const before = wishlistIds
    setWishlistIds(had ? removeCourseId(before, courseId) : addCourseId(before, courseId))
    const res = await fetch('/api/wishlist', {
      method: had ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    })
    if (!res.ok) {
      setWishlistIds(before)
      toast.error(messages.common.somethingWrong)
      return
    }
    toast.success(had ? messages.wishlist.removed : messages.wishlist.added)
  }

  return { wishlistIds, has: (id: string) => wishlistIds.includes(id), toggle }
}
