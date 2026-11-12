import type { Metadata } from 'next'
import { getHeroSlides } from '@/lib/data/content'
import { getSettings } from '@/lib/data/settings'
import { HeroSlider } from '@/components/home/HeroSlider'
import { ValueStrip } from '@/components/home/ValueStrip'
import { TopCourses } from '@/components/home/TopCourses'
import { ExploreTiles } from '@/components/home/ExploreTiles'
import { NewlyLaunchedCourses, ConsultancyHighlights } from '@/components/home/UpcomingActivities'
import { ComingUp } from '@/components/home/ComingUp'
import { StatsBlock } from '@/components/home/StatsBlock'
import { TestimonialsBlock } from '@/components/home/TestimonialsBlock'
import { CtaBand } from '@/components/home/CtaBand'
import { buildMetadata } from '@/lib/utils/seo'

// ISR: public page, never reads cookies/session (REQ-270).
export const revalidate = 120

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
      <ComingUp />
      <NewlyLaunchedCourses />
      <TopCourses limit={6} />
      <ExploreTiles />
      <ConsultancyHighlights />
      <StatsBlock />
      <TestimonialsBlock />
      <CtaBand />
    </>
  )
}
