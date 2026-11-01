/** Shared (server + client) helpers for lesson files of any type. */

export type FileKind = 'video' | 'audio' | 'pdf' | 'image' | 'text' | 'other'

const VIDEO = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogv'])
const AUDIO = new Set(['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'])
const IMAGE = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])

export function extensionOf(ref: string): string {
  const clean = ref.split('?')[0]?.split('#')[0] ?? ''
  const last = clean.split('/').pop() ?? ''
  return last.includes('.') ? (last.split('.').pop() ?? '').toLowerCase() : ''
}

export function fileKindOf(ref: string | null | undefined): FileKind {
  if (!ref) return 'other'
  const ext = extensionOf(ref)
  if (VIDEO.has(ext)) return 'video'
  if (AUDIO.has(ext)) return 'audio'
  if (ext === 'pdf') return 'pdf'
  if (IMAGE.has(ext)) return 'image'
  if (ext === 'txt') return 'text'
  return 'other'
}

/** A file we host ourselves (local `docs/…` key or a Vercel Blob URL), as opposed to a YouTube/Vimeo link. */
export function isHostedFile(ref: string | null | undefined): boolean {
  if (!ref) return false
  if (ref.startsWith('docs/')) return true
  try {
    return new URL(ref).hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}

export function displayFileName(ref: string): string {
  const last = decodeURIComponent((ref.split('?')[0] ?? '').split('/').pop() ?? ref)
  // strip the random suffix Blob appends: name-AbC123xyz.ext -> name.ext
  return last.replace(/-[A-Za-z0-9]{20,}(\.[a-z0-9]+)?$/, '$1')
}
