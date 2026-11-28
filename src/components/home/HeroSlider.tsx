'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import type { HeroSlideDTO } from '@/lib/types'
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
      /* Full-bleed: no max-width, overflow-hidden stops any scrollbar. mb-4 matches the 16px gap on the old site. */
      className="relative w-full overflow-hidden h-[240px] sm:h-[320px] lg:h-[400px] mb-4"
    >
      {/* Full-bleed image — no overlay, full colour */}
      <PlaceholderArt
        src={s.image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-top"
      />

      {/* Text block — centred vertically at every width, white text directly on the image */}
      <div className="container-page relative z-10 flex h-[240px] sm:h-[320px] lg:h-[400px] items-center pb-10 lg:pb-0">
        <div
          data-testid="hero-panel"
          aria-roledescription="slide"
          aria-label={`${messages.home.slide} ${index + 1} / ${count}`}
          className="w-full max-w-[700px]"
        >
          <Heading className="text-white font-semibold text-[28px] leading-tight sm:text-4xl lg:text-[44px] lg:leading-[44px] [text-shadow:0_2px_4px_rgba(41,48,59,0.55)]">
            {s.heading}
          </Heading>
          <p data-testid="hero-sub" className="mt-3 text-base text-white lg:text-lg [text-shadow:0_2px_4px_rgba(41,48,59,0.55)]">
            {s.subheading}
          </p>
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
