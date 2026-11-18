'use client'

import * as React from 'react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UserStateProvider } from './UserStateProvider'

// MoM item 5 (R5): dark mode removed; next-themes ThemeProvider is no longer needed.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      <UserStateProvider>{children}</UserStateProvider>
      <Toaster position="top-right" richColors closeButton />
    </TooltipProvider>
  )
}
