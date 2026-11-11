import Image from 'next/image'

export interface CertificateViewProps {
  learnerName: string
  courseTitle: string
  /** ISO date string (real certificate) or a ready-made label (sample) */
  date: string
  code: string
  company?: string
  sample?: boolean
  topics?: string[]
  /** e.g. "13 February to 31 March 2026" — when provided, shown as the date range */
  dateRange?: string
  signatoryName?: string
  signatoryTitle?: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

/**
 * Printable completion certificate (landscape, A4 ratio).
 * Design matches the Pythagoras reference certificate:
 *   - Turquoise outer border
 *   - Rounded black inner border
 *   - Company logo top-left
 *   - Large "CERTIFICATE" heading, navy blue
 *   - Recipient in an italic/script style
 *   - Course topics as bullet list
 *   - Dr. Joel Daniel signature bottom-right
 */
export function CertificateView({
  learnerName,
  courseTitle,
  date,
  code,
  company = 'PYTHAGORAS',
  sample,
  topics,
  dateRange,
  signatoryName = 'Dr. Joel Daniel',
  signatoryTitle = 'Head – Finite Element Method',
}: CertificateViewProps) {
  const displayDate = sample ? date : formatDate(date)

  return (
    <div
      data-testid="certificate"
      className="certificate relative mx-auto w-full max-w-[900px] overflow-hidden bg-white shadow-2xl"
      style={{
        aspectRatio: '1.414 / 1',
        // Turquoise outer border matching reference image
        border: '8px solid #14b8a6',
      }}
    >
      {/* Inner rounded black border */}
      <div
        className="absolute inset-3 flex flex-col"
        style={{ border: '2.5px solid #1e293b', borderRadius: '10px', overflow: 'hidden' }}
      >
        {/* Content area */}
        <div className="flex h-full flex-col px-8 py-6 text-slate-900 sm:px-14 sm:py-8">

          {/* ── Top row: Logo + "CERTIFICATE" heading ── */}
          <div className="flex items-start justify-between gap-4">
            {/* Logo — left */}
            <div className="flex shrink-0 items-center gap-3">
              {/* Use actual logo image if available, else fallback to text mark */}
              <div className="relative h-14 w-14 sm:h-16 sm:w-16">
                <Image
                  src="/brand/logo-mark.svg"
                  alt={`${company} logo`}
                  fill
                  sizes="64px"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold uppercase tracking-widest text-teal-600 sm:text-sm">{company}</p>
                <p className="text-[10px] text-slate-500 sm:text-xs">Engineering Consultancy &amp; Services</p>
                <p className="text-[9px] italic text-slate-400 sm:text-[11px]">Innovation for Better</p>
              </div>
            </div>

            {/* CERTIFICATE heading — right of logo */}
            <div className="flex-1 text-center">
              <h1
                className="font-display font-extrabold uppercase tracking-[0.15em] text-slate-800 sm:tracking-[0.2em]"
                style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
              >
                Certificate
              </h1>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.25em] text-teal-600 sm:text-sm">
                of Completion
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-400 sm:text-xs">
                This Certificate Is Presented To
              </p>
            </div>

            {/* Spacer equal to logo width */}
            <div className="shrink-0" style={{ width: '5rem' }} aria-hidden="true" />
          </div>

          {/* ── Recipient name ── */}
          <div className="mt-3 text-center sm:mt-4">
            <p
              className="inline-block border-b-2 border-slate-300 pb-1 font-display italic text-teal-600"
              style={{ fontSize: 'clamp(1.4rem, 4.5vw, 2.8rem)', fontWeight: 700, fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {learnerName}
            </p>
          </div>

          {/* ── Course statement ── */}
          <div className="mt-3 space-y-1 text-center sm:mt-4">
            <p className="text-xs text-slate-600 sm:text-sm">Has Successfully Completed Training Course on</p>
            <p
              className="mx-auto font-display font-semibold text-slate-800"
              style={{ fontSize: 'clamp(0.75rem, 2vw, 1.05rem)', maxWidth: '80%' }}
            >
              &ldquo;{courseTitle}&rdquo;
            </p>
            {(dateRange ?? displayDate) ? (
              <p className="text-[10px] text-slate-500 sm:text-xs">
                From {dateRange ?? displayDate}
              </p>
            ) : null}
          </div>

          {/* ── Topics list ── */}
          {topics && topics.length > 0 ? (
            <ul className="mx-auto mt-3 w-full max-w-xl space-y-0.5 text-left sm:mt-4">
              {topics.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-[10px] text-slate-700 sm:text-xs">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          ) : null}

          {/* ── Bottom row: branding + signature + cert ID ── */}
          <div className="mt-auto flex items-end justify-between gap-4 pt-3 sm:pt-4">
            {/* Bottom branding */}
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 sm:h-10 sm:w-10">
                <Image src="/brand/logo-mark.svg" alt="" fill sizes="40px" className="object-contain" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-700 sm:text-[11px]">{company}</p>
                <p className="text-[8px] text-slate-500 sm:text-[10px]">Engineering Consultancy &amp; Services</p>
              </div>
            </div>

            {/* Certificate code */}
            <div className="text-center">
              <p className="font-mono text-[9px] font-semibold text-slate-500 sm:text-[11px]">{code}</p>
              <p className="text-[8px] text-slate-400 sm:text-[10px]">
                {sample ? 'Sample Certificate ID' : 'Certificate ID'}
              </p>
            </div>

            {/* Signature */}
            <div className="text-center">
              {/* Signature line */}
              <div className="mb-1 h-8 w-24 sm:h-10 sm:w-28">
                {/* Decorative signature squiggle — real certificate would have an image */}
                <svg viewBox="0 0 112 40" aria-hidden="true" className="h-full w-full">
                  <path
                    d="M10 30 Q 30 5, 50 25 Q 65 38, 80 18 Q 90 8, 100 22"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-700 sm:text-[11px]">{signatoryName}</p>
                <p className="text-[8px] text-slate-500 sm:text-[10px]">{signatoryTitle}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
