import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/AdminShell'
import { getFreshUser } from '@/lib/auth/guards'
import { getProfile } from '@/lib/data/users'
import { getSetting } from '@/lib/data/settings'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: { default: 'Admin', template: '%s | Admin' }, robots: { index: false, follow: false } }

/** REQ-190: the middleware only checks the JWT; this re-checks the role in the DB on every admin request. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getFreshUser()
  if (!user) redirect('/login?redirect=/admin')
  if (user.role !== 'ADMIN') redirect('/')
  const [profile, siteName, unread] = await Promise.all([
    getProfile(user.id),
    getSetting('company_name', 'PYTHAGORAS'),
    db.contactMessage.count({ where: { read: false } }),
  ])
  return (
    <AdminShell user={{ name: profile?.name ?? user.name ?? 'Admin', image: profile?.image ?? null }} siteName={siteName} unread={unread}>
      {children}
    </AdminShell>
  )
}
