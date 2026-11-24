import { ok, parseBody, tooMany } from '@/lib/api/http'
import { contactSchema } from '@/lib/utils/validation'
import { saveContactMessage } from '@/lib/data/content'
import { contactRecipient, oneLine } from '@/lib/contact-mail'
import { emailProvider } from '@/lib/email'
import { rateLimiter } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/net/ip'

/** REQ-212: save the message (shows in Admin), then email it to the contact inbox with Reply-To = sender. */
export async function POST(req: Request) {
  const parsed = await parseBody(req, contactSchema)
  if (parsed.error) return parsed.error

  // Honeypot: pretend it worked, store nothing, send nothing.
  if (parsed.data.website?.trim()) return ok({ success: true })

  const limit = await rateLimiter.hit(`${getClientIp(req.headers)}:contact:*`, 5, 15 * 60)
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds)

  const { name, email, subject, message } = parsed.data
  await saveContactMessage({ name, email, subject, message })
  try {
    await emailProvider.send({
      to: await contactRecipient(),
      replyTo: email,
      subject: `[Contact] ${oneLine(subject)}`,
      text: `Name: ${oneLine(name)}\nEmail: ${email}\nSubject: ${oneLine(subject)}\n\n${message}`,
    })
  } catch (e) {
    console.error('[contact] email failed', e)
  }
  return ok({ success: true })
}
