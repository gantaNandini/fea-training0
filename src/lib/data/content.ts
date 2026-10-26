import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import type {
  AnnouncementDTO,
  ClientLogoDTO,
  HeroSlideDTO,
  TestimonialDTO,
  WebinarDTO,
} from '@/lib/types'

export const getHeroSlides = unstable_cache(
  async (): Promise<HeroSlideDTO[]> => {
    const rows = await db.heroSlide.findMany({ where: { active: true }, orderBy: { order: 'asc' }, take: 6 })
    return rows.map((r) => ({
      id: r.id,
      heading: r.heading,
      subheading: r.subheading,
      image: r.image,
      ctaLabel: r.ctaLabel,
      ctaUrl: r.ctaUrl,
      secondaryCtaLabel: r.secondaryCtaLabel,
      secondaryCtaUrl: r.secondaryCtaUrl,
    }))
  },
  ['hero-slides'],
  { tags: ['content'], revalidate: 3600 },
)

export const getTestimonials = unstable_cache(
  async (): Promise<TestimonialDTO[]> => {
    const rows = await db.testimonial.findMany({ where: { active: true }, orderBy: { order: 'asc' } })
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      company: r.company,
      quote: r.quote,
      photo: r.photo,
    }))
  },
  ['testimonials'],
  { tags: ['content'], revalidate: 3600 },
)

export const getClientLogos = unstable_cache(
  async (): Promise<ClientLogoDTO[]> => {
    const rows = await db.clientLogo.findMany({ where: { active: true }, orderBy: { order: 'asc' } })
    return rows.map((r) => ({ id: r.id, name: r.name, image: r.image, url: r.url }))
  },
  ['client-logos'],
  { tags: ['content'], revalidate: 3600 },
)

/** Active webinar with a future date (REQ-073). Short revalidate so it disappears on time. */
export const getUpcomingWebinar = unstable_cache(
  async (): Promise<WebinarDTO | null> => {
    const w = await db.webinar.findFirst({
      where: { active: true, date: { gt: new Date() } },
      orderBy: { date: 'asc' },
    })
    return w
      ? { id: w.id, title: w.title, date: w.date.toISOString(), link: w.link, description: w.description }
      : null
  },
  ['upcoming-webinar'],
  { tags: ['content'], revalidate: 300 },
)

/** Active announcement inside its window (REQ-075). */
export const getActiveAnnouncement = unstable_cache(
  async (): Promise<AnnouncementDTO | null> => {
    const now = new Date()
    const a = await db.announcement.findFirst({
      where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { startsAt: 'desc' },
    })
    return a ? { id: a.id, title: a.title, body: a.body, link: a.link } : null
  },
  ['active-announcement'],
  { tags: ['content'], revalidate: 300 },
)

export async function subscribeNewsletter(email: string) {
  await db.newsletterSubscriber.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase() },
    update: {},
  })
}

export async function saveContactMessage(input: {
  name: string
  email: string
  subject: string
  message: string
}) {
  await db.contactMessage.create({ data: input })
}
