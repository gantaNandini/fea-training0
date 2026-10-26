import type { Metadata } from 'next'
import { getHeroSlides, getTestimonials, getClientLogos, getUpcomingWebinar } from '@/lib/data/content'
import { getSettings } from '@/lib/data/settings'
import { getFeaturedCourses, getPublishedCourseCount } from '@/lib/data/courses'
import { getCategoriesWithCourses } from '@/lib/data/categories'
import { HeroSlider } from '@/components/home/HeroSlider'
import { ValueStrip } from '@/components/home/ValueStrip'
import { TopCourses } from '@/components/home/TopCourses'
import { BrowseCategories } from '@/components/home/BrowseCategories'
import { StatsBlock } from '@/components/home/StatsBlock'
import { TestimonialsBlock } from '@/components/home/TestimonialsBlock'
import { ClientLogos } from '@/components/home/ClientLogos'
import { WebinarBanner } from '@/components/home/WebinarBanner'
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
  // Kick off all home-page data in parallel instead of letting each async child
  // component fetch sequentially on a cold cache. All functions are cache-backed
  // so on a warm cache this is effectively free; on a cold cache it saves ~6
  // sequential round-trips to the DB.
  const [
    slides,
    featuredCourses,
    categories,
    settings,
    courseCount,
    testimonials,
    logos,
    webinar,
  ] = await Promise.all([
    getHeroSlides(),
    getFeaturedCourses(),
    getCategoriesWithCourses(),
    getSettings(),
    getPublishedCourseCount(),
    getTestimonials(),
    getClientLogos(),
    getUpcomingWebinar(),
  ])

  return (
    <>
      <HeroSlider slides={slides} />
      <ValueStrip />
      <WebinarBanner webinar={webinar} />
      <TopCourses courses={featuredCourses} />
      <BrowseCategories categories={categories} />
      <StatsBlock settings={settings} courseCount={courseCount} />
      <TestimonialsBlock testimonials={testimonials} />
      <ClientLogos logos={logos} />
      <CtaBand />
    </>
  )
}
