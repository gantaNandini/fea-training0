import type { ClientLogoDTO } from '@/lib/types'
import { getClientLogos } from '@/lib/data/content'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { Marquee } from './Marquee'
import { messages } from '@/lib/messages'

export async function ClientLogos({ logos: logosProp }: { logos?: ClientLogoDTO[] }) {
  const logos = logosProp ?? await getClientLogos()
  if (logos.length === 0) return null
  return (
    <section className="section-y" aria-labelledby="clients-heading">
      <div className="container-page">
        <SectionHeader id="clients-heading" title={messages.home.clients} subtitle={messages.home.clientsSub} />
        <Marquee logos={logos} />
      </div>
    </section>
  )
}
