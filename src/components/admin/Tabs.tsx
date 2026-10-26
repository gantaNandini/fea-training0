'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export function Tabs({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = React.useState(tabs[0]?.id)
  return (
    <div>
      <div role="tablist" className="mb-5 flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={active === t.id} aria-controls={`panel-${t.id}`} type="button" onClick={() => setActive(t.id)} className={cn('min-h-11 border-b-2 px-4 text-sm font-semibold', active === t.id ? 'border-adm-accent-dark text-adm-accent-dark' : 'border-transparent text-slate-600 hover:text-slate-900')}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id}>{t.content}</div>
      ))}
    </div>
  )
}
