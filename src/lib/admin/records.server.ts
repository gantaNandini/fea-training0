import { db } from '@/lib/db'
import { MODELS, type Field, type ModelKey } from './models'

/** Server-side adapters for the generic record manager. Only these models/fields can be written. */

type Row = Record<string, unknown> & { id: string }
interface Delegate {
  findMany(args: unknown): Promise<Row[]>
  create(args: { data: Record<string, unknown> }): Promise<Row>
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<Row>
  delete(args: { where: { id: string } }): Promise<unknown>
}

const delegates: Record<ModelKey, Delegate> = {
  category: db.category as unknown as Delegate,
  coupon: db.coupon as unknown as Delegate,
  heroSlide: db.heroSlide as unknown as Delegate,
  testimonial: db.testimonial as unknown as Delegate,
  clientLogo: db.clientLogo as unknown as Delegate,
  webinar: db.webinar as unknown as Delegate,
  announcement: db.announcement as unknown as Delegate,
}

const orderBy: Record<ModelKey, unknown> = {
  category: [{ order: 'asc' }, { name: 'asc' }],
  coupon: { code: 'asc' },
  heroSlide: { order: 'asc' },
  testimonial: { order: 'asc' },
  clientLogo: { order: 'asc' },
  webinar: { date: 'desc' },
  announcement: { startsAt: 'desc' },
}

export const MODEL_TAGS: Record<ModelKey, string[]> = {
  category: ['categories', 'courses'],
  coupon: [],
  heroSlide: ['content'],
  testimonial: ['content'],
  clientLogo: ['content'],
  webinar: ['content'],
  announcement: ['content'],
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const pad = (n: number) => String(n).padStart(2, '0')
/** Date -> value for <input type="datetime-local"> in the server's local zone. */
function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export type FormValues = Record<string, string | boolean>

/** DB row -> what the form shows. */
function toDisplay(key: ModelKey, row: Row): FormValues & { id: string } {
  const out: Record<string, string | boolean> = { id: row.id }
  for (const f of MODELS[key].fields) {
    const v = row[f.name]
    if (f.type === 'checkbox') out[f.name] = Boolean(v)
    else if (f.type === 'datetime') out[f.name] = v instanceof Date ? toLocalInput(v) : ''
    else out[f.name] = v == null ? '' : String(v)
  }
  if (key === 'coupon') {
    out.value = String(Number(row.discountValue) / 100)
    out.usedCount = String(row.usedCount ?? 0)
  }
  return out as FormValues & { id: string }
}

export async function listRecords(key: ModelKey) {
  const rows = await delegates[key].findMany({ orderBy: orderBy[key] })
  return rows.map((r) => toDisplay(key, r))
}

function parseField(f: Field, raw: string | boolean | undefined): { ok: true; value: unknown } | { ok: false; error: string } {
  if (f.type === 'checkbox') return { ok: true, value: raw === true || raw === 'true' }
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (s === '') {
    if (f.required) return { ok: false, error: `${f.label} is required.` }
    return { ok: true, value: f.type === 'number' ? null : f.type === 'datetime' ? null : null }
  }
  if (f.type === 'number') {
    const n = Number(s)
    if (!Number.isFinite(n)) return { ok: false, error: `${f.label} must be a number.` }
    return { ok: true, value: n }
  }
  if (f.type === 'datetime') {
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) return { ok: false, error: `${f.label} is not a valid date.` }
    return { ok: true, value: d }
  }
  if (f.type === 'select' && f.options && !f.options.some((o) => o.value === s)) {
    return { ok: false, error: `${f.label} has an invalid value.` }
  }
  return { ok: true, value: s.slice(0, 5000) }
}

/** Form values -> DB data, with per-model rules. */
export function buildData(key: ModelKey, values: FormValues): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const data: Record<string, unknown> = {}
  for (const f of MODELS[key].fields) {
    const r = parseField(f, values[f.name])
    if (!r.ok) return r
    data[f.name] = r.value
  }
  if (key === 'category') {
    data.slug = slugify(String(data.slug || data.name))
    if (!data.slug) return { ok: false, error: 'Slug is invalid.' }
    data.order = Number(data.order ?? 0)
  }
  if (key === 'coupon') {
    data.code = String(data.code).toUpperCase().replace(/\s+/g, '')
    const v = Number(data.value)
    if (v <= 0) return { ok: false, error: 'Value must be greater than zero.' }
    if (data.discountType === 'PERCENT' && v > 100) return { ok: false, error: 'A percentage cannot exceed 100.' }
    data.discountValue = Math.round(v * 100) // % -> basis points, ₹ -> paise
    delete data.value
    if (data.maxUses != null) data.maxUses = Math.round(Number(data.maxUses))
  }
  if ('order' in data && key !== 'category') data.order = Number(data.order ?? 0)
  return { ok: true, data }
}

export async function createRecord(key: ModelKey, data: Record<string, unknown>) {
  return delegates[key].create({ data })
}
export async function updateRecord(key: ModelKey, id: string, data: Record<string, unknown>) {
  return delegates[key].update({ where: { id }, data })
}
export async function deleteRecord(key: ModelKey, id: string) {
  return delegates[key].delete({ where: { id } })
}
