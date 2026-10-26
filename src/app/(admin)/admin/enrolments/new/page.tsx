import { Card, PageHeader } from '@/components/admin/ui'
import { EnrolForm } from '@/components/admin/EnrolForm'
import { db } from '@/lib/db'

export const metadata = { title: 'Enrol a student' }

export default async function EnrolNewPage() {
  const [users, courses] = await Promise.all([
    db.user.findMany({ where: { role: 'STUDENT' }, orderBy: { name: 'asc' }, select: { id: true, name: true, email: true }, take: 5000 }),
    db.course.findMany({ where: { status: { not: 'DRAFT' } }, orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ])
  return (
    <>
      <PageHeader title="Enrol a student" />
      <Card title="Enrolment form">
        <EnrolForm users={users.map((u) => ({ id: u.id, label: `${u.name ?? 'Unnamed'} (${u.email})` }))} courses={courses.map((c) => ({ id: c.id, label: c.title }))} />
      </Card>
    </>
  )
}
