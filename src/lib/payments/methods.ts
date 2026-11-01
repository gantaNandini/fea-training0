/**
 * Payment categories shown on the checkout page (client-safe: no secrets, no server imports).
 * Choosing a category opens the official Razorpay Checkout restricted to that method. This is only a
 * display filter: the payment itself is always verified on the server (signature check + gateway
 * lookup) before any course access is granted.
 */
export type PayChoice = 'razorpay' | 'debit' | 'credit' | 'netbanking' | 'wallet'

export interface PayOption {
  id: PayChoice
  label: string
  hint: string
  /** card networks are not restricted here: Visa, Mastercard and RuPay appear wherever enabled on the account */
  badges?: string[]
}

export const PAY_OPTIONS: PayOption[] = [
  { id: 'razorpay', label: 'Razorpay', hint: 'All available payment methods', badges: ['Cards', 'Net Banking', 'Wallets'] },
  { id: 'debit', label: 'Debit Card', hint: 'Pay with your bank debit card', badges: ['Visa', 'Mastercard', 'RuPay'] },
  { id: 'credit', label: 'Credit Card', hint: 'Pay with your credit card', badges: ['Visa', 'Mastercard', 'RuPay'] },
  { id: 'netbanking', label: 'Net Banking', hint: 'Pay from your bank account' },
  { id: 'wallet', label: 'Wallets', hint: 'Pay with a mobile wallet' },
]

const BLOCK_NAMES: Record<Exclude<PayChoice, 'razorpay'>, string> = {
  debit: 'Pay using Debit Card',
  credit: 'Pay using Credit Card',
  netbanking: 'Pay using Net Banking',
  wallet: 'Pay using a Wallet',
}

/** Razorpay Checkout `config` for the chosen category (undefined = Razorpay's own default, all methods). */
export function checkoutConfig(choice: PayChoice): Record<string, unknown> | undefined {
  // The generic Razorpay option opens the FULL checkout: every method enabled on the merchant account
  // (UPI incl. a per-order QR, cards, net banking, wallets). Nothing is hidden.
  if (choice === 'razorpay') return undefined
  const instrument =
    choice === 'debit'
      ? { method: 'card', types: ['debit'] }
      : choice === 'credit'
        ? { method: 'card', types: ['credit'] }
        : choice === 'netbanking'
          ? { method: 'netbanking' }
          : { method: 'wallet' }
  return {
    display: {
      blocks: { chosen: { name: BLOCK_NAMES[choice], instruments: [instrument] } },
      sequence: ['block.chosen'],
      preferences: { show_default_blocks: false },
    },
  }
}

/** Parses the admin setting `payment_tiles` (comma-separated ids). Falls back to the Razorpay tile only. */
export function parseTiles(raw: string | undefined | null): PayChoice[] {
  const ids = new Set(PAY_OPTIONS.map((o) => o.id))
  const picked = (raw ?? '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter((x): x is PayChoice => ids.has(x as PayChoice))
  return picked.length ? picked : ['razorpay']
}
