import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { ResetForm } from '@/components/auth/ResetForm'
import { isResetTokenValid } from '@/lib/data/users'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const metadata: Metadata = buildMetadata({
  title: 'Choose a new password',
  description: 'Set a new password for your account.',
  path: '/reset-password',
  noIndex: true,
})

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  const valid = token ? await isResetTokenValid(token) : false
  return (
    <AuthCard title={messages.auth.resetTitle}>
      {valid && token ? (
        <ResetForm token={token} />
      ) : (
        <div className="space-y-4">
          <p role="alert" className="rounded-md bg-red-50 px-3 py-3 text-sm font-medium text-danger-text dark:bg-red-950/40 dark:text-red-300">
            {messages.auth.resetInvalid}
          </p>
          <Link href="/forgot-password" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4">
            {messages.auth.forgotTitle}
          </Link>
        </div>
      )}
    </AuthCard>
  )
}
