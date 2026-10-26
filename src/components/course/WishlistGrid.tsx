'use client'

import * as React from 'react'
import { toast } from 'sonner'
import type { CourseCardDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { CourseCard } from './CourseCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ButtonLink } from '@/components/ui/button'
import { useCart } from '@/hooks/useCart'
import { useUserState } from '@/hooks/useUserState'
import { messages } from '@/lib/messages'

/** REQ-161: each saved course has Remove and Add to cart. */
export function WishlistGrid({ initial }: { initial: CourseCardDTO[] }) {
  const [items, setItems] = React.useState(initial)
  const { wishlistIds, setWishlistIds } = useUserState()
  const cart = useCart()

  async function remove(id: string) {
    const before = items
    setItems((prev) => prev.filter((c) => c.id !== id))
    setWishlistIds(wishlistIds.filter((x) => x !== id))
    const res = await fetch('/api/wishlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: id }),
    })
    if (!res.ok) {
      setItems(before)
      toast.error(messages.common.somethingWrong)
    } else toast.success(messages.wishlist.removed)
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={messages.wishlist.empty}
        body={messages.wishlist.emptyBody}
        action={<ButtonLink href="/courses">{messages.common.browseCourses}</ButtonLink>}
      />
    )
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <div key={c.id} className="flex flex-col gap-2">
          <div className="flex-1">
            <CourseCard course={c} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => remove(c.id)}>
              {messages.common.remove}
            </Button>
            <Button
              className="flex-1"
              disabled={c.status !== 'PUBLISHED' || cart.has(c.id)}
              onClick={() => cart.add(c.id)}
            >
              {cart.has(c.id) ? messages.course.inCart : messages.course.addToCart}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
