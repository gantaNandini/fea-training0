import Link from 'next/link'
import { Download } from 'lucide-react'
import { getFeeRows } from '@/lib/data/fees'
import { getSettings } from '@/lib/data/settings'
import { effectivePrice } from '@/lib/utils/pricing'
import { SectionHeader } from '@/components/shared/SectionHeader'

/** Home page: Sr. No. / Course / Duration (hrs) / [Fee] / Syllabus PDF. The fee column is a setting. */
export async function CourseFeesTable() {
  const [rows, settings] = await Promise.all([getFeeRows(), getSettings()])
  if (rows.length === 0) return null
  const showFee = settings.show_fee_column === 'true'

  return (
    <section id="fees" className="section-y bg-surface-alt" aria-labelledby="fees-heading">
      <div className="container-page">
        <SectionHeader
          id="fees-heading"
          title="Course Duration and Fees"
          subtitle="Compare every programme at a glance and download the detailed syllabus."
        />
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm" data-testid="fees-table">
            <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Sr. No.</th>
                <th scope="col" className="px-4 py-3">Course title</th>
                <th scope="col" className="px-4 py-3">Duration (hrs)</th>
                {showFee ? <th scope="col" className="px-4 py-3">Fee</th> : null}
                <th scope="col" className="px-4 py-3">Syllabus</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.slug} className="border-t border-border">
                  <td className="px-4 py-3 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/courses/${r.slug}`} className="hover:text-link hover:underline">{r.title}</Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.hours > 0 ? r.hours : '—'}</td>
                  {showFee ? (
                    <td className="px-4 py-3 tabular-nums">
                      {r.isFree ? 'Free' : `₹${(effectivePrice(r.price, r.discountPrice) / 100).toLocaleString('en-IN')}`}
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    {r.syllabusUrl ? (
                      <a
                        href={r.syllabusUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-link underline-offset-4 hover:underline"
                        aria-label={`Download syllabus for ${r.title}`}
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        PDF
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Coming soon</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
