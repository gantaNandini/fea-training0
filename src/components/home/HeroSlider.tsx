'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import type { HeroSlideDTO } from '@/lib/types'
import { ButtonLink } from '@/components/ui/button'
import { FeaVisual } from './FeaVisual'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { messages } from '@/lib/messages'
import { cn } from '@/lib/utils/cn'

const INTERVAL_MS = 5000

/**
 * Hero slider (REQ-060..063): autoplay 5 s; pauses on hover/focus; visible Pause/Play (WCAG 2.2.2);
 * dots + arrows; Left/Right keys; no autoplay under prefers-reduced-motion. Text always sits on a
 * solid plum-900 scrim at 85% opacity, so contrast holds on any image.
 */
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
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(index + 1)
    }
  }

  if (count === 0) return null

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
      className="relative overflow-hidden bg-plum-900"
      data-testid="hero"
    >
      <div aria-live="polite" aria-atomic="true">
        {slides.map((s, i) => {
          const Heading = i === 0 ? 'h1' : 'h2'
          const active = i === index
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${messages.home.slide} ${i + 1} / ${count}`}
              hidden={!active}
              className="relative min-h-[30rem] md:min-h-[34rem]"
            >
              <PlaceholderArt
                src={s.image}
                alt=""
                fill
                priority={i === 0}
                loading={i === 0 ? undefined : 'lazy'}
                sizes="100vw"
                className="object-cover"
              />
              {/* decorative brand-gradient scrim (REQ-021) */}
              <div className="gradient-brand absolute inset-0 opacity-50" aria-hidden="true" />
              <div className="container-page relative flex min-h-[30rem] items-center py-12 md:min-h-[34rem]">
                {/* solid plum-900 >= 75% opacity text panel (REQ-063) */}
                <div data-testid="hero-panel" className="max-w-2xl rounded-xl bg-plum-900/85 p-6 text-white md:p-10">
                  <Heading className="text-white">{s.heading}</Heading>
                  <p data-testid="hero-sub" className="mt-4 text-lg text-white">
                    {s.subheading}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <ButtonLink href={s.ctaUrl} size="lg" className="ring-2 ring-white/70">
                      {s.ctaLabel}
                    </ButtonLink>
                    {s.secondaryCtaLabel && s.secondaryCtaUrl ? (
                      <ButtonLink
                        href={s.secondaryCtaUrl}
                        size="lg"
                        variant="outline"
                        className="border-white bg-transparent text-white hover:bg-white/15"
                      >
                        {s.secondaryCtaLabel}
                      </ButtonLink>
                    ) : null}
                  </div>
                </div>
                <div className="ml-auto hidden w-full max-w-sm pl-8 text-white lg:block xl:max-w-md" aria-hidden="true">
                  {active ? <FeaVisual /> : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {count > 1 ? (
        <div className="container-page absolute inset-x-0 bottom-3 z-10 flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-full bg-plum-900/85 p-1 text-white">
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused || reduced ? messages.home.playSlides : messages.home.pauseSlides}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/15"
            >
              {userPaused || reduced ? (
                <Play className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Pause className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={messages.home.previousSlide}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/15"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={messages.home.nextSlide}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/15"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center rounded-full bg-plum-900/85 px-1">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`${messages.home.goToSlide} ${i + 1}`}
                aria-current={i === index}
                className="inline-flex h-11 w-8 items-center justify-center"
              >
                <span
                  className={cn(
                    'block h-2.5 rounded-full bg-white transition-all',
                    i === index ? 'w-6' : 'w-2.5 opacity-60',
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
