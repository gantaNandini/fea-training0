'use client'

import Link from 'next/link'
import { GitCompareArrows, Heart } from 'lucide-react'
import type { CourseCardDTO } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Tip } from '@/components/ui/tooltip'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { PriceTag } from '@/components/shared/PriceTag'
import { StarRating } from '@/components/shared/StarRating'
import { CourseCardHover } from './CourseCardHover'
import { useCart } from '@/hooks/useCart'
import { useCompare } from '@/hooks/useCompare'
import { useWishlist } from '@/hooks/useWishlist'
import { useUserState } from '@/hooks/useUserState'
import { formatHours } from '@/lib/utils/pricing'
import { messages } from '@/lib/messages'
import { cn } from '@/lib/utils/cn'

const levelLabel = {
  BEGINNER: messages.course.levelBeginner,
  INTERMEDIATE: messages.course.levelIntermediate,
  ADVANCED: messages.course.levelAdvanced,
} as const

/**
 * Uniform-height card (REQ-023): fixed 16:9 thumbnail, 2-line title, 1-line instructor, fixed-height
 * meta/rating rows and a single footer row pinned with mt-auto. Per-user state (wishlisted,
 * enrolled, in cart) comes from UserStateProvider — never from the cached course payload (REQ-066).
 */
export function CourseCard({
  course,
  priority = false,
  layout = 'grid',
}: {
  course: CourseCardDTO
  priority?: boolean
  layout?: 'grid' | 'list'
}) {
  const { enrolledIds } = useUserState()
  const cart = useCart()
  const wishlist = useWishlist()
  const compare = useCompare()

  const upcoming = course.status === 'UPCOMING'
  const enrolled = enrolledIds.includes(course.id)
  const inCart = cart.has(course.id)
  const wished = wishlist.has(course.id)
  const compared = compare.has(course.id)
  const list = layout === 'list'
  const href = `/courses/${course.slug}`

  const iconBtn =
    'relative z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-md hover:bg-white dark:bg-slate-900/95 dark:text-white'

  return (
    <article
      data-testid="course-card"
      className={cn(
        'card-lift relative flex h-full overflow-hidden rounded-xl border border-border bg-card',
        list ? 'flex-col sm:flex-row' : 'flex-col',
      )}
    >
      <div className={cn('relative aspect-card shrink-0 overflow-hidden bg-muted', list && 'sm:w-72 sm:self-stretch sm:aspect-auto')}>
        <PlaceholderArt
          src={course.thumbnail}
          alt={`${course.title} — course thumbnail`}
          fill
          priority={priority}
          sizes={list ? '(min-width: 640px) 288px, 100vw' : '(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw'}
          className="object-cover"
        />
        <div className="absolute right-2 top-2 z-20 flex flex-col gap-2">
          <Tip label={wished ? messages.course.removeFromWishlist : messages.course.addToWishlist} side="left">
            <button
              type="button"
              data-testid="wishlist-toggle"
              aria-label={wished ? messages.course.removeFromWishlist : messages.course.addToWishlist}
              aria-pressed={wished}
              onClick={() => wishlist.toggle(course.id)}
              className={iconBtn}
            >
              <Heart className={cn('h-5 w-5', wished && 'fill-coral-600 text-coral-600')} aria-hidden="true" />
            </button>
          </Tip>
        </div>
        <div className="absolute left-2 top-2 z-20">
          <Tip label={compared ? messages.course.removeFromCompare : messages.course.addToCompare} side="right">
            <button
              type="button"
              data-testid="compare-toggle"
              aria-label={compared ? messages.course.removeFromCompare : messages.course.addToCompare}
              aria-pressed={compared}
              onClick={() => compare.toggle(course.id)}
              className={cn(iconBtn, compared && 'ring-2 ring-plum-500')}
            >
              <GitCompareArrows className="h-5 w-5" aria-hidden="true" />
            </button>
          </Tip>
        </div>
        {upcoming ? (
          <Badge tone="warning" className="absolute bottom-2 left-2 z-10">
            {messages.course.comingSoon}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <CourseCardHover course={course}>
          <h3 className="font-display text-base font-bold leading-snug">
            {/* stretched link: the whole card is clickable; controls sit above it with z-20 */}
            <Link
              href={href}
              className={cn(
                'line-clamp-2 min-h-[2.75rem] after:absolute after:inset-0 after:z-10 after:content-[""] hover:text-link',
                list && 'sm:min-h-0',
              )}
            >
              {course.title}
            </Link>
          </h3>
        </CourseCardHover>

        {list ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{course.shortDescription}</p>
        ) : null}

        <p className="truncate text-sm text-muted-foreground">{course.instructorName}</p>

        {/* fixed-height badge/meta row */}
        <div className="flex h-6 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
          <Badge tone="plum">{levelLabel[course.level]}</Badge>
          {course.lessonCount > 0 ? (
            <span>
              {course.lessonCount} {messages.course.lessons} · {formatHours(course.totalSeconds)}
            </span>
          ) : (
            <span>{messages.course.curriculumSoon}</span>
          )}
        </div>

        <div className="flex h-5 items-center">
          <StarRating value={course.avgRating} count={course.reviewCount} />
        </div>

        <div className="mt-auto flex h-14 items-center justify-between gap-2 border-t border-border pt-3">
          <PriceTag price={course.price} discountPrice={course.discountPrice} isFree={course.isFree} />
          <div className="relative z-20">
            {upcoming ? (
              <Button variant="secondary" size="sm" disabled>
                {messages.course.comingSoon}
              </Button>
            ) : enrolled ? (
              <ButtonLink href="/my-courses" variant="secondary" size="sm">
                {messages.course.enrolled}
              </ButtonLink>
            ) : inCart ? (
              <ButtonLink href="/cart" variant="outline" size="sm">
                {messages.course.inCart}
              </ButtonLink>
            ) : (
              <Button
                size="sm"
                data-testid="add-to-cart"
                disabled={cart.pending === course.id}
                onClick={() => cart.add(course.id)}
              >
                {messages.course.addToCart}
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
