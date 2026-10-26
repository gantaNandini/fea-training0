import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { ActionButton } from '@/components/admin/ActionButton'
import { Card, PageHeader, StatusBadge, btn } from '@/components/admin/ui'
import { DataTable, type Row } from '@/components/admin/DataTable'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { db } from '@/lib/db'
import { getFreshUser } from '@/lib/auth/guards'
import { deleteUser, setUserRole } from '../../actions'

export const metadata = { title: 'Users' }

const ROLES = { admins: 'ADMIN', instructors: 'INSTRUCTOR', students: 'STUDENT' } as const

export default async function UsersPage({ params }: { params: Promise<{ role: string }> }) {
  const { role: slug } = await params
  if (!(slug in ROLES)) notFound()
  const role = ROLES[slug as keyof typeof ROLES]
  const me = await getFreshUser()
  const users = await db.user.findMany({
    where: { role },
    orderBy: { createdAt: 'desc' },
    take: 3000,
    include: { _count: { select: { enrollments: true, coursesTaught: true } } },
  })
  const label = slug === 'admins' ? 'admins' : slug === 'instructors' ? 'instructors' : 'students'
  const rows: Row[] = users.map((u) => {
    const joined = u.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    return {
      id: u.id,
      cells: {
        photo: { node: <span className="relative block h-10 w-10 overflow-hidden rounded-full bg-slate-200"><PlaceholderArt src={u.image ?? 'placeholder:avatar'} alt="" label={u.name ?? u.email} fill sizes="40px" className="object-cover" /></span>, sort: '' },
        name: { node: <span className="font-semibold text-slate-800">{u.name ?? '—'}</span>, sort: u.name ?? '' },
        email: { node: u.email, sort: u.email },
        count: { node: role === 'INSTRUCTOR' ? `${u._count.coursesTaught} courses` : role === 'STUDENT' ? `${u._count.enrollments} courses` : '—', sort: role === 'INSTRUCTOR' ? u._count.coursesTaught : u._count.enrollments },
        status: { node: u.passwordHash ? <StatusBadge tone="green">Can log in</StatusBadge> : <StatusBadge tone="slate">No password</StatusBadge>, sort: u.passwordHash ? 1 : 0 },
        joined: { node: joined, sort: u.createdAt.getTime(), search: joined },
        actions: {
          sort: '',
          node: (
            <div className="flex flex-wrap gap-2">
              {u.id !== me?.id ? (
                <>
                  {role !== 'STUDENT' ? <ActionButton action={setUserRole.bind(null, u.id, 'STUDENT')} confirm="Make this user a student?">Make student</ActionButton> : null}
                  {role === 'STUDENT' ? <ActionButton action={setUserRole.bind(null, u.id, 'INSTRUCTOR')} confirm="Make this user an instructor?">Make instructor</ActionButton> : null}
                  {role !== 'ADMIN' ? <ActionButton action={setUserRole.bind(null, u.id, 'ADMIN')} confirm="Give this user full admin access?">Make admin</ActionButton> : null}
                  <ActionButton variant="danger" label="Delete user" confirm="Delete this user permanently?" action={deleteUser.bind(null, u.id)}><Trash2 className="h-4 w-4" aria-hidden="true" /></ActionButton>
                </>
              ) : <span className="text-xs text-slate-500">You</span>}
            </div>
          ),
        },
      },
    }
  })
  return (
    <>
      <PageHeader title={`Manage ${label}`} actions={<Link href={`/admin/users/${slug}/new`} className={btn('primary')}>Add new {label.slice(0, -1)}</Link>} />
      <Card title={label}>
        <DataTable
          columns={[
            { key: 'photo', label: 'Photo', sortable: false },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'count', label: role === 'INSTRUCTOR' ? 'Courses taught' : 'Enrolled' },
            { key: 'status', label: 'Login' },
            { key: 'joined', label: 'Joined' },
            { key: 'actions', label: 'Actions', sortable: false },
          ]}
          rows={rows}
        />
      </Card>
    </>
  )
}
