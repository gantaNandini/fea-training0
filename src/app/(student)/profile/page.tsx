import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PasswordForm, ProfileForm } from '@/components/student/ProfileForms'
import { getFreshUser } from '@/lib/auth/guards'
import { getProfile } from '@/lib/data/users'
import { buildMetadata } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'

export const metadata: Metadata = buildMetadata({
  title: messages.student.profileTitle,
  description: 'Manage your profile.',
  path: '/profile',
  noIndex: true,
})

export default async function ProfilePage() {
  const user = await getFreshUser()
  if (!user) redirect('/login?redirect=/profile')
  const profile = await getProfile(user.id)
  if (!profile) redirect('/login')
  return (
    <div className="container-page max-w-2xl py-10 md:py-14">
      <h1 className="mb-8">{messages.student.profileTitle}</h1>
      <ProfileForm
        initial={{
          name: profile.name ?? '',
          email: profile.email,
          phone: profile.phone ?? '',
          bio: profile.bio ?? '',
          image: profile.image,
        }}
      />
      <hr className="my-10 border-border" />
      <h2 className="mb-4 text-2xl">{messages.student.changePassword}</h2>
      <PasswordForm hasPassword={!!profile.passwordHash} />
    </div>
  )
}
