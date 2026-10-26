'use client'

import * as React from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { AInput, ASelect, btn } from './ui'

export interface Column {
  key: string
  label: string
  sortable?: boolean
  className?: string
}
/** `node` is what is rendered; `sort` is the comparable value (defaults to the node's text). */
export interface Cell {
  node: React.ReactNode
  sort?: string | number
  search?: string
}
export type Row = { id: string; cells: Record<string, Cell> }

/** Client-side search, sort and paging for the server-rendered row sets (≤ 2000 rows). */
export function DataTable({ columns, rows, empty = 'No data available in table', searchPlaceholder }: { columns: Column[]; rows: Row[]; empty?: string; searchPlaceholder?: string }) {
  const [q, setQ] = React.useState('')
  const [size, setSize] = React.useState(10)
  const [page, setPage] = React.useState(0)
  const [sort, setSort] = React.useState<{ key: string; dir: 1 | -1 } | null>(null)

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    let out = rows
    if (needle) {
      out = rows.filter((r) =>
        Object.values(r.cells).some((c) => String(c.search ?? c.sort ?? '').toLowerCase().includes(needle)),
      )
    }
    if (sort) {
      out = [...out].sort((a, b) => {
        const av = a.cells[sort.key]?.sort ?? ''
        const bv = b.cells[sort.key]?.sort ?? ''
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sort.dir
        return String(av).localeCompare(String(bv), undefined, { numeric: true }) * sort.dir
      })
    }
    return out
  }, [rows, q, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / size))
  const current = Math.min(page, pages - 1)
  const visible = filtered.slice(current * size, current * size + size)
  const from = filtered.length === 0 ? 0 : current * size + 1
  const to = Math.min(filtered.length, current * size + size)

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2">
          Show
          <ASelect aria-label="Rows per page" className="w-20" value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0) }}>
            {[10, 25, 50, 100].map((n) => <option key={n}>{n}</option>)}
          </ASelect>
          entries
        </label>
        <label className="flex items-center gap-2">
          Search:
          <AInput className="w-56" placeholder={searchPlaceholder} value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left">
              {columns.map((c) => {
                const active = sort?.key === c.key
                return (
                  <th key={c.key} scope="col" className={`px-3 py-3 font-semibold text-adm-text ${c.className ?? ''}`} aria-sort={active ? (sort!.dir === 1 ? 'ascending' : 'descending') : undefined}>
                    {c.sortable === false ? c.label : (
                      <button type="button" className="inline-flex items-center gap-1.5 font-semibold" onClick={() => setSort(active && sort!.dir === -1 ? null : { key: c.key, dir: active ? -1 : 1 })}>
                        {c.label}
                        {active ? (sort!.dir === 1 ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />) : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
                      </button>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={columns.length} className="bg-slate-50 px-3 py-6 text-center text-slate-600">{empty}</td></tr>
            ) : (
              visible.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  {columns.map((c) => <td key={c.key} className={`px-3 py-3 align-middle ${c.className ?? ''}`}>{r.cells[c.key]?.node}</td>)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <p>Showing {from} to {to} of {filtered.length} entries</p>
        <div className="flex gap-2">
          <button type="button" className={btn('outline', 'sm')} disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button>
          <button type="button" className={btn('outline', 'sm')} disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</button>
        </div>
      </div>
    </div>
  )
}
