import { cn } from '@/lib/utils/cn'
import { discountPercent, effectivePrice, formatINR } from '@/lib/utils/pricing'
import { messages } from '@/lib/messages'

/** Price in ₹ (Indian grouping) with struck-through original when discounted (REQ-066). */
export function PriceTag({
  price,
  discountPrice,
  isFree,
  size = 'md',
  showPercent,
  className,
}: {
  price: number
  discountPrice: number | null
  isFree?: boolean
  size?: 'md' | 'lg'
  showPercent?: boolean
  className?: string
}) {
  if (isFree || effectivePrice(price, discountPrice) === 0) {
    return (
      <span className={cn('font-display font-bold text-success-text dark:text-green-400', size === 'lg' ? 'text-3xl' : 'text-lg', className)}>
        {messages.course.free}
      </span>
    )
  }
  const eff = effectivePrice(price, discountPrice)
  const hasDiscount = eff < price
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', className)}>
      <span className={cn('font-display font-bold text-foreground', size === 'lg' ? 'text-3xl' : 'text-lg')}>
        {formatINR(eff)}
      </span>
      {hasDiscount ? (
        <>
          <s className="text-sm text-muted-foreground" aria-label={`Original price ${formatINR(price)}`}>
            {formatINR(price)}
          </s>
          {showPercent ? (
            <span className="text-sm font-semibold text-success-text dark:text-green-400">
              {discountPercent(price, discountPrice)}% {messages.course.off}
            </span>
          ) : null}
        </>
      ) : null}
    </span>
  )
}
