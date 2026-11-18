import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPage } from '@/lib/data/pages'
import { sanitizeRichText } from '@/lib/utils/sanitize'
import { buildMetadata } from '@/lib/utils/seo'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  let title = 'About us'
  try {
    title = (await getPage('about'))?.title ?? title
  } catch {
    /* DB unavailable at build */
  }
  return buildMetadata({ title, description: 'Learn about Pythagoras Engineering Consultancy and Services and our training programmes.', path: '/about' })
}

export default async function Page() {
  const page = await getPage('about')
  if (!page) notFound()
  return (
    <div className="max-w-3xl">
      <h1 className="mb-8">{page.title}</h1>
      <div className="prose-content" dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.body) }} />
    </div>
  )
}
