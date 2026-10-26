import type { Metadata } from 'next'
import { PostLogin } from '@/components/auth/PostLogin'
import { safeRedirect } from '@/lib/utils/redirect'

export const metadata: Metadata = { title: 'Signing in', robots: { index: false, follow: false } }

export default async function PostLoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams
  return <PostLogin redirect={safeRedirect(redirect)} />
}
