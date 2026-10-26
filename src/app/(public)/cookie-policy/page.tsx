import type { Metadata } from 'next'
import { StaticPage } from '@/components/static/StaticPage'
import { getPage } from '@/lib/data/pages'
import { buildMetadata } from '@/lib/utils/seo'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  let title = 'Cookie policy'
  try {
    title = (await getPage('cookie-policy'))?.title ?? title
  } catch {
    /* DB unavailable at build */
  }
  return buildMetadata({ title, description: 'How this site uses cookies.', path: '/cookie-policy' })
}

export default function Page() {
  return <StaticPage slug="cookie-policy" />
}
