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
 * Printable completion certificate (landscape A4).
 * Matches the Pythagoras reference certificate exactly:
 *   - Teal outer border + black inner rounded border
 *   - Circular stamp seal top-left
 *   - Large serif CERTIFICATE OF COMPLETION heading, centred
 *   - Recipient name in italic script (large, teal, underlined)
 *   - Course title in quotes, date range, bullet topics
 *   - Pythagoras logo + name bottom-left; Dr. Joel Daniel signature bottom-right
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
  signatoryTitle = 'Head- Finite Element Method',
}: CertificateViewProps) {
  const displayDate = sample ? date : formatDate(date)

  return (
    <>
      {/* Print styles — A4 landscape */}
      <style>{`
        @media print {
          body > *:not([data-print-cert]) { display: none !important; }
          [data-print-cert] { display: block !important; }
        }
        @page { size: A4 landscape; margin: 8mm; }
      `}</style>

      <div
        data-testid="certificate"
        data-print-cert
        className="certificate relative mx-auto w-full max-w-[900px] bg-white shadow-2xl print:max-w-none print:shadow-none"
        style={{ aspectRatio: '1.414 / 1', border: '10px solid #0d9488' }}
      >
        {/* Inner black border */}
        <div
          className="absolute inset-[10px] flex flex-col"
          style={{ border: '2.5px solid #0f172a', borderRadius: '8px', overflow: 'hidden' }}
        >
          <div className="relative flex h-full flex-col px-10 py-6 text-slate-900 sm:px-16 sm:py-8">

            {/* ── Circular stamp seal — top left ── */}
            <div
              className="absolute left-6 top-6 sm:left-10 sm:top-8"
              style={{ width: 'clamp(56px, 8vw, 80px)', height: 'clamp(56px, 8vw, 80px)' }}
              aria-label={`${company} seal`}
            >
              {/* Outer teal ring */}
              <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <circle cx="40" cy="40" r="38" fill="none" stroke="#0d9488" strokeWidth="2.5" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="#0d9488" strokeWidth="1" />
                {/* Curved text path */}
                <defs>
                  <path id="topArc"  d="M 12,40 A 28,28 0 0,1 68,40" />
                  <path id="botArc"  d="M 12,40 A 28,28 0 0,0 68,40" />
                </defs>
                <text fontSize="6" fontFamily="serif" fill="#0d9488" letterSpacing="1">
                  <textPath href="#topArc" startOffset="10%">Pythagoras Engineering</textPath>
                </text>
                <text fontSize="6" fontFamily="serif" fill="#0d9488" letterSpacing="1">
                  <textPath href="#botArc" startOffset="8%">Consultancy and Services Pvt Ltd</textPath>
                </text>
                {/* Star in centre */}
                <text x="40" y="44" textAnchor="middle" fontSize="10" fill="#0d9488" fontFamily="serif">★</text>
              </svg>
              {/* Logo mark inside */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative" style={{ width: '42%', height: '42%' }}>
                  <Image src="/brand/logo-mark.svg" alt="" fill sizes="32px" className="object-contain opacity-80" />
                </div>
              </div>
            </div>

            {/* ── CERTIFICATE heading — centred ── */}
            <div className="text-center" style={{ paddingLeft: 'clamp(60px, 10vw, 90px)' }}>
              <h1
                className="font-display font-extrabold uppercase text-slate-800"
                style={{ fontSize: 'clamp(1.6rem, 4.5vw, 2.8rem)', letterSpacing: '0.18em', fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Certificate
              </h1>
              <p
                className="font-semibold uppercase text-slate-700"
                style={{ fontSize: 'clamp(0.65rem, 1.6vw, 1rem)', letterSpacing: '0.3em', marginTop: '-2px' }}
              >
                of Completion
              </p>
              <p
                className="mt-1 uppercase tracking-widest text-slate-500"
                style={{ fontSize: 'clamp(0.55rem, 1.2vw, 0.75rem)', letterSpacing: '0.22em' }}
              >
                This Certificate Is Presented To
              </p>
            </div>

            {/* ── Recipient name ── */}
            <div className="mt-2 text-center sm:mt-3">
              <p
                className="inline-block border-b-2 border-slate-400 pb-0.5 italic text-teal-600"
                style={{
                  fontSize: 'clamp(1.3rem, 4vw, 2.4rem)',
                  fontFamily: '"Dancing Script", "Brush Script MT", cursive, Georgia, serif',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  maxWidth: '90%',
                  overflowWrap: 'break-word',
                  display: 'inline-block',
                }}
              >
                {learnerName}
              </p>
            </div>

            {/* ── Course statement ── */}
            <div className="mt-2 space-y-0.5 text-center sm:mt-3">
              <p style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.85rem)' }} className="text-slate-600">
                Has Successfully Completed Training Course on
              </p>
              <p
                className="mx-auto font-semibold text-slate-800"
                style={{
                  fontSize: 'clamp(0.6rem, 1.5vw, 0.85rem)',
                  maxWidth: '85%',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  overflowWrap: 'break-word',
                }}
              >
                &ldquo;{courseTitle}&rdquo;
              </p>
              {(dateRange ?? displayDate) ? (
                <p style={{ fontSize: 'clamp(0.55rem, 1.3vw, 0.78rem)' }} className="text-slate-600">
                  From {dateRange ?? displayDate}
                </p>
              ) : null}
            </div>

            {/* ── Topics list ── */}
            {topics && topics.length > 0 ? (
              <ul className="mx-auto mt-2 w-full max-w-2xl space-y-0.5 text-left sm:mt-3">
                {topics.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-slate-700"
                    style={{ fontSize: 'clamp(0.52rem, 1.2vw, 0.72rem)' }}
                  >
                    <span className="shrink-0 select-none" aria-hidden="true">•</span>
                    <span style={{ overflowWrap: 'break-word', minWidth: 0 }}>{t}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {/* ── Bottom row ── */}
            <div className="mt-auto flex items-end justify-between gap-4 pt-3">

              {/* Left: full Pythagoras logo + name */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative shrink-0" style={{ width: 'clamp(32px,5vw,52px)', height: 'clamp(32px,5vw,52px)' }}>
                  <Image src="/brand/logo-mark.svg" alt={`${company} logo`} fill sizes="52px" className="object-contain" />
                </div>
                <div className="leading-tight">
                  <p
                    className="font-extrabold uppercase text-teal-700"
                    style={{ fontSize: 'clamp(0.65rem, 1.6vw, 1.1rem)', letterSpacing: '0.08em', fontFamily: 'Arial, sans-serif' }}
                  >
                    PYTHAGORAS
                  </p>
                  <p className="text-slate-600" style={{ fontSize: 'clamp(0.48rem, 1.1vw, 0.65rem)' }}>
                    Engineering Consultancy &amp; Services
                  </p>
                  <p className="font-semibold italic text-slate-500" style={{ fontSize: 'clamp(0.42rem, 0.9vw, 0.58rem)' }}>
                    INNOVATION FOR BETTER
                  </p>
                </div>
              </div>

              {/* Centre: cert ID */}
              <div className="text-center">
                <p className="font-mono text-slate-400" style={{ fontSize: 'clamp(0.42rem, 0.9vw, 0.6rem)' }}>
                  {code}
                </p>
                <p className="text-slate-400" style={{ fontSize: 'clamp(0.38rem, 0.8vw, 0.55rem)' }}>
                  {sample ? 'Sample Certificate ID' : 'Certificate ID'}
                </p>
              </div>

              {/* Right: signature */}
              <div className="text-center">
                <div
                  className="mx-auto mb-1"
                  style={{ width: 'clamp(70px,10vw,110px)', height: 'clamp(28px,4vw,44px)' }}
                >
                  <svg viewBox="0 0 110 44" aria-hidden="true" className="h-full w-full">
                    {/* More organic signature shape matching the reference */}
                    <path
                      d="M8 36 Q18 10 30 28 Q38 40 48 20 Q55 8 65 24 Q72 36 82 18 Q90 8 102 22"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M55 30 Q60 38 70 34"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <p
                    className="font-bold uppercase tracking-wide text-slate-800"
                    style={{ fontSize: 'clamp(0.48rem, 1.1vw, 0.72rem)' }}
                  >
                    {signatoryName}
                  </p>
                  <p className="text-slate-500" style={{ fontSize: 'clamp(0.42rem, 0.9vw, 0.62rem)' }}>
                    {signatoryTitle}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
