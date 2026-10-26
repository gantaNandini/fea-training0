import type { TestimonialDTO } from '@/lib/types'
import { getTestimonials } from '@/lib/data/content'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { Testimonials } from './Testimonials'
import { messages } from '@/lib/messages'

export async function TestimonialsBlock({ testimonials }: { testimonials?: TestimonialDTO[] }) {
  const items = testimonials ?? await getTestimonials()
  if (items.length === 0) return null
  return (
    <section className="section-y bg-surface-alt" aria-labelledby="testimonials-heading">
      <div className="container-page">
        <SectionHeader id="testimonials-heading" title={messages.home.testimonials} subtitle={messages.home.testimonialsSub} />
        <Testimonials items={items} />
      </div>
    </section>
  )
}
