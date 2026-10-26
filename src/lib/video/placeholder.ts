import type { Playback, VideoProvider } from './index'

const TTL_SECONDS = 300

function allowedOrigins(): string[] {
  return (process.env.VIDEO_ORIGINS ?? 'https://www.youtube.com,https://player.vimeo.com')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Turns watch/share links into embeddable ones so admins can paste what they copy from the browser. */
export function toEmbedUrl(ref: string): string {
  try {
    const u = new URL(ref)
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    if (u.hostname.endsWith('youtube.com') && u.pathname === '/watch' && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    }
    if (u.hostname === 'vimeo.com' && /^\/\d+$/.test(u.pathname)) return `https://player.vimeo.com/video${u.pathname}`
    return ref
  } catch {
    return ref
  }
}

/**
 * Demo provider. `placeholder:*` refs render a placeholder player. https refs on an allow-listed
 * origin are embedded as-is — NOTE: unlisted YouTube/Vimeo embeds are NOT content-protected;
 * production needs Bunny/Vimeo signed playback (see README).
 */
export class PlaceholderVideoProvider implements VideoProvider {
  getPlayback(videoRef: string | null): Playback {
    const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS
    if (videoRef && /^https:\/\//.test(videoRef)) {
      try {
        const src = toEmbedUrl(videoRef)
        const origin = new URL(src).origin
        if (allowedOrigins().includes(origin)) return { kind: 'embed', src, expiresAt }
      } catch {
        /* fall through */
      }
    }
    return { kind: 'placeholder', expiresAt }
  }
}
