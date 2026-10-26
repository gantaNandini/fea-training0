import * as React from 'react'
import { cn } from '@/lib/utils/cn'

/** Small presentational pieces shared by the admin console (works in server and client components). */

export function PageHeader({ title, icon, actions }: { title: string; icon?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-6 py-6 shadow-sm">
      <h1 className="flex items-center gap-3 font-display text-xl font-bold text-adm-text">
        {icon ? <span className="text-adm-text/70">{icon}</span> : null}
        {title}
      </h1>
      {actions}
    </div>
  )
}

export function Card({ title, children, className, actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn('mb-6 rounded-lg bg-white p-5 shadow-sm md:p-6', className)}>
      {title || actions ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title ? <h2 className="text-sm font-bold uppercase tracking-wide text-adm-text">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export const inputClass =
  'block min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-adm-accent focus:outline-none focus:ring-2 focus:ring-adm-accent/30 disabled:bg-slate-100'

export const AInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function AInput(
  { className, ...p },
  ref,
) {
  return <input ref={ref} className={cn(inputClass, className)} {...p} />
})
export const ASelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function ASelect(
  { className, ...p },
  ref,
) {
  return <select ref={ref} className={cn(inputClass, 'pr-8', className)} {...p} />
})
export const ATextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function ATextarea(
  { className, ...p },
  ref,
) {
  return <textarea ref={ref} className={cn(inputClass, 'min-h-24 py-2', className)} {...p} />
})

export function FieldRow({ label, htmlFor, required, help, children, className }: { label: string; htmlFor?: string; required?: boolean; help?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4', className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-adm-text">
        {label}
        {required ? <span className="text-red-600" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {help ? <p className="mt-1 text-xs text-slate-500">{help}</p> : null}
    </div>
  )
}

type Variant = 'primary' | 'info' | 'outline' | 'danger' | 'ghost'
const variants: Record<Variant, string> = {
  primary: 'bg-adm-accent-dark text-white hover:bg-adm-accent-dark/90',
  info: 'bg-adm-info text-white hover:bg-adm-info/90',
  outline: 'border border-slate-300 bg-white text-adm-text hover:bg-slate-50',
  danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
  ghost: 'text-adm-accent-dark hover:bg-adm-accent-soft',
}
export function btn(variant: Variant = 'primary', size: 'md' | 'sm' = 'md') {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adm-accent/50 disabled:cursor-not-allowed disabled:opacity-60',
    size === 'md' ? 'min-h-11 px-5 text-sm' : 'min-h-9 px-3 text-xs',
    variants[variant],
  )
}

export function StatusBadge({ tone, children }: { tone: 'green' | 'amber' | 'slate' | 'red' | 'blue'; children: React.ReactNode }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-800',
    amber: 'bg-amber-50 text-amber-800',
    slate: 'bg-slate-100 text-slate-700',
    red: 'bg-red-50 text-red-800',
    blue: 'bg-indigo-50 text-indigo-800',
  }
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone])}>{children}</span>
}

/** Range filter as a plain GET form so it works without client JS. */
export function DateRangeFilter({ from, to, action }: { from: string; to: string; action: string }) {
  return (
    <form action={action} method="get" className="mb-5 flex flex-wrap items-end justify-center gap-3">
      <div>
        <label htmlFor="from" className="mb-1 block text-xs font-semibold text-slate-600">From</label>
        <input id="from" name="from" type="date" defaultValue={from} className={cn(inputClass, 'w-44')} />
      </div>
      <div>
        <label htmlFor="to" className="mb-1 block text-xs font-semibold text-slate-600">To</label>
        <input id="to" name="to" type="date" defaultValue={to} className={cn(inputClass, 'w-44')} />
      </div>
      <button type="submit" className={btn('info')}>Filter</button>
    </form>
  )
}

export const formatMoney = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
