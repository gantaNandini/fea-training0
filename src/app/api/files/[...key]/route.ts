import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { safeResolve, verifySignedKey } from '@/lib/storage/local'

const TYPES: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  pdf: 'application/pdf',
}

/**
 * Serves local uploads. Avatars and site media (course/hero images) are public; everything else needs a valid short-lived signature
 * (REQ-181). Keys are validated against traversal (REQ-315).
 */
export async function GET(req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await ctx.params
  const key = parts.join('/')
  if (!safeResolve(key)) return new NextResponse('Not found', { status: 404 })

  const isPublic = key.startsWith('avatars/') || key.startsWith('media/')
  if (!isPublic) {
    const sp = new URL(req.url).searchParams
    if (!verifySignedKey(key, Number(sp.get('exp')), sp.get('sig') ?? '')) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  const data = await storage.read(key)
  if (!data) return new NextResponse('Not found', { status: 404 })
  const ext = key.split('.').pop()?.toLowerCase() ?? ''
  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': TYPES[ext] ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': isPublic ? 'public, max-age=3600' : 'private, no-store',
      'Content-Disposition': ext === 'pdf' ? 'inline' : 'inline',
    },
  })
}
