import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth/AuthCard'
import { ForgotForm } from '@/components/auth/ForgotForm'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const metadata: Metadata = buildMetadata({
  title: 'Reset your password',
  description: 'Request a password reset link.',
  path: '/forgot-password',
  noIndex: true,
})

export default function ForgotPasswordPage() {
  return (
    <AuthCard title={messages.auth.forgotTitle} subtitle={messages.auth.forgotSub}>
      <ForgotForm />
    </AuthCard>
  )
}
