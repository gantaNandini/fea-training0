import { notFound } from 'next/navigation'
import { Card, PageHeader, StatusBadge } from '@/components/admin/ui'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { PageEditor } from '@/components/admin/PageEditor'
import { RecordManager } from '@/components/admin/RecordManager'
import { Tabs } from '@/components/admin/Tabs'
import { SETTING_GROUPS } from '@/lib/admin/settings-def'
import { listRecords } from '@/lib/admin/records.server'
import { getInstructorPercent } from '@/lib/admin/queries'
import { db } from '@/lib/db'
import { SITE_URL } from '@/lib/utils/seo'

export const metadata = { title: 'Settings' }

const PAGE_SLUGS = ['about', 'refund-policy', 'privacy-policy', 'terms', 'cookie-policy']

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm"><span className="font-semibold text-slate-700">{k}</span><span className="text-slate-600">{children}</span></div>
}

export default async function SettingsPage({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params

  const def = SETTING_GROUPS.find((g) => g.id === group)
  if (def) {
    const rows = await db.siteSetting.findMany({ where: { key: { in: def.fields.map((f) => f.key) } } })
    const initial: Record<string, string> = Object.fromEntries(rows.map((r) => [r.key, r.value]))
    if (group === 'instructor') initial.instructor_revenue_percent = String(await getInstructorPercent())
    return (
      <>
        <PageHeader title={def.title} />
        <Card title={def.title}>
          {def.intro ? <p className="mb-5 max-w-2xl text-sm text-slate-600">{def.intro}</p> : null}
          <SettingsForm fields={def.fields} initial={initial} />
        </Card>
      </>
    )
  }

  if (group === 'payment') {
    const provider = (process.env.PAYMENT_PROVIDER ?? 'mock').toLowerCase()
    const hasKeys = !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET
    const testKey = (process.env.RAZORPAY_KEY_ID ?? '').startsWith('rzp_test_')
    return (
      <>
        <PageHeader title="Payment settings" />
        <Card title="Payment gateway">
          <p className="mb-4 max-w-2xl text-sm text-slate-600">Payment keys are secrets, so they are set in the server environment (<code>.env</code> or the hosting dashboard), not in this page.</p>
          <Row k="Active provider">{provider === 'razorpay' ? <StatusBadge tone="green">Razorpay</StatusBadge> : <StatusBadge tone="amber">Mock (demo, no real payments)</StatusBadge>}</Row>
          <Row k="Razorpay keys">{hasKeys ? <StatusBadge tone="green">Configured{testKey ? ' (test mode)' : ' (live)'}</StatusBadge> : <StatusBadge tone="slate">Not set</StatusBadge>}</Row>
          <Row k="Webhook URL"><code>{SITE_URL}/api/payments/webhook</code></Row>
          <Row k="Webhook events"><code>payment.captured, payment.failed</code></Row>
          <p className="mt-4 text-xs text-slate-500">GST, currency (INR) and order limits are under System settings.</p>
        </Card>
      </>
    )
  }

  if (group === 'language') {
    return (
      <>
        <PageHeader title="Language settings" />
        <Card title="Languages">
          <p className="max-w-2xl text-sm text-slate-600">The platform currently runs in <strong>English</strong>. All interface text is kept in one file (<code>src/lib/messages.ts</code>), so adding a language later means translating that file. Course content language is chosen per course in the course editor.</p>
        </Card>
      </>
    )
  }

  if (group === 'social-login') {
    const google = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
    return (
      <>
        <PageHeader title="Social login" />
        <Card title="Sign-in providers">
          <Row k="Email and password"><StatusBadge tone="green">Enabled</StatusBadge></Row>
          <Row k="Google">{google ? <StatusBadge tone="green">Enabled</StatusBadge> : <StatusBadge tone="slate">Not configured</StatusBadge>}</Row>
          <p className="mt-4 max-w-2xl text-sm text-slate-600">To enable Google sign-in, create OAuth credentials in Google Cloud Console and set <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in the server environment, with the redirect URI <code>{SITE_URL}/api/auth/callback/google</code>.</p>
        </Card>
      </>
    )
  }

  if (group === 'about') {
    const pages = await db.page.findMany({ where: { slug: { in: PAGE_SLUGS } } })
    const ordered = PAGE_SLUGS.map((s) => pages.find((p) => p.slug === s)).filter((p): p is NonNullable<typeof p> => !!p)
    return (
      <>
        <PageHeader title="About and policy pages" />
        <Card title="Edit page content">
          <PageEditor pages={ordered.map((p) => ({ slug: p.slug, title: p.title, body: p.body }))} />
        </Card>
      </>
    )
  }

  if (group === 'home') {
    const [hero, testimonials, logos, webinars, announcements] = await Promise.all([
      listRecords('heroSlide'), listRecords('testimonial'), listRecords('clientLogo'), listRecords('webinar'), listRecords('announcement'),
    ])
    return (
      <>
        <PageHeader title="Home page setting" />
        <Card>
          <Tabs
            tabs={[
              { id: 'hero', label: 'Hero slides', content: <RecordManager model="heroSlide" records={hero} /> },
              { id: 'testimonials', label: 'Testimonials', content: <RecordManager model="testimonial" records={testimonials} /> },
              { id: 'logos', label: 'Client logos', content: <RecordManager model="clientLogo" records={logos} /> },
              { id: 'webinars', label: 'Webinar', content: <RecordManager model="webinar" records={webinars} /> },
              { id: 'announcement', label: 'Announcement bar', content: <RecordManager model="announcement" records={announcements} /> },
            ]}
          />
        </Card>
      </>
    )
  }

  notFound()
}
