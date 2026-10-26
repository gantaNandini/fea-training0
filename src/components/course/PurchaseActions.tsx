'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { GitCompareArrows, Heart } from 'lucide-react'
import type { CourseDetailDTO } from '@/lib/types'
import { Button, ButtonLink } from '@/components/ui/button'
import { useCart } from '@/hooks/useCart'
import { useCompare } from '@/hooks/useCompare'
import { useUserState } from '@/hooks/useUserState'
import { useWishlist } from '@/hooks/useWishlist'
import { effectivePrice } from '@/lib/utils/pricing'
import { messages } from '@/lib/messages'
import { cn } from '@/lib/utils/cn'

/** All purchase CTAs for a course (shared by the sticky card and the mobile bottom bar). */
export function PurchaseActions({
  course,
  compact,
}: {
  course: Pick<CourseDetailDTO, 'id' | 'slug' | 'price' | 'discountPrice' | 'isFree' | 'status'>
  compact?: boolean
}) {
  const router = useRouter()
  const { enrolledIds, authenticated, refresh } = useUserState()
  const cart = useCart()
  const wishlist = useWishlist()
  const compare = useCompare()
  const [busy, setBusy] = React.useState(false)

  const upcoming = course.status === 'UPCOMING'
  const enrolled = enrolledIds.includes(course.id)
  const inCart = cart.has(course.id)
  const free = course.isFree || effectivePrice(course.price, course.discountPrice) === 0
  const wished = wishlist.has(course.id)
  const compared = compare.has(course.id)

  async function buyNow() {
    setBusy(true)
    const ok = inCart || (await cart.add(course.id))
    setBusy(false)
    if (ok) router.push('/checkout')
  }

  async function enrollFree() {
    if (!authenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/courses/${course.slug}`)}`)
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/enroll/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
      })
      const body = (await res.json().catch(() => ({}))) as { redirect?: string; error?: { message?: string } }
      if (!res.ok || !body.redirect) {
        toast.error(body.error?.message ?? messages.common.somethingWrong)
        return
      }
      await refresh()
      router.push(body.redirect)
    } finally {
      setBusy(false)
    }
  }

  if (upcoming) {
    return (
      <Button disabled variant="secondary" className="w-full" size="lg">
        {messages.course.comingSoon}
      </Button>
    )
  }

  if (enrolled) {
    return (
      <ButtonLink href="/my-courses" size="lg" className="w-full" data-testid="go-to-course">
        {messages.course.goToCourse}
      </ButtonLink>
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', compact && 'flex-row items-center')}>
      {free ? (
        <Button size="lg" className="w-full" disabled={busy} onClick={enrollFree} data-testid="enroll-free">
          {messages.course.enrollFree}
        </Button>
      ) : (
        <>
          <Button size="lg" className="w-full" disabled={busy} onClick={buyNow} data-testid="buy-now">
            {messages.course.buyNow}
          </Button>
          {compact ? null : inCart ? (
            <ButtonLink href="/cart" variant="outline" size="lg" className="w-full">
              {messages.course.goToCart}
            </ButtonLink>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              disabled={cart.pending === course.id}
              onClick={() => cart.add(course.id)}
              data-testid="add-to-cart"
            >
              {messages.course.addToCart}
            </Button>
          )}
        </>
      )}
      {compact ? null : (
        <>
          <Button variant="ghost" className="w-full" onClick={() => wishlist.toggle(course.id)} aria-pressed={wished}>
            <Heart className={cn('h-5 w-5', wished && 'fill-coral-600 text-coral-600')} aria-hidden="true" />
            {wished ? messages.course.removeFromWishlist : messages.course.addToWishlist}
          </Button>
          <div className="flex items-center justify-center gap-2 text-sm">
            <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
            <button
              type="button"
              onClick={() => compare.toggle(course.id)}
              className="min-h-11 font-semibold text-link underline-offset-4 hover:underline"
            >
              {compared ? messages.course.removeFromCompare : messages.course.compareThis}
            </button>
            {compared ? (
              <Link href={`/compare?ids=${compare.ids.join(',')}`} className="font-semibold text-link underline-offset-4 hover:underline">
                · {messages.nav.compare}
              </Link>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
