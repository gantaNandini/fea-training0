import { z } from 'zod'
import { db } from '@/lib/db'
import { fail, ok, parseBody } from '@/lib/api/http'

export const dynamic = 'force-dynamic'

const registrationSchema = z.object({
  fullName:     z.string().min(2).max(120),
  email:        z.string().email().max(200),
  phone:        z.string().min(7).max(20),
  organisation: z.string().max(200).optional(),
  designation:  z.string().max(200).optional(),
})

/** POST /api/events/[eventId]/register — public, no auth required. */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await ctx.params

  // Fetch the event
  const event = await db.event.findUnique({
    where: { id: eventId, active: true },
    select: {
      id: true,
      title: true,
      internalRegistration: true,
      maxSeats: true,
      _count: { select: { registrations: true } },
    },
  })
  if (!event) return fail('NOT_FOUND', 'Event not found.', 404)
  if (!event.internalRegistration) {
    return fail('EXTERNAL_REGISTRATION', 'This event uses an external registration link.', 400)
  }

  // Check seat limit
  if (event.maxSeats !== null && event._count.registrations >= event.maxSeats) {
    return fail('SEATS_FULL', 'This event is fully booked.', 409)
  }

  // Validate body
  const parsed = await parseBody(req, registrationSchema)
  if (parsed.error) return parsed.error

  const { fullName, email, phone, organisation, designation } = parsed.data

  // Create registration — the unique constraint [eventId, email] prevents duplicates.
  // On a duplicate, return a friendly "already registered" message instead of updating.
  try {
    await db.eventRegistration.create({
      data: { eventId, fullName, email, phone, organisation: organisation ?? null, designation: designation ?? null },
    })
  } catch (err: unknown) {
    // Prisma unique-constraint violation (P2002) means this email is already registered
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return fail('DUPLICATE', 'You are already registered for this event. We will send joining details to your email.', 409)
    }
    throw err
  }

  return ok({ message: 'Registration successful! We will send joining details to your email.' })
}
