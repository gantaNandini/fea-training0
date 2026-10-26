'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ASelect, FieldRow, btn } from './ui'
import { enrolStudent } from '@/app/(admin)/admin/actions'

export function EnrolForm({ users, courses }: { users: { id: string; label: string }[]; courses: { id: string; label: string }[] }) {
  const router = useRouter()
  const [userId, setUserId] = React.useState('')
  const [courseId, setCourseId] = React.useState('')
  const [pending, start] = React.useTransition()
  return (
    <form
      className="mx-auto max-w-lg"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await enrolStudent(userId, courseId)
          if (res.ok) {
            toast.success(res.message ?? 'Done')
            router.push('/admin/enrolments')
          } else toast.error(res.error)
        })
      }}
    >
      <FieldRow label="User" htmlFor="enrol-user" required>
        <ASelect id="enrol-user" value={userId} onChange={(e) => setUserId(e.target.value)} required>
          <option value="">Select a user</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
        </ASelect>
      </FieldRow>
      <FieldRow label="Course to enrol" htmlFor="enrol-course" required>
        <ASelect id="enrol-course" value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
          <option value="">Select a course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </ASelect>
      </FieldRow>
      <button type="submit" className={btn('primary')} disabled={pending}>{pending ? 'Enrolling…' : 'Enrol student'}</button>
    </form>
  )
}
