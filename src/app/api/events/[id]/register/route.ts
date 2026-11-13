// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- needs Prisma.PrismaClientKnownRequestError for P2002 detection
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { fail, notFound, ok, parseBody, tooMany } from '@/lib/api/http'
import { eventRegistrationSchema } from '@/lib/utils/validation'
import { rateLimiter } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/net/ip'
import { isUpcoming } from '@/lib/events'

type Ctx = { params: Promise<{ id: string }> }

/** Public sign-up for a webinar or workshop. Never returns other people's data. */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params
  const parsed = await parseBody(req, eventRegistrationSchema)
  if (parsed.error) return parsed.error

  const limit = await rateLimiter.hit(`${getClientIp(req.headers)}:event-register:*`, 15, 15 * 60)
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds)

  const event = await db.event.findFirst({ where: { id, active: true } })
  if (!event || !['WEBINAR', 'WORKSHOP'].includes(event.kind)) return notFound('This event is not open for registration.')
  if (!isUpcoming(event)) return fail('EVENT_ENDED', 'Registration for this event has closed.', 410)

  const d = parsed.data
  const registrationData = {
    eventId: event.id,
    fullName: d.fullName,
    email: d.email,
    phone: d.phone,
    organisation: d.organisation,
    designation: d.designation ? d.designation : null,
  }

  try {
    if (event.seatLimit !== null && event.seatLimit > 0) {
      // Atomic seat-limit enforcement: serialisable transaction prevents overselling
      // when two requests arrive simultaneously at the last seat.
      await db.$transaction(async (tx) => {
        const taken = await tx.eventRegistration.count({ where: { eventId: event.id } })
        if (taken >= event.seatLimit!) {
          throw Object.assign(new Error('SEATS_FULL'), { code: 'SEATS_FULL' })
        }
        await tx.eventRegistration.create({ data: registrationData })
      }, { isolationLevel: 'Serializable' })
    } else {
      // No seat limit — simple insert (webinars are unlimited by default)
      await db.eventRegistration.create({ data: registrationData })
    }
  } catch (e: unknown) {
    const code = e instanceof Error ? (e as { code?: string }).code : undefined
    if (code === 'SEATS_FULL') {
      return fail('SEATS_FULL', 'This event is fully booked. No seats remain.', 409)
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return fail('ALREADY_REGISTERED', 'This email address is already registered for this event.', 409)
    }
    console.error('[event-register]', e)
    return fail('SERVER_ERROR', 'Something went wrong. Please try again.', 500)
  }
  return ok({ success: true })
}
