import * as React from 'react'
import { cn } from '@/lib/utils/cn'

type Tone = 'neutral' | 'plum' | 'success' | 'warning' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  plum: 'bg-plum-100 text-plum-800 dark:bg-plum-900 dark:text-plum-100',
  success: 'bg-green-100 text-success-text dark:bg-green-950 dark:text-green-300',
  warning: 'bg-amber-100 text-warning-text dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-100 text-danger-text dark:bg-red-950 dark:text-red-300',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
