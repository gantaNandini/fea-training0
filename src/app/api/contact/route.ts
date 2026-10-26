import { ok, parseBody, tooMany } from '@/lib/api/http'
import { contactSchema } from '@/lib/utils/validation'
import { saveContactMessage } from '@/lib/data/content'
import { getSetting } from '@/lib/data/settings'
import { emailProvider } from '@/lib/email'
import { rateLimiter } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/net/ip'

/** REQ-212: persist, then notify the admin through the EmailProvider. */
export async function POST(req: Request) {
  const parsed = await parseBody(req, contactSchema)
  if (parsed.error) return parsed.error

  const limit = await rateLimiter.hit(`${getClientIp(req.headers)}:contact:*`, 10, 15 * 60)
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds)

  await saveContactMessage(parsed.data)
  try {
    const to = await getSetting('email')
    if (to) {
      await emailProvider.send({
        to,
        subject: `[Contact] ${parsed.data.subject}`,
        text: `From: ${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`,
      })
    }
  } catch (e) {
    console.error('[contact] email failed', e)
  }
  return ok({ success: true })
}
