import Link from 'next/link'
import { BookOpen, GraduationCap, IndianRupee, MessageSquare, Network, ShoppingBag, UserCheck } from 'lucide-react'
import { Card, PageHeader, formatMoney } from '@/components/admin/ui'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { getDashboard } from '@/lib/admin/queries'

export const metadata = { title: 'Dashboard' }

function Stat({ label, value, sub, Icon, href }: { label: string; value: string; sub?: string; Icon: React.ComponentType<{ className?: string }>; href?: string }) {
  const body = (
    <div className="flex items-center gap-4 rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-adm-accent-soft text-adm-accent-dark"><Icon className="h-6 w-6" aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="font-display text-2xl font-extrabold text-slate-800">{value}</p>
        {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
      </div>
    </div>
  )
  return href ? <Link href={href} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adm-accent/50">{body}</Link> : body
}

export default async function DashboardPage() {
  const d = await getDashboard()
  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total revenue" value={formatMoney(d.revenueTotal)} sub={`${d.orderCount} paid orders`} Icon={IndianRupee} href="/admin/reports/admin-revenue" />
        <Stat label="This month" value={formatMoney(d.revenueMonth)} sub={`${d.orderCountMonth} orders`} Icon={ShoppingBag} href="/admin/reports/admin-revenue" />
        <Stat label="Enrolments" value={String(d.enrolments)} Icon={Network} href="/admin/enrolments" />
        <Stat label="Students" value={String(d.students)} Icon={GraduationCap} href="/admin/users/students" />
        <Stat label="Courses" value={String(d.courses)} sub={`${d.published} published`} Icon={BookOpen} href="/admin/courses" />
        <Stat label="Instructors" value={String(d.instructors)} Icon={UserCheck} href="/admin/users/instructors" />
        <Stat label="Unread messages" value={String(d.unread)} Icon={MessageSquare} href="/admin/message" />
        <Stat label="Instructor share" value={`${d.percent}%`} sub="of each sale" Icon={IndianRupee} href="/admin/settings/instructor" />
      </div>

      <Card title={`Revenue this year (${d.year})`}>
        <RevenueChart values={d.byMonth} year={d.year} />
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Recent enrolments" actions={<Link href="/admin/enrolments" className="text-sm font-semibold text-adm-accent-dark hover:underline">View all</Link>}>
          {d.recent.length === 0 ? <p className="text-sm text-slate-500">No enrolments yet.</p> : (
            <ul className="divide-y divide-slate-100">
              {d.recent.map((e) => (
                <li key={e.id} className="py-3 text-sm">
                  <p className="font-semibold text-slate-800">{e.user.name ?? e.user.email}</p>
                  <p className="text-slate-500">{e.course.title}</p>
                  <p className="text-xs text-slate-400">{e.enrolledAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Most popular courses" actions={<Link href="/admin/courses" className="text-sm font-semibold text-adm-accent-dark hover:underline">Manage</Link>}>
          <ol className="divide-y divide-slate-100">
            {d.top.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-adm-accent-soft text-xs font-bold text-adm-accent-dark">{i + 1}</span>
                <Link href={`/admin/courses/${c.id}`} className="flex-1 font-medium text-slate-800 hover:text-adm-accent-dark">{c.title}</Link>
                <span className="text-slate-500">{c.students} students</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  )
}
