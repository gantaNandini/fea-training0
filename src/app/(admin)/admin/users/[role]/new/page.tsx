import { notFound } from 'next/navigation'
import { Card, PageHeader } from '@/components/admin/ui'
import { UserForm } from '@/components/admin/UserForm'

export const metadata = { title: 'Add user' }

const ROLES = { admins: 'ADMIN', instructors: 'INSTRUCTOR', students: 'STUDENT' } as const

export default async function NewUserPage({ params }: { params: Promise<{ role: string }> }) {
  const { role: slug } = await params
  if (!(slug in ROLES)) notFound()
  const noun = slug.slice(0, -1)
  return (
    <>
      <PageHeader title={`Add new ${noun}`} />
      <Card title={`New ${noun}`}>
        <UserForm role={ROLES[slug as keyof typeof ROLES]} backTo={`/admin/users/${slug}`} />
      </Card>
    </>
  )
}
