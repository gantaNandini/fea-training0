'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, ChevronDown, ChevronRight, Grid3x3, MessageSquare, Network, Settings2, User, Users, FileBarChart } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Leaf { label: string; href: string }
interface Branch { label: string; icon: React.ReactNode; href?: string; children?: (Leaf | { label: string; children: Leaf[] })[] }

const I = 'h-[18px] w-[18px]'
function tree(): Branch[] {
  return [
    { label: 'Dashboard', icon: <Grid3x3 className={I} />, href: '/admin/dashboard' },
    {
      label: 'Courses',
      icon: <BookOpen className={I} />,
      children: [
        { label: 'Manage courses', href: '/admin/courses' },
        { label: 'Add new course', href: '/admin/courses/new' },
        { label: 'Course category', href: '/admin/categories' },
        { label: 'Coupons', href: '/admin/coupons' },
      ],
    },
    {
      label: 'Enrolment',
      icon: <Network className={I} />,
      children: [
        { label: 'Enrol history', href: '/admin/enrolments' },
        { label: 'Enrol a student', href: '/admin/enrolments/new' },
      ],
    },
    {
      label: 'Report',
      icon: <FileBarChart className={I} />,
      children: [
        { label: 'Admin revenue', href: '/admin/reports/admin-revenue' },
        { label: 'Instructor revenue', href: '/admin/reports/instructor-revenue' },
      ],
    },
    {
      label: 'Users',
      icon: <Users className={I} />,
      children: [
        { label: 'Admins', children: [{ label: 'Manage admins', href: '/admin/users/admins' }, { label: 'Add new admin', href: '/admin/users/admins/new' }] },
        {
          label: 'Instructors',
          children: [
            { label: 'Manage instructors', href: '/admin/users/instructors' },
            { label: 'Add new instructor', href: '/admin/users/instructors/new' },
            { label: 'Instructor payout', href: '/admin/instructor-payout' },
            { label: 'Instructor settings', href: '/admin/settings/instructor' },
          ],
        },
        { label: 'Students', children: [{ label: 'Manage students', href: '/admin/users/students' }, { label: 'Add new student', href: '/admin/users/students/new' }] },
      ],
    },
    { label: 'Message', icon: <MessageSquare className={I} />, href: '/admin/message' },
    {
      label: 'Settings',
      icon: <Settings2 className={I} />,
      children: [
        { label: 'System settings', href: '/admin/settings/system' },
        { label: 'Website settings', href: '/admin/settings/website' },
        { label: 'Payment settings', href: '/admin/settings/payment' },
        { label: 'Language settings', href: '/admin/settings/language' },
        { label: 'Smtp settings', href: '/admin/settings/smtp' },
        { label: 'Social login', href: '/admin/settings/social-login' },
        { label: 'About', href: '/admin/settings/about' },
        { label: 'Home page setting', href: '/admin/settings/home' },
      ],
    },
    { label: 'Manage profile', icon: <User className={I} />, href: '/admin/profile' },
  ] as Branch[]
}

function leaves(b: Branch['children']): Leaf[] {
  return (b ?? []).flatMap((c) => ('href' in c ? [c] : c.children))
}

export function AdminNav({ unread, onNavigate }: { unread: number; onNavigate?: () => void }) {
  const path = usePathname()
  const items = React.useMemo(() => tree(), [])
  const isActive = (href: string) => path === href || (href !== '/admin/dashboard' && path.startsWith(`${href}/`) && !leavesActiveMoreSpecific(href))
  function leavesActiveMoreSpecific(href: string) {
    return items.some((b) => leaves(b.children).some((l) => l.href !== href && l.href.startsWith(`${href}/`) && path.startsWith(l.href)))
  }
  const [open, setOpen] = React.useState<Record<string, boolean>>({})
  const isOpen = (b: Branch) => open[b.label] ?? leaves(b.children).some((l) => isActive(l.href))

  return (
    <nav aria-label="Admin navigation" className="px-4 pb-6">
      <p className="mb-3 mt-6 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">Navigation</p>
      <ul className="space-y-1">
        {items.map((b) => {
          const expanded = isOpen(b)
          const active = b.href ? isActive(b.href) : leaves(b.children).some((l) => isActive(l.href))
          const row = cn('flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-[15px] transition-colors hover:text-adm-accent-dark', active ? 'text-adm-accent-dark font-medium' : 'text-adm-text')
          return (
            <li key={b.label}>
              {b.href ? (
                <Link href={b.href} onClick={onNavigate} className={row} aria-current={active ? 'page' : undefined}>
                  {b.icon}
                  <span className="flex-1">{b.label}</span>
                  {b.label === 'Message' && unread > 0 ? <span className="rounded-full bg-red-100 px-2 text-xs font-semibold text-red-700">{unread}</span> : null}
                </Link>
              ) : (
                <button type="button" className={row} aria-expanded={expanded} onClick={() => setOpen({ ...open, [b.label]: !expanded })}>
                  {b.icon}
                  <span className="flex-1 text-left">{b.label}</span>
                  {expanded ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
                </button>
              )}
              {b.children && expanded ? (
                <ul className="mb-1 ml-9 mt-1 space-y-0.5 border-l border-slate-100 pl-3">
                  {b.children.map((c) =>
                    'href' in c ? (
                      <SubLink key={c.href} leaf={c} active={isActive(c.href)} onNavigate={onNavigate} />
                    ) : (
                      <li key={c.label}>
                        <button type="button" className={cn('flex min-h-10 w-full items-center justify-between rounded-md px-2 text-sm hover:text-adm-accent-dark', c.children.some((l) => isActive(l.href)) ? 'text-adm-accent-dark' : 'text-adm-text')} aria-expanded={open[`${b.label}/${c.label}`] ?? c.children.some((l) => isActive(l.href))} onClick={() => setOpen({ ...open, [`${b.label}/${c.label}`]: !(open[`${b.label}/${c.label}`] ?? c.children.some((l) => isActive(l.href))) })}>
                          {c.label}
                          <ChevronRight className={cn('h-4 w-4 transition-transform', (open[`${b.label}/${c.label}`] ?? c.children.some((l) => isActive(l.href))) && 'rotate-90')} aria-hidden="true" />
                        </button>
                        {(open[`${b.label}/${c.label}`] ?? c.children.some((l) => isActive(l.href))) ? (
                          <ul className="ml-3 space-y-0.5">
                            {c.children.map((l) => <SubLink key={l.href} leaf={l} active={isActive(l.href)} onNavigate={onNavigate} />)}
                          </ul>
                        ) : null}
                      </li>
                    ),
                  )}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function SubLink({ leaf, active, onNavigate }: { leaf: Leaf; active: boolean; onNavigate?: () => void }) {
  return (
    <li>
      <Link href={leaf.href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={cn('flex min-h-10 items-center rounded-md px-2 text-sm hover:text-adm-accent-dark', active ? 'font-semibold text-adm-accent-dark' : 'text-adm-text')}>
        {leaf.label}
      </Link>
    </li>
  )
}
