import { ok, parseBody } from '@/lib/api/http'
import { newsletterSchema } from '@/lib/utils/validation'
import { subscribeNewsletter } from '@/lib/data/content'

/** REQ-290A: upsert; duplicates are silently accepted. */
export async function POST(req: Request) {
  const parsed = await parseBody(req, newsletterSchema)
  if (parsed.error) return parsed.error
  await subscribeNewsletter(parsed.data.email)
  return ok({ success: true })
}
