'use client'

import * as React from 'react'
import { Pause, Play } from 'lucide-react'
import type { ClientLogoDTO } from '@/lib/types'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { messages } from '@/lib/messages'

function Logo({ logo, hidden }: { logo: ClientLogoDTO; hidden?: boolean }) {
  const img = (
    <span className="relative block h-16 w-40 overflow-hidden rounded-lg bg-white grayscale transition hover:grayscale-0 focus-visible:grayscale-0">
      <PlaceholderArt src={logo.image} alt={hidden ? '' : logo.name} label={logo.name} fill sizes="160px" className="object-contain p-2" />
    </span>
  )
  if (logo.url) {
    return (
      <a
        href={logo.url}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={hidden ? -1 : undefined}
        aria-label={hidden ? undefined : logo.name}
        className="shrink-0"
      >
        {img}
      </a>
    )
  }
  return <span className="shrink-0">{img}</span>
}

/**
 * Auto-scrolling logos (REQ-072). The duplicated list that makes the loop seamless is aria-hidden
 * with tabIndex -1. Under prefers-reduced-motion a static grid is shown instead and the
 * Pause/Play control is hidden (Tailwind `motion-reduce:` variants).
 */
export function Marquee({ logos }: { logos: ClientLogoDTO[] }) {
  const [paused, setPaused] = React.useState(false)
  return (
    <div>
      <div className="mb-3 flex justify-end motion-reduce:hidden">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
        >
          {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
          {paused ? messages.home.playLogos : messages.home.pauseLogos}
        </button>
      </div>
      <div className="marquee overflow-hidden motion-reduce:hidden" data-paused={paused}>
        <div className="marquee-track gap-6">
          <ul className="flex shrink-0 items-center gap-6 pr-6">
            {logos.map((l) => (
              <li key={l.id}>
                <Logo logo={l} />
              </li>
            ))}
          </ul>
          <ul className="flex shrink-0 items-center gap-6 pr-6" aria-hidden="true">
            {logos.map((l) => (
              <li key={`dup-${l.id}`}>
                <Logo logo={l} hidden />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ul className="hidden grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 motion-reduce:grid">
        {logos.map((l) => (
          <li key={`grid-${l.id}`} className="flex justify-center">
            <Logo logo={l} />
          </li>
        ))}
      </ul>
    </div>
  )
}
