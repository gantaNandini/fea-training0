import type { Metadata } from 'next'
import { StaticPage } from '@/components/static/StaticPage'
import { getPage } from '@/lib/data/pages'
import { buildMetadata } from '@/lib/utils/seo'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  let title = 'Privacy policy'
  try {
    title = (await getPage('privacy-policy'))?.title ?? title
  } catch {
    /* DB unavailable at build */
  }
  return buildMetadata({ title, description: 'How we collect, use and protect your data.', path: '/privacy-policy' })
}

export default function Page() {
  return <StaticPage slug="privacy-policy" />
}
