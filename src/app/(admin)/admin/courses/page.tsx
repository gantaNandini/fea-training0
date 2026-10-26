import Link from 'next/link'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import { ActionButton } from '@/components/admin/ActionButton'
import { Card, PageHeader, StatusBadge, btn, formatMoney } from '@/components/admin/ui'
import { DataTable, type Row } from '@/components/admin/DataTable'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { db } from '@/lib/db'
import { deleteCourse, setCourseStatus } from '../actions'

export const metadata = { title: 'Manage courses' }

const tone = { PUBLISHED: 'green', DRAFT: 'slate', UPCOMING: 'amber' } as const

export default async function ManageCoursesPage() {
  const courses = await db.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      instructor: { select: { name: true } },
      categories: { include: { category: { select: { name: true } } } },
      _count: { select: { enrollments: true } },
      sections: { select: { _count: { select: { lessons: true } } } },
    },
  })
  const rows: Row[] = courses.map((c) => {
    const lessons = c.sections.reduce((s, x) => s + x._count.lessons, 0)
    const cat = c.categories.find((x) => x.isPrimary)?.category.name ?? c.categories[0]?.category.name ?? '—'
    const price = c.isFree ? 'Free' : formatMoney(c.discountPrice ?? c.price)
    return {
      id: c.id,
      cells: {
        thumb: { node: <span className="relative block h-12 w-20 overflow-hidden rounded bg-slate-200"><PlaceholderArt src={c.thumbnail ?? `placeholder:${c.id}`} alt="" label={c.title} fill sizes="80px" className="object-cover" /></span>, sort: '' },
        title: { node: <div className="max-w-md"><Link href={`/admin/courses/${c.id}`} className="font-semibold text-adm-accent-dark hover:underline">{c.title}</Link><p className="text-xs text-slate-500">{cat} · {c.instructor.name}</p></div>, sort: c.title, search: `${c.title} ${cat} ${c.instructor.name}` },
        lessons: { node: lessons, sort: lessons },
        students: { node: c._count.enrollments, sort: c._count.enrollments },
        price: { node: <span className={c.discountPrice && !c.isFree ? '' : ''}>{price}{c.discountPrice && !c.isFree ? <span className="ml-1 text-xs text-slate-400 line-through">{formatMoney(c.price)}</span> : null}</span>, sort: c.discountPrice ?? c.price },
        status: { node: <StatusBadge tone={tone[c.status]}>{c.status === 'UPCOMING' ? 'Upcoming' : c.status === 'DRAFT' ? 'Draft' : 'Published'}</StatusBadge>, sort: c.status },
        actions: {
          sort: '',
          node: (
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/courses/${c.id}`} aria-label={`Edit ${c.title}`} className={btn('outline', 'sm')}><Pencil className="h-4 w-4" aria-hidden="true" /></Link>
              {c.status === 'PUBLISHED' ? <Link href={`/courses/${c.slug}`} target="_blank" aria-label="View on website" className={btn('outline', 'sm')}><ExternalLink className="h-4 w-4" aria-hidden="true" /></Link> : null}
              {c.status === 'PUBLISHED'
                ? <ActionButton action={setCourseStatus.bind(null, c.id, 'DRAFT')}>Unpublish</ActionButton>
                : <ActionButton variant="info" action={setCourseStatus.bind(null, c.id, 'PUBLISHED')}>Publish</ActionButton>}
              <ActionButton variant="danger" label="Delete course" confirm={`Delete “${c.title}”? This removes its lessons and enrolments.`} action={deleteCourse.bind(null, c.id)}><Trash2 className="h-4 w-4" aria-hidden="true" /></ActionButton>
            </div>
          ),
        },
      },
    }
  })
  return (
    <>
      <PageHeader title="Manage courses" actions={<Link href="/admin/courses/new" className={btn('primary')}>Add new course</Link>} />
      <Card title={`All courses (${courses.length})`}>
        <DataTable
          columns={[
            { key: 'thumb', label: 'Thumbnail', sortable: false },
            { key: 'title', label: 'Course' },
            { key: 'lessons', label: 'Lessons' },
            { key: 'students', label: 'Students' },
            { key: 'price', label: 'Price' },
            { key: 'status', label: 'Status' },
            { key: 'actions', label: 'Actions', sortable: false },
          ]}
          rows={rows}
          searchPlaceholder="Title, category, instructor"
        />
      </Card>
    </>
  )
}
