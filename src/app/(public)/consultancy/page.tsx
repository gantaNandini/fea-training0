import type { Metadata } from 'next'
import { PageHero } from '@/components/shared/PageHero'
import { ConsultancySection } from '@/components/home/ConsultancySection'
import { buildMetadata } from '@/lib/utils/seo'

export const revalidate = 600
export const metadata: Metadata = buildMetadata({
  title: 'Engineering consultancy',
  description: 'Finite element analysis, pressure vessel design review, fatigue and fracture assessment.',
  path: '/consultancy',
})

export default function ConsultancyPage() {
  return (
    <>
      <PageHero title="Engineering consultancy" subtitle="Real analysis and design support from the same engineers who teach the courses." crumb="Consultancy" />
      <ConsultancySection force hideHeading />
    </>
  )
}
