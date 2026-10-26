'use client'

import Link from 'next/link'
import { GitCompareArrows } from 'lucide-react'
import { useCompare } from '@/hooks/useCompare'
import { messages } from '@/lib/messages'

/** Appears in the header once at least one course has been added to compare. */
export function CompareLink() {
  const { ids } = useCompare()
  if (ids.length === 0) return null
  return (
    <Link
      href={`/compare?ids=${ids.join(',')}`}
      aria-label={`${messages.nav.compare} (${ids.length})`}
      className="relative hidden h-11 w-11 items-center justify-center rounded-md hover:bg-muted sm:inline-flex"
    >
      <GitCompareArrows className="h-5 w-5" aria-hidden="true" />
      <span className="absolute right-0.5 top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-plum-700 px-1 text-xs font-bold text-white">
        {ids.length}
      </span>
    </Link>
  )
}
