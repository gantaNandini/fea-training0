import type { Metadata } from 'next'
import { redirect as goto } from 'next/navigation'
import { PostLogin } from '@/components/auth/PostLogin'
import { getFreshUser } from '@/lib/auth/guards'
import { safeRedirect } from '@/lib/utils/redirect'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Signing in', robots: { index: false, follow: false } }

/**
 * Runs right after every sign-in. The role is read on the SERVER from the fresh session, so an
 * admin who logs in without a specific destination always lands on the admin dashboard (no client
 * state or cache involved). The guest-cart merge still runs for students.
 */
export default async function PostLoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams
  const target = safeRedirect(redirect)
  const user = await getFreshUser()
  if (user?.role === 'ADMIN' && (target === '/' || target === '')) goto('/admin/dashboard')
  return <PostLogin redirect={target} />
}
