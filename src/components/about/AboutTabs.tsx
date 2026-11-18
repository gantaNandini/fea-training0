'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/about', label: 'About' },
  { href: '/about/trainee-details', label: 'Trainee Details' },
]

/** Tab bar shown above both /about and /about/trainee-details (MoM item 3, R3). */
export function AboutTabs() {
  const path = usePathname()
  return (
    <div role="tablist" aria-label="About sections" className="mb-8 flex gap-1 border-b border-border">
      {TABS.map((t) => {
        const active = path === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            role="tab"
            aria-selected={active}
            className={`-mb-px min-h-11 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
