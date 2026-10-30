import type { Metadata } from 'next'
import { getHeroSlides } from '@/lib/data/content'
import { getSettings } from '@/lib/data/settings'
import { HeroSlider } from '@/components/home/HeroSlider'
import { ValueStrip } from '@/components/home/ValueStrip'
import { TopCourses } from '@/components/home/TopCourses'
import { BrowseCategories } from '@/components/home/BrowseCategories'
import { StatsBlock } from '@/components/home/StatsBlock'
import { TestimonialsBlock } from '@/components/home/TestimonialsBlock'
import { ClientLogos } from '@/components/home/ClientLogos'
import { WebinarBanner } from '@/components/home/WebinarBanner'
import { HowItWorks } from '@/components/home/HowItWorks'
import { ShowcaseBand } from '@/components/home/ShowcaseBand'
import { WhyChoose } from '@/components/home/WhyChoose'
import { Faq } from '@/components/home/Faq'
import { CtaBand } from '@/components/home/CtaBand'
import { buildMetadata } from '@/lib/utils/seo'

// ISR: public page, never reads cookies/session (REQ-270).
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings()
  return buildMetadata({
    title: `${s.company_name ?? 'PYTHAGORAS'} — Engineering Courses Online`,
    description:
      'Learn FEA/ANSYS, ASME pressure vessel design, fatigue and fracture mechanics, and rotordynamics from industry experts.',
    path: '/',
  })
}

export default async function HomePage() {
  const slides = await getHeroSlides()
  return (
    <>
      <HeroSlider slides={slides} />
      <ValueStrip />
      <WebinarBanner />
      <TopCourses />
      <HowItWorks />
      <BrowseCategories />
      <ShowcaseBand />
      <WhyChoose />
      <StatsBlock />
      <TestimonialsBlock />
      <ClientLogos />
      <Faq />
      <CtaBand />
    </>
  )
}
