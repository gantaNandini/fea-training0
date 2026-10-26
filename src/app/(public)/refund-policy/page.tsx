import type { Metadata } from 'next'
import { StaticPage } from '@/components/static/StaticPage'
import { getPage } from '@/lib/data/pages'
import { buildMetadata } from '@/lib/utils/seo'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  let title = 'Refund policy'
  try {
    title = (await getPage('refund-policy'))?.title ?? title
  } catch {
    /* DB unavailable at build */
  }
  return buildMetadata({ title, description: 'Our refund policy for online courses.', path: '/refund-policy' })
}

export default function Page() {
  return <StaticPage slug="refund-policy" />
}
