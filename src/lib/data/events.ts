import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import type { EventDTO } from '@/lib/events'

function toDTO(e: {
  id: string; kind: string; title: string; summary: string | null; description: string | null
  startsAt: Date; endsAt: Date | null; location: string | null; link: string | null; documentUrl: string | null; image: string | null
  seatLimit: number | null
}): EventDTO {
  return {
    id: e.id, kind: e.kind, title: e.title, summary: e.summary, description: e.description,
    startsAt: e.startsAt.toISOString(), endsAt: e.endsAt ? e.endsAt.toISOString() : null,
    location: e.location, link: e.link, documentUrl: e.documentUrl, image: e.image,
    seatLimit: e.seatLimit,
  }
}

/** All active events and batches, soonest first. Tag: `content`. */
export const getAllEvents = unstable_cache(
  async (): Promise<EventDTO[]> => {
    const rows = await db.event.findMany({ where: { active: true }, orderBy: { startsAt: 'asc' } })
    return rows.map(toDTO)
  },
  ['events-all-v2'],
  { tags: ['content', 'events'], revalidate: 300 },
)

export async function getEventById(id: string): Promise<EventDTO | null> {
  const all = await getAllEvents()
  return all.find((e) => e.id === id) ?? null
}

/** Real-time registration count for a single event (not cached — changes on every sign-up). */
export async function getEventRegistrationCount(eventId: string): Promise<number> {
  return db.eventRegistration.count({ where: { eventId } })
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
  ['upcoming-courses-v2'],
  { tags: ['courses', 'content'], revalidate: 300 },
)

export interface NewCourseDTO {
  id: string
  slug: string
  title: string
  shortDescription: string
  thumbnail: string | null
}

/** Newly launched courses: any non-draft course tagged `new-launch` (set in the course editor's Tags field). Newest first. */
export const getNewlyLaunchedCourses = unstable_cache(
  async (): Promise<NewCourseDTO[]> => {
    return db.course.findMany({
      where: { status: { in: ['PUBLISHED', 'UPCOMING'] }, tags: { has: 'new-launch' } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, slug: true, title: true, shortDescription: true, thumbnail: true },
    })
  },
  ['new-courses-v1'],
  { tags: ['courses', 'content'], revalidate: 600 },
)

export interface ProjectDTO {
  id: string
  category: string
  title: string
  summary: string
  description: string | null
  image: string | null
  client: string | null
  year: string | null
}

/** Active consultancy projects, ordered by category then display order. Tag: `content`. */
export const getConsultancyProjects = unstable_cache(
  async (): Promise<ProjectDTO[]> => {
    const rows = await db.consultancyProject.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })
    return rows.map((r) => ({
      id: r.id, category: r.category, title: r.title, summary: r.summary, description: r.description,
      image: r.image, client: r.client, year: r.year,
    }))
  },
  ['consultancy-projects-v1'],
  { tags: ['content', 'projects'], revalidate: 600 },
)
