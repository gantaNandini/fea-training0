import { Award } from 'lucide-react'

export interface CertificateViewProps {
  learnerName: string
  courseTitle: string
  /** ISO date string (real certificate) or a ready-made label (sample) */
  date: string
  code: string
  company?: string
  sample?: boolean
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

/** Printable completion certificate (landscape, A4 ratio). Used for the real one and the home-page sample. */
export function CertificateView({ learnerName, courseTitle, date, code, company = 'PYTHAGORAS', sample }: CertificateViewProps) {
  return (
    <div
      data-testid="certificate"
      className="certificate relative mx-auto aspect-[1.414/1] w-full max-w-4xl overflow-hidden rounded-lg border-[10px] border-double border-plum-700 bg-white p-3 text-slate-900 shadow-lg sm:p-5"
    >
      <div className="flex h-full flex-col items-center justify-between border border-amber-500/70 px-4 py-4 text-center sm:px-10 sm:py-8">
        <div>
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-plum-700 text-white sm:h-14 sm:w-14">
            <Award className="h-5 w-5 sm:h-7 sm:w-7" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-xs font-bold uppercase tracking-[0.25em] text-plum-700 sm:text-sm">{company}</p>
          <h3 className="mt-1 font-display text-xl font-extrabold uppercase tracking-wide sm:text-4xl">Certificate of Completion</h3>
        </div>
        <div className="w-full">
          <p className="text-xs text-slate-600 sm:text-base">This is to certify that</p>
          <p className="mx-auto mt-1 max-w-[90%] border-b border-slate-300 pb-1 font-display text-2xl font-bold italic text-plum-700 sm:mt-2 sm:text-5xl">
            {learnerName}
          </p>
          <p className="mt-2 text-xs text-slate-600 sm:mt-4 sm:text-base">has successfully completed the course</p>
          <p className="mx-auto mt-1 max-w-[90%] font-display text-base font-bold sm:text-2xl">{courseTitle}</p>
        </div>
        <div className="flex w-full items-end justify-between text-left text-[10px] text-slate-600 sm:text-sm">
          <div>
            <p className="font-semibold text-slate-900">{sample ? date : formatDate(date)}</p>
            <p>Date of issue</p>
          </div>
          <div className="text-right">
            <p className="font-mono font-semibold text-slate-900">{code}</p>
            <p>{sample ? 'Every certificate has a unique ID' : 'Certificate ID'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
