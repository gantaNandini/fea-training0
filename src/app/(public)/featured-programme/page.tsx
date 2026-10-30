import type { Metadata } from 'next'
import { StaticPage } from '@/components/static/StaticPage'
import { buildMetadata } from '@/lib/utils/seo'

export const revalidate = 3600
export const metadata: Metadata = buildMetadata({
  title: 'Fatigue Analysis for Pressure Vessels',
  description: 'ASME Section VIII Division 2 Part 5: full programme outline and course modules.',
  path: '/featured-programme',
})

export default function FeaturedProgrammePage() {
  return <StaticPage slug="featured-programme" />
}
