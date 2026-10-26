import { NextResponse } from 'next/server'
import { getCourses } from '@/lib/data/courses'
import { parseCatalogueParams, type RawParams } from '@/lib/utils/catalogue-params'

function toRaw(sp: URLSearchParams): RawParams {
  const raw: RawParams = {}
  for (const key of new Set(sp.keys())) {
    const all = sp.getAll(key)
    raw[key] = all.length > 1 ? all : all[0]
  }
  return raw
}

/** REQ-280: filters/sort/pagination; no per-user fields; money in integer paise. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const state = parseCatalogueParams(toRaw(sp))
  const pageSize = Number(sp.get('pageSize'))
  const { view: _view, ...filters } = state
  void _view
  const result = await getCourses({
    ...filters,
    pageSize: Number.isInteger(pageSize) && pageSize > 0 ? pageSize : undefined,
  })
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}
