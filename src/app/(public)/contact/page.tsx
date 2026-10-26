import type { Metadata } from 'next'
import { ContactForm } from '@/components/contact/ContactForm'
import { getSettings } from '@/lib/data/settings'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const revalidate = 3600
export const metadata: Metadata = buildMetadata({
  title: messages.contact.title,
  description: messages.contact.subtitle,
  path: '/contact',
})

export default async function ContactPage() {
  const s = await getSettings()
  return (
    <div className="container-page grid gap-10 py-10 md:py-14 lg:grid-cols-2">
      <div>
        <h1>{messages.contact.title}</h1>
        <p className="mt-3 text-muted-foreground">{messages.contact.subtitle}</p>
        <dl className="mt-8 space-y-4 text-sm">
          {s.address ? (<div><dt className="font-semibold">{messages.contact.address}</dt><dd className="text-muted-foreground">{s.address}</dd></div>) : null}
          {s.email ? (<div><dt className="font-semibold">{messages.contact.email}</dt><dd><a className="text-link underline-offset-4 hover:underline" href={`mailto:${s.email}`}>{s.email}</a></dd></div>) : null}
          {s.phone ? (<div><dt className="font-semibold">{messages.contact.phone}</dt><dd><a className="text-link underline-offset-4 hover:underline" href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a></dd></div>) : null}
        </dl>
      </div>
      <ContactForm />
    </div>
  )
}
