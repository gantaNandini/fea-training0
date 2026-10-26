import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { OrderStatus } from '@/components/checkout/OrderStatus'
import { getFreshUser } from '@/lib/auth/guards'
import { getOrderSummary } from '@/lib/data/orders'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const metadata: Metadata = buildMetadata({
  title: messages.checkout.successTitle,
  description: 'Your order confirmation.',
  path: '/checkout/success',
  noIndex: true,
})

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams
  const user = await getFreshUser()
  if (!orderId || !user) notFound()
  const order = await getOrderSummary(orderId)
  if (!order || order.userId !== user.id) notFound()
  const { userId: _userId, ...dto } = order
  void _userId
  return (
    <div className="container-page py-16">
      <OrderStatus order={dto} />
    </div>
  )
}
