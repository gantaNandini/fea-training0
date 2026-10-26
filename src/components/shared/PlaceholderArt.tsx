import Image, { type ImageProps } from 'next/image'
import { isPlaceholder, resolvePlaceholder } from '@/lib/placeholder'

type Props = Omit<ImageProps, 'src' | 'alt'> & {
  src?: string | null
  alt: string
  /** text used by initials-style placeholders (avatars, logos) */
  label?: string
}

/**
 * Returns true if `src` is a usable image value that next/image can handle:
 * - absolute URL  (http:// or https://)
 * - root-relative path  (/uploads/... or /api/files/...)
 * - data URI  (data:image/...)
 * Everything else (bare slugs, empty strings, null) is treated as missing.
 */
function isValidSrc(src: string): boolean {
  return (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('/') ||
    src.startsWith('data:')
  )
}

/**
 * The single image wrapper (REQ-006): always renders `next/image`.
 * `placeholder:{key}` values are turned into a generated SVG data URI.
 * Bare slugs or other invalid src values fall back to the placeholder
 * instead of crashing with "Failed to construct URL".
 */
export function PlaceholderArt({ src, alt, label, ...rest }: Props) {
  // Explicit placeholder key
  if (src && isPlaceholder(src)) {
    return <Image src={resolvePlaceholder(src, label ?? alt)} alt={alt} unoptimized {...rest} />
  }

  // Valid image src — pass straight through
  if (src && isValidSrc(src)) {
    const local = src.startsWith('/api/files/') || src.startsWith('data:')
    return <Image src={src} alt={alt} unoptimized={local} {...rest} />
  }

  // Missing, null, or invalid (bare slug etc.) — generate a placeholder
  const fallbackKey = 'placeholder:default'
  return <Image src={resolvePlaceholder(fallbackKey, label ?? alt)} alt={alt} unoptimized {...rest} />
}
