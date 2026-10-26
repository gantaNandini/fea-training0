import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth/AuthCard'
import { LoginForm } from '@/components/auth/LoginForm'
import { safeRedirect } from '@/lib/utils/redirect'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const metadata: Metadata = buildMetadata({
  title: 'Log in',
  description: 'Log in to continue learning.',
  path: '/login',
  noIndex: true,
})

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams
  return (
    <AuthCard title={messages.auth.loginTitle} subtitle={messages.auth.loginSub}>
      <LoginForm redirect={safeRedirect(redirect)} googleEnabled={!!process.env.GOOGLE_CLIENT_ID} />
    </AuthCard>
  )
}
