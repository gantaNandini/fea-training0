import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

const DEFAULT_TAGS = ['settings', 'categories', 'courses', 'content', 'reviews']

/** REQ-290D: dev-only cache bust (404 in production). Header: X-Revalidate-Secret. */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') return new NextResponse('Not found', { status: 404 })
  const secret = process.env.DEV_REVALIDATE_SECRET
  if (!secret || req.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const extra = new URL(req.url).searchParams.get('tag')
  const tags = extra ? [extra] : DEFAULT_TAGS
  for (const t of tags) revalidateTag(t)
  return NextResponse.json({ revalidated: tags })
}
