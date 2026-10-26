import type { CourseDetailDTO } from '@/lib/types'
import { PriceTag } from '@/components/shared/PriceTag'
import { PurchaseActions } from './PurchaseActions'

/** Below 1024 px the purchase card collapses to a sticky bottom bar (REQ-100). */
export function MobilePurchaseBar({ course }: { course: CourseDetailDTO }) {
  return (
    <div
      data-testid="mobile-purchase-bar"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
        <PriceTag price={course.price} discountPrice={course.discountPrice} isFree={course.isFree} />
        <div className="w-44 shrink-0">
          <PurchaseActions course={course} compact />
        </div>
      </div>
    </div>
  )
}
