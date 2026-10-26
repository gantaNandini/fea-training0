import type { Metadata } from 'next'

export const SITE_NAME = 'PYTHAGORAS'

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXTAUTH_URL ??
  'http://localhost:3000'
).replace(/\/$/, '')

export function absoluteUrl(path = '/'): string {
  return new URL(path, SITE_URL).toString()
}

interface MetaInput {
  title: string
  description: string
  path?: string
  image?: string | null
  noIndex?: boolean
}

/** REQ-291 / REQ-294: title, description, OpenGraph, Twitter and a canonical URL on every page. */
export function buildMetadata({ title, description, path = '/', image, noIndex }: MetaInput): Metadata {
  const url = absoluteUrl(path)
  const images = image ? [{ url: image }] : undefined
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: 'website', images },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  }
}
