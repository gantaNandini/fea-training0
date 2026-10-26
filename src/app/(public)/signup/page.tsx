import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth/AuthCard'
import { SignupForm } from '@/components/auth/SignupForm'
import { safeRedirect } from '@/lib/utils/redirect'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const metadata: Metadata = buildMetadata({
  title: 'Create your account',
  description: 'Sign up to start learning with industry experts.',
  path: '/signup',
  noIndex: true,
})

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams
  return (
    <AuthCard title={messages.auth.signupTitle} subtitle={messages.auth.signupSub}>
      <SignupForm redirect={safeRedirect(redirect)} />
    </AuthCard>
  )
}
