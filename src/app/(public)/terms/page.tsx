import type { Metadata } from 'next'
import { StaticPage } from '@/components/static/StaticPage'
import { getPage } from '@/lib/data/pages'
import { buildMetadata } from '@/lib/utils/seo'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  let title = 'Terms and conditions'
  try {
    title = (await getPage('terms'))?.title ?? title
  } catch {
    /* DB unavailable at build */
  }
  return buildMetadata({ title, description: 'The terms that govern use of the platform.', path: '/terms' })
}

export default function Page() {
  return <StaticPage slug="terms" />
}
