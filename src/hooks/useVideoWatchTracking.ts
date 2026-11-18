'use client'

import { useEffect, useRef, useState } from 'react'

type Range = [number, number]

/**
 * Tracks which seconds of an HTML5 <video> were genuinely PLAYED (not seeked over) and
 * reports them to /api/lessons/:id/watch every 15 s, on pause/end, and on page hide.
 * The server decides when the video is "completed" (≥ 90% of seconds covered).
 *
 * If the player is an <iframe> (YouTube/Vimeo), feed the same `addSecond` logic from
 * the provider's time events.
 */
export function useVideoWatchTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  lessonId: string,
  opts: {
    enabled?: boolean
    alreadyCompleted?: boolean
    onCompleted?: () => void
  } = {},
) {
  const { enabled = true, alreadyCompleted = false, onCompleted } = opts
  const [completed, setCompleted] = useState(alreadyCompleted)
  const pending = useRef<Range[]>([])
  const lastT = useRef<number | null>(null)
  const onDone = useRef(onCompleted)
  onDone.current = onCompleted

  useEffect(() => setCompleted(alreadyCompleted), [alreadyCompleted, lessonId])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !enabled || completed) return

    const add = (from: number, to: number) => {
      const a = Math.floor(from)
      const b = Math.ceil(to)
      if (b <= a) return
      const last = pending.current[pending.current.length - 1]
      if (last && a <= last[1]) last[1] = Math.max(last[1], b)
      else pending.current.push([a, b])
    }

    const onTime = () => {
      const t = v.currentTime
      if (
        !v.seeking &&
        !v.paused &&
        lastT.current !== null &&
        t > lastT.current &&
        t - lastT.current <= 2.5
      ) {
        add(lastT.current, t)
      }
      lastT.current = t
    }
    const onSeek = () => {
      lastT.current = null
    }

    let inFlight = false
    const flush = async (useBeacon = false) => {
      if (!pending.current.length || inFlight) return
      const ranges = pending.current
      const body = JSON.stringify({ ranges, duration: Math.round(v.duration || 0) })
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(`/api/lessons/${lessonId}/watch`, new Blob([body], { type: 'application/json' }))
        return
      }
      inFlight = true
      pending.current = []
      try {
        const res = await fetch(`/api/lessons/${lessonId}/watch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        })
        if (res.ok) {
          const j = (await res.json()) as { videoCompleted?: boolean }
          if (j.videoCompleted) {
            setCompleted(true)
            onDone.current?.()
          }
        } else if (res.status !== 422) {
          pending.current = [...ranges, ...pending.current]
        }
      } catch {
        pending.current = [...ranges, ...pending.current]
      } finally {
        inFlight = false
      }
    }

    const onPauseOrEnd = () => {
      lastT.current = null
      void flush()
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush(true)
    }
    const timer = window.setInterval(() => void flush(), 15000)

    v.addEventListener('timeupdate', onTime)
    v.addEventListener('seeking', onSeek)
    v.addEventListener('pause', onPauseOrEnd)
    v.addEventListener('ended', onPauseOrEnd)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.clearInterval(timer)
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('seeking', onSeek)
      v.removeEventListener('pause', onPauseOrEnd)
      v.removeEventListener('ended', onPauseOrEnd)
      document.removeEventListener('visibilitychange', onHide)
      void flush(true)
    }
  }, [videoRef, lessonId, enabled, completed])

  return { completed }
}
