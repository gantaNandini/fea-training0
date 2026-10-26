'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { messages } from '@/lib/messages'

/** Coupon input. Validation happens on the server (REQ-133); invalid -> inline error. */
export function CouponField({
  applied,
  error,
  onApply,
  onRemove,
}: {
  applied: string | null
  error: string | null
  onApply: (code: string) => void
  onRemove: () => void
}) {
  const [code, setCode] = React.useState('')
  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-sm dark:bg-green-950/40">
        <span className="font-semibold text-success-text dark:text-green-300">
          {messages.cart.couponApplied}: {applied}
        </span>
        <button type="button" onClick={onRemove} className="min-h-11 px-2 font-semibold text-link underline-offset-4 hover:underline">
          {messages.cart.removeCoupon}
        </button>
      </div>
    )
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (code.trim()) onApply(code.trim())
      }}
      noValidate
    >
      <Label htmlFor="coupon-code">{messages.cart.couponLabel}</Label>
      <div className="flex gap-2">
        <Input
          id="coupon-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={messages.cart.couponPlaceholder}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? 'coupon-error' : undefined}
        />
        <Button type="submit" variant="outline">
          {messages.cart.applyCoupon}
        </Button>
      </div>
      {error ? (
        <p id="coupon-error" role="alert" className="mt-1.5 text-sm font-medium text-danger-text dark:text-red-300">
          {error}
        </p>
      ) : null}
    </form>
  )
}
