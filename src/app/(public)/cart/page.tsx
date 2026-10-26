import type { Metadata } from 'next'
import { CartView } from '@/components/cart/CartView'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const metadata: Metadata = buildMetadata({
  title: messages.cart.title,
  description: 'Review the courses in your cart.',
  path: '/cart',
  noIndex: true,
})

export default function CartPage() {
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="mb-8">{messages.cart.title}</h1>
      <CartView />
    </div>
  )
}
