import { PlaceholderVideoProvider } from './placeholder'

/** REQ-007 / REQ-181: playback descriptors are produced server-side, only for authorised users. */
export interface Playback {
  kind: 'placeholder' | 'embed'
  /** embed URL when kind === 'embed' */
  src?: string
  expiresAt: number
}

export interface VideoProvider {
  getPlayback(videoRef: string | null, ctx: { lessonId: string; userId: string }): Playback
}

export const videoProvider: VideoProvider = new PlaceholderVideoProvider()
