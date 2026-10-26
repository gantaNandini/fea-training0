'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { btn } from './ui'
import type { ActionResult } from '@/lib/admin/guard'

/** Runs a (bound) server action, with optional confirmation, toast and page refresh. */
export function ActionButton({
  action,
  children,
  confirm,
  variant = 'outline',
  size = 'sm',
  label,
  className,
  redirectTo,
}: {
  action: () => Promise<ActionResult>
  children: React.ReactNode
  confirm?: string
  variant?: 'primary' | 'info' | 'outline' | 'danger' | 'ghost'
  size?: 'md' | 'sm'
  label?: string
  className?: string
  redirectTo?: string
}) {
  const router = useRouter()
  const [pending, start] = React.useTransition()
  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      className={`${btn(variant, size)} ${className ?? ''}`}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return
        start(async () => {
          const res = await action()
          if (res.ok) {
            if (res.message) toast.success(res.message)
            if (redirectTo) router.push(redirectTo)
            router.refresh()
          } else toast.error(res.error)
        })
      }}
    >
      {children}
    </button>
  )
}
