import Link from 'next/link'
import { LogoMark } from '@/components/layout/Logo'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { AdminNav } from './AdminNav'
import { MobileSidebar, QuickActions, UserMenu } from './HeaderMenus'
import { SITE_URL } from '@/lib/utils/seo'

function ProfileCard({ name, image }: { name: string; image: string | null }) {
  return (
    <div className="relative overflow-hidden rounded-t-lg pb-4 pt-8 text-center">
      <svg className="absolute inset-x-0 top-0 h-16 w-full text-sky-100" viewBox="0 0 300 64" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0 H300 V30 C 230 70 150 -10 70 30 C 40 45 15 40 0 30 Z" fill="currentColor" opacity="0.8" />
      </svg>
      <span className="relative mx-auto block h-12 w-12 overflow-hidden rounded-full bg-slate-200 ring-4 ring-white">
        <PlaceholderArt src={image ?? 'placeholder:avatar'} alt="" label={name} fill sizes="48px" className="object-cover" />
      </span>
      <p className="relative mt-3 text-sm font-bold text-slate-800">{name}</p>
    </div>
  )
}

/** Dark top bar + white sidebar + light content area, matching the existing fea-training.com admin. */
export function AdminShell({
  user,
  siteName,
  unread,
  children,
}: {
  user: { name: string; image: string | null }
  siteName: string
  unread: number
  children: React.ReactNode
}) {
  const host = SITE_URL.replace(/^https?:\/\//, '')
  return (
    <div className="min-h-screen bg-adm-bg text-adm-text" data-admin-root>
      <header className="sticky top-0 z-40 bg-adm-header shadow-md">
        <div className="mx-auto flex h-[68px] max-w-[1600px] items-center gap-3 px-3 sm:px-6">
          <MobileSidebar unread={unread}>
            <ProfileCard name={user.name} image={user.image} />
          </MobileSidebar>
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 text-white" aria-label={`${siteName} admin home`}>
            <LogoMark className="h-9" />
            <span className="hidden leading-tight sm:block">
              <span className="block font-display text-lg font-extrabold tracking-wide">PYTHAGORAS</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">Engineering Consultancy &amp; Services</span>
            </span>
          </Link>
          <span className="ml-3 hidden font-display text-lg font-bold text-white md:block">{host}</span>
          <a href="/" target="_blank" rel="noreferrer" className="ml-1 hidden min-h-10 items-center rounded-md border border-white/80 px-4 text-sm font-medium text-white hover:bg-white/10 sm:inline-flex">
            Visit website
          </a>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-slate-300 sm:block">English</span>
            <QuickActions />
            <UserMenu name={user.name} image={user.image} />
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1600px] gap-6 px-3 py-6 sm:px-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-[92px] max-h-[calc(100vh-110px)] overflow-y-auto rounded-lg bg-white shadow-sm">
            <ProfileCard name={user.name} image={user.image} />
            <AdminNav unread={unread} />
          </div>
        </aside>
        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
