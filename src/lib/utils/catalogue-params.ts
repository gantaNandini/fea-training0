import type { CourseFilters } from '@/lib/types'

export type RawParams = Record<string, string | string[] | undefined>
export type CatalogueState = CourseFilters & { view: 'grid' | 'list' }

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const SORTS = ['newest', 'price-asc', 'price-desc', 'rating', 'popular'] as const

function all(v: string | string[] | undefined): string[] {
  if (v == null) return []
  const arr = Array.isArray(v) ? v : [v]
  return arr.flatMap((x) => x.split(',')).map((x) => x.trim()).filter(Boolean)
}

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function nonNegInt(v: string | undefined): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 ? n : undefined
}

/** URL -> filters (REQ-087). Unknown values are dropped, never trusted. */
export function parseCatalogueParams(sp: RawParams): CatalogueState {
  const levels = all(sp.level).map((l) => l.toUpperCase()).filter((l) => LEVELS.includes(l))
  const sortRaw = one(sp.sort)
  const price = one(sp.price)
  const minRating = nonNegInt(one(sp.minRating))
  return {
    category: one(sp.category)?.slice(0, 80) || undefined,
    q: one(sp.q)?.trim().slice(0, 100) || undefined,
    levels: levels.length ? Array.from(new Set(levels)) : undefined,
    languages: all(sp.language).length ? Array.from(new Set(all(sp.language))) : undefined,
    price: price === 'free' || price === 'paid' ? price : undefined,
    minPrice: nonNegInt(one(sp.minPrice)),
    maxPrice: nonNegInt(one(sp.maxPrice)),
    minRating: minRating != null && minRating >= 1 && minRating <= 5 ? minRating : undefined,
    sort: (SORTS as readonly string[]).includes(sortRaw ?? '') ? (sortRaw as CourseFilters['sort']) : undefined,
    page: Math.max(1, nonNegInt(one(sp.page)) ?? 1),
    view: one(sp.view) === 'list' ? 'list' : 'grid',
  }
}

/** filters -> query string (stable order, omits defaults). */
export function toQueryString(state: Partial<CatalogueState>): string {
  const p = new URLSearchParams()
  if (state.category) p.set('category', state.category)
  if (state.q) p.set('q', state.q)
  state.levels?.forEach((l) => p.append('level', l.toLowerCase()))
  state.languages?.forEach((l) => p.append('language', l))
  if (state.price) p.set('price', state.price)
  if (state.minPrice != null) p.set('minPrice', String(state.minPrice))
  if (state.maxPrice != null) p.set('maxPrice', String(state.maxPrice))
  if (state.minRating != null) p.set('minRating', String(state.minRating))
  if (state.sort && state.sort !== 'newest') p.set('sort', state.sort)
  if (state.page && state.page > 1) p.set('page', String(state.page))
  if (state.view === 'list') p.set('view', 'list')
  const s = p.toString()
  return s ? `?${s}` : ''
}

export function activeFilterCount(state: CatalogueState): number {
  let n = 0
  if (state.category) n++
  if (state.price || state.minPrice != null || state.maxPrice != null) n++
  if (state.levels?.length) n++
  if (state.languages?.length) n++
  if (state.minRating != null) n++
  return n
}
