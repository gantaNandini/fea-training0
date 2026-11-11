import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BadgeCheck } from 'lucide-react'
import { CertificateView } from '@/components/certificate/CertificateView'
import { PrintButton } from '@/components/certificate/PrintButton'
import { getCertificateByCode } from '@/lib/data/certificates'
import { getSettings } from '@/lib/data/settings'
import { db } from '@/lib/db'
import { buildMetadata } from '@/lib/utils/seo'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  return buildMetadata({
    title: 'Certificate verification',
    description: 'Verify a PYTHAGORAS course completion certificate.',
    path: `/certificate/${code}`,
    noIndex: true,
  })
}

const PRINT_CSS = `
@page { size: A4 landscape; margin: 8mm; }
@media print {
  header, footer, nav, .no-print { display: none !important; }
  body { background: #fff !important; }
  .certificate { box-shadow: none !important; max-width: none !important; width: 100% !important; }
}`

export default async function CertificatePage({ params }: Props) {
  const { code } = await params
  const [cert, settings] = await Promise.all([getCertificateByCode(code.toUpperCase()), getSettings()])
  if (!cert) notFound()

  // Try to fetch course outcomes to show as topics on the certificate
  const course = await db.course.findFirst({
    where: { title: cert.courseTitle },
    select: { outcomes: true, eligibility: true },
  }).catch(() => null)
  const topics = (course?.outcomes ?? []).slice(0, 5)

  return (
    <div className="container-page py-10 md:py-14">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="no-print mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          <BadgeCheck className="h-5 w-5" aria-hidden="true" />
          Verified: this certificate was issued by {settings.company_name ?? 'PYTHAGORAS'}.
        </p>
        <PrintButton />
      </div>
      <CertificateView
        learnerName={cert.learnerName}
        courseTitle={cert.courseTitle}
        date={cert.issuedAt}
        code={cert.code}
        company={settings.company_name ?? 'PYTHAGORAS'}
        topics={topics.length > 0 ? topics : undefined}
      />
    </div>
  )
}
