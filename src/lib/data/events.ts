import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import type { EventDTO } from '@/lib/events'

function toDTO(e: {
  id: string; kind: string; title: string; summary: string | null; description: string | null
  startsAt: Date; endsAt: Date | null; location: string | null; link: string | null; documentUrl: string | null; image: string | null
  internalRegistration: boolean; maxSeats: number | null; _count: { registrations: number }
}): EventDTO {
  return {
    id: e.id, kind: e.kind, title: e.title, summary: e.summary, description: e.description,
    startsAt: e.startsAt.toISOString(), endsAt: e.endsAt ? e.endsAt.toISOString() : null,
    location: e.location, link: e.link, documentUrl: e.documentUrl, image: e.image,
    internalRegistration: e.internalRegistration, maxSeats: e.maxSeats,
    registrationCount: e._count.registrations,
  }
}

/** All active events and batches, soonest first. Tag: `content`. */
export const getAllEvents = unstable_cache(
  async (): Promise<EventDTO[]> => {
    const rows = await db.event.findMany({
      where: { active: true },
      orderBy: { startsAt: 'asc' },
      include: { _count: { select: { registrations: true } } },
    })
    return rows.map(toDTO)
  },
  ['events-all-v2'],
  { tags: ['content', 'events'], revalidate: 600 },
)

export async function getEventById(id: string): Promise<EventDTO | null> {
  const all = await getAllEvents()
  return all.find((e) => e.id === id) ?? null
}

export interface UpcomingCourseDTO {
  id: string
  slug: string
  title: string
  shortDescription: string
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  thumbnail: string | null
  durationHours: number | null
}

/** Courses with status UPCOMING ("coming soon"). */
export const getUpcomingCourses = unstable_cache(
  async (): Promise<UpcomingCourseDTO[]> => {
    const rows = await db.course.findMany({
      where: { status: 'UPCOMING' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, slug: true, title: true, shortDescription: true, level: true, thumbnail: true, durationHours: true },
    })
    return rows
  },
  ['upcoming-courses-v1'],
  { tags: ['courses', 'content'], revalidate: 600 },
)
