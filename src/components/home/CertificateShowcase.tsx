import { CheckCircle2 } from 'lucide-react'
import { CertificateView } from '@/components/certificate/CertificateView'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { getSettings } from '@/lib/data/settings'

const POINTS = [
  'Issued automatically when you complete every lesson of a course',
  'Carries your name, the course and the date of completion',
  'Unique ID that employers can verify on this website',
  'Download or print as a PDF from your My courses page',
]

/** Home page: shows the certificate template learners receive. */
export async function CertificateShowcase() {
  const s = await getSettings()
  return (
    <section id="certificate" className="section-y" aria-labelledby="cert-heading">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2">
        <div>
          <SectionHeader id="cert-heading" title="Earn a certificate of completion" className="mb-4" />
          <ul className="space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-plum-700 dark:text-plum-300" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <CertificateView
          sample
          learnerName="Your Name"
          courseTitle="Course title"
          date="Date of completion"
          code="PYT-XXXXX-XXXXX"
          company={s.company_name ?? 'PYTHAGORAS'}
        />
      </div>
    </section>
  )
}
