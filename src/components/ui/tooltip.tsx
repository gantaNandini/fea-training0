'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils/cn'

export const TooltipProvider = TooltipPrimitive.Provider

/** Convenience wrapper: <Tip label="Add to wishlist"><button …/></Tip> */
export function Tip({
  label,
  children,
  side = 'top',
}: {
  label: string
  children: React.ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <TooltipPrimitive.Root delayDuration={300}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            'z-50 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-md dark:bg-slate-100 dark:text-slate-900',
          )}
        >
          {label}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
