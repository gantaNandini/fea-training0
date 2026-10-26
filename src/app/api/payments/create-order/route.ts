import { fail, ok, parseBody, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { CreateOrderError, createOrderForUser } from '@/lib/orders/create-order'
import { createOrderSchema } from '@/lib/utils/validation'
import { messages } from '@/lib/messages'

export const dynamic = 'force-dynamic'

/** REQ-141. 401 UNAUTHENTICATED when there is no session; the client performs the redirect. */
export async function POST(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  const parsed = await parseBody(req, createOrderSchema)
  if (parsed.error) return parsed.error

  try {
    const result = await createOrderForUser(
      { id: user.id, name: user.name, email: user.email },
      parsed.data.couponCode,
    )
    return ok(result)
  } catch (e) {
    if (e instanceof CreateOrderError) {
      const status = e.code === 'PROVIDER_ERROR' ? 502 : e.code === 'ALREADY_ENROLLED' ? 409 : 400
      return fail(e.code, e.message, status)
    }
    console.error('[create-order]', e)
    return fail('SERVER_ERROR', messages.checkout.errorGeneric, 500)
  }
}
