import { fail, ok, parseBody, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { CreateOrderError, createOrderForUser } from '@/lib/orders/create-order'
import { createOrderSchema } from '@/lib/utils/validation'
import { getSettings } from '@/lib/data/settings'
import { messages } from '@/lib/messages'

/** Razorpay checkout `config.display.hide` entries for the configured payment-method policy. */
function hiddenMethods(policy: string | undefined): { method: string }[] {
  const all = ['netbanking', 'wallet', 'emi', 'paylater', 'upi', 'cardless_emi']
  const hide = policy === 'all' ? [] : policy === 'cards_upi' ? all.filter((m) => m !== 'upi') : all
  return hide.map((method) => ({ method }))
}

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
    if (result.free) return ok(result)
    const settings = await getSettings()
    return ok({ ...result, hideMethods: hiddenMethods(settings.payment_methods) })
  } catch (e) {
    if (e instanceof CreateOrderError) {
      const status = e.code === 'PROVIDER_ERROR' ? 502 : e.code === 'ALREADY_ENROLLED' ? 409 : 400
      return fail(e.code, e.message, status)
    }
    console.error('[create-order]', e)
    return fail('SERVER_ERROR', messages.checkout.errorGeneric, 500)
  }
}
