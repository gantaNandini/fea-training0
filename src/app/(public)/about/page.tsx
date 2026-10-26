import type { Metadata } from 'next'
import { StaticPage } from '@/components/static/StaticPage'
import { getPage } from '@/lib/data/pages'
import { buildMetadata } from '@/lib/utils/seo'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  let title = 'About us'
  try {
    title = (await getPage('about'))?.title ?? title
  } catch {
    /* DB unavailable at build */
  }
  return buildMetadata({ title, description: 'Learn about PYTHAGORAS Engineering Consultancy and our training programmes.', path: '/about' })
}

export default function Page() {
  return <StaticPage slug="about" />
}
