import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AdminLoginForm } from '@/components/auth/AdminLoginForm'
import { getFreshUser } from '@/lib/auth/guards'
import { buildMetadata } from '@/lib/utils/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Admin login',
  description: 'Administrator sign-in.',
  path: '/admin-login',
  noIndex: true,
})

/** Dedicated administrator entrance. Already-signed-in admins go straight to the dashboard. */
export default async function AdminLoginPage() {
  const user = await getFreshUser()
  if (user?.role === 'ADMIN') redirect('/admin/dashboard')
  return (
    <div className="container-page flex justify-center py-12 md:py-20">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-plum-700">Administrator</p>
        <h1 className="mt-1 text-3xl">Admin login</h1>
        <p className="mt-2 text-muted-foreground">Sign in to manage courses, students, enrolments and website settings.</p>
        <div className="mt-6">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  )
}
