import type { Metadata } from 'next'
import { CheckoutView } from '@/components/checkout/CheckoutView'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const metadata: Metadata = buildMetadata({
  title: messages.checkout.title,
  description: 'Complete your purchase.',
  path: '/checkout',
  noIndex: true,
})

// /checkout is protected by middleware (JWT) — unauthenticated users go to /login?redirect=/checkout.
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ coupon?: string }> }) {
  const { coupon } = await searchParams
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="mb-8">{messages.checkout.title}</h1>
      {process.env.PAYMENT_PROVIDER !== 'razorpay' ? (
        <p className="mb-6 rounded-md bg-amber-50 px-4 py-3 text-sm font-medium text-warning-text dark:bg-amber-950/40 dark:text-amber-300">
          {messages.checkout.mockNotice}
        </p>
      ) : null}
      <CheckoutView initialCoupon={coupon?.slice(0, 40) ?? null} />
    </div>
  )
}
