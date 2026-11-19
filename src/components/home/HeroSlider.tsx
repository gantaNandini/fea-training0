'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import type { HeroSlideDTO } from '@/lib/types'
import { ButtonLink } from '@/components/ui/button'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { messages } from '@/lib/messages'
import { cn } from '@/lib/utils/cn'

const INTERVAL_MS = 5000

export function HeroSlider({ slides }: { slides: HeroSlideDTO[] }) {
  const [index, setIndex] = React.useState(0)
  const [userPaused, setUserPaused] = React.useState(false)
  const [hovering, setHovering] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const count = slides.length

  const playing = !reduced && !userPaused && !hovering && !focused && count > 1

  React.useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS)
    return () => clearInterval(t)
  }, [playing, count])

  const go = (i: number) => setIndex((i + count) % count)

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1) }
  }

  if (count === 0) return null

  const s = slides[index]
  const Heading = index === 0 ? 'h1' : 'h2'

  return (
    <section
      aria-roledescription="carousel"
      aria-label={messages.home.heroLabel}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      onKeyDown={onKeyDown}
      data-testid="hero"
      /* Full-bleed: no max-width, overflow-hidden stops any scrollbar */
      className="relative w-full overflow-hidden min-h-[70svh] lg:min-h-[calc(100svh-6.75rem)]"
    >
      {/* Full-bleed image — no overlay, full colour */}
      <PlaceholderArt
        src={s.image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Text card container
          Mobile:  card pinned to the bottom so image shows above (items-end, pb-20)
          Desktop: card centred vertically on the left (lg:items-center, lg:pb-0) */}
      <div className="container-page relative z-10 flex min-h-[70svh] items-end pb-20 lg:min-h-[calc(100svh-6.75rem)] lg:items-center lg:pb-0">
        <div
          data-testid="hero-panel"
          aria-roledescription="slide"
          aria-label={`${messages.home.slide} ${index + 1} / ${count}`}
          className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-lg backdrop-blur-sm md:p-10"
        >
          <Heading className="text-foreground">{s.heading}</Heading>
          <p data-testid="hero-sub" className="mt-4 text-lg text-muted-foreground">
            {s.subheading}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={s.ctaUrl} size="lg">
              {s.ctaLabel}
            </ButtonLink>
            {s.secondaryCtaLabel && s.secondaryCtaUrl ? (
              <ButtonLink href={s.secondaryCtaUrl} size="lg" variant="outline">
                {s.secondaryCtaLabel}
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </div>

      {/* Slider controls — white pill at the bottom of the hero */}
      {count > 1 ? (
        <div className="absolute inset-x-0 bottom-4 z-20 container-page flex items-center justify-between">
          <div className="flex items-center gap-0.5 rounded-full border border-border bg-white/80 p-1 shadow-sm backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused || reduced ? messages.home.playSlides : messages.home.pauseSlides}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-foreground/10"
            >
              {userPaused || reduced
                ? <Play className="h-4 w-4" aria-hidden="true" />
                : <Pause className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={messages.home.previousSlide}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-foreground/10"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={messages.home.nextSlide}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-foreground/10"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center rounded-full border border-border bg-white/80 px-1 shadow-sm backdrop-blur-sm">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`${messages.home.goToSlide} ${i + 1}`}
                aria-current={i === index}
                className="inline-flex h-9 w-7 items-center justify-center"
              >
                <span
                  className={cn(
                    'block h-2 rounded-full bg-foreground transition-all duration-300',
                    i === index ? 'w-5 opacity-70' : 'w-2 opacity-25',
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
