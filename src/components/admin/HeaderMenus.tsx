'use client'

import * as React from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { BookOpen, ChevronDown, Grid3x3, LogOut, Menu, Network, PlayCircle, Settings, UserCircle2, UserPlus, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { AdminNav } from './AdminNav'

const quick = [
  { label: 'Add course', href: '/admin/courses/new', Icon: BookOpen },
  { label: 'Add lesson', href: '/admin/courses', Icon: PlayCircle },
  { label: 'Add student', href: '/admin/users/students/new', Icon: UserPlus },
  { label: 'Enrol student', href: '/admin/enrolments/new', Icon: Network },
]

export function QuickActions() {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Quick actions" className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white">
          <Grid3x3 className="h-5 w-5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 overflow-hidden p-0">
        <p className="bg-adm-accent py-5 text-center font-display text-lg font-bold text-white">Quick actions</p>
        <div className="grid grid-cols-2">
          {quick.map(({ label, href, Icon }, i) => (
            <Link key={href + label} href={href} onClick={() => setOpen(false)} className={`flex min-h-24 flex-col items-center justify-center gap-2 text-sm text-slate-500 hover:bg-adm-accent-soft hover:text-adm-accent-dark ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b' : ''} border-slate-200`}>
              <Icon className="h-6 w-6 text-adm-accent" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function UserMenu({ name, image }: { name: string; image: string | null }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Account menu" className="flex min-h-14 items-center gap-3 bg-white/5 px-4 text-left hover:bg-white/10">
          <span className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-200">
            <PlaceholderArt src={image ?? 'placeholder:avatar'} alt="" label={name} fill sizes="36px" className="object-cover" />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-semibold text-white">{name}</span>
            <span className="block text-xs text-slate-300">Admin</span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-300" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Welcome !</p>
        <Link href="/admin/profile" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-slate-700 hover:bg-slate-50"><UserCircle2 className="h-4 w-4" aria-hidden="true" /> My account</Link>
        <Link href="/admin/settings/system" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-slate-700 hover:bg-slate-50"><Settings className="h-4 w-4" aria-hidden="true" /> Settings</Link>
        <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-slate-700 hover:bg-slate-50"><LogOut className="h-4 w-4" aria-hidden="true" /> Logout</button>
      </PopoverContent>
    </Popover>
  )
}

/** Sidebar content with a slide-in drawer on small screens. */
export function MobileSidebar({ unread, children }: { unread: number; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-md text-white hover:bg-white/10 lg:hidden">
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto bg-white shadow-xl">
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"><X className="h-5 w-5" aria-hidden="true" /></button>
            {children}
            <AdminNav unread={unread} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  )
}

