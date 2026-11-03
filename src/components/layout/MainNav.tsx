'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CategoryDTO } from '@/lib/types'
import { MegaMenu } from './MegaMenu'
import { cn } from '@/lib/utils/cn'

export const MAIN_LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/upcoming-courses', label: 'Upcoming courses' },
  { href: '/events', label: 'Events' },
  { href: '/fees', label: 'Fees & syllabus' },
  { href: '/corporate-training', label: 'Corporate training' },
  { href: '/consultancy', label: 'Consultancy' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

/** Second header row (desktop): Home, Courses menu, and one link per section so nothing is buried on the home page. */
export function MainNav({ categories }: { categories: CategoryDTO[] }) {
  const path = usePathname()
  const active = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`))
  const item = (href: string) =>
    cn(
      'inline-flex h-11 items-center rounded-md px-3 text-sm font-semibold hover:bg-muted',
      active(href) && 'text-plum-700 underline decoration-2 underline-offset-8 dark:text-plum-300',
    )
  return (
    <nav aria-label="Main sections" className="border-t border-border">
      <ul className="container-page flex flex-wrap items-center gap-x-1">
        <li>
          <Link href="/" className={item('/')} aria-current={path === '/' ? 'page' : undefined}>Home</Link>
        </li>
        <li>
          <MegaMenu categories={categories} />
        </li>
        {MAIN_LINKS.slice(1).map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={item(l.href)} aria-current={active(l.href) ? 'page' : undefined}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
