import { NextResponse } from 'next/server'
import { getSearchSuggestions } from '@/lib/data/courses'

/** REQ-281: >= 2 chars; up to 8 course titles and 4 category names. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q') ?? ''
  const data = await getSearchSuggestions(q.slice(0, 100))
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
  })
}
