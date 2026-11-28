import * as React from 'react'
import { getCategoryTree } from '@/lib/data/categories'
import { getSettings } from '@/lib/data/settings'
import { Header } from './Header'
import { Footer } from './Footer'
import { CookieBanner } from './CookieBanner'

/**
 * Shared chrome for (public) and (student) route groups. Uses only cached data-layer reads and never
 * touches cookies/session, so pages inside stay static/ISR (REQ-270).
 */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [categories, settings] = await Promise.all([
    getCategoryTree(),
    getSettings(),
  ])
  const visible = categories.filter((c) => c.courseCount > 0)
  return (
    <div className="flex min-h-screen flex-col">
      <Header categories={visible} companyName={settings.company_name ?? 'PYTHAGORAS'} />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer settings={settings} />
      <CookieBanner />
    </div>
  )
}
