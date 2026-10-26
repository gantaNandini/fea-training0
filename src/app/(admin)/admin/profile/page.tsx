import { redirect } from 'next/navigation'
import { Card, PageHeader } from '@/components/admin/ui'
import { InstructorProfileForm } from '@/components/admin/InstructorProfileForm'
import { PasswordForm, ProfileForm } from '@/components/student/ProfileForms'
import { getFreshUser } from '@/lib/auth/guards'
import { getProfile } from '@/lib/data/users'
import { db } from '@/lib/db'

export const metadata = { title: 'Manage profile' }

export default async function AdminProfilePage() {
  const user = await getFreshUser()
  if (!user) redirect('/login?redirect=/admin/profile')
  const [profile, ip] = await Promise.all([getProfile(user.id), db.instructorProfile.findUnique({ where: { userId: user.id } })])
  if (!profile) redirect('/login')
  return (
    <>
      <PageHeader title="Manage profile" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Basic info">
          <ProfileForm initial={{ name: profile.name ?? '', email: profile.email, phone: profile.phone ?? '', bio: profile.bio ?? '', image: profile.image }} />
        </Card>
        <div>
          <Card title="Change password">
            <PasswordForm hasPassword={!!profile.passwordHash} />
          </Card>
          <Card title="Instructor details (shown on course pages)">
            <InstructorProfileForm initial={{ title: ip?.title ?? '', bio: ip?.bio ?? '', linkedin: ip?.socialLinkedIn ?? '', twitter: ip?.socialTwitter ?? '', website: ip?.socialWebsite ?? '' }} />
          </Card>
        </div>
      </div>
    </>
  )
}
