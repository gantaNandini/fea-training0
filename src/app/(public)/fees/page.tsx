import type { Metadata } from 'next'
import { PageHero } from '@/components/shared/PageHero'
import { CourseFeesTable } from '@/components/home/CourseFeesTable'
import { CertificateShowcase } from '@/components/home/CertificateShowcase'
import { buildMetadata } from '@/lib/utils/seo'

export const revalidate = 600
export const metadata: Metadata = buildMetadata({
  title: 'Course duration and syllabus',
  description: 'Duration of every course, with downloadable syllabus PDFs.',
  path: '/fees',
})

export default function FeesPage() {
  return (
    <>
      <PageHero title="Syllabus" subtitle="Compare every programme at a glance and download the detailed syllabus." crumb="Syllabus" />
      <CourseFeesTable hideHeading />
      <CertificateShowcase />
    </>
  )
}
