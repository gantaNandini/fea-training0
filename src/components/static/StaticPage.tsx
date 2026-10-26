import { notFound } from 'next/navigation'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getPage } from '@/lib/data/pages'
import { sanitizeRichText } from '@/lib/utils/sanitize'
import { messages } from '@/lib/messages'

/** REQ-200: renders a `Page` row, sanitised again at render time. */
export async function StaticPage({ slug }: { slug: string }) {
  const page = await getPage(slug)
  if (!page) notFound()
  return (
    <div className="container-page max-w-3xl py-10 md:py-14">
      <Breadcrumb items={[{ label: messages.nav.home, href: '/' }, { label: page.title }]} />
      <h1 className="mt-4 mb-8">{page.title}</h1>
      <div className="prose-content" dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.body) }} />
    </div>
  )
}
