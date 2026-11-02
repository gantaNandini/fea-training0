import { randomBytes } from 'node:crypto'
import { db } from '@/lib/db'
import { getCourseProgress } from './progress'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

function newCode(): string {
  const bytes = randomBytes(10)
  let out = ''
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
  return `PYT-${out.slice(0, 5)}-${out.slice(5)}`
}

export interface CertificateDTO {
  code: string
  learnerName: string
  courseTitle: string
  issuedAt: string
}

/** Issues (or returns the existing) certificate. Only for an enrolled learner at 100% completion. */
export async function issueCertificate(
  userId: string,
  courseId: string,
): Promise<{ ok: true; code: string } | { ok: false; reason: 'NOT_ENROLLED' | 'NOT_COMPLETE' }> {
  const enrolled = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  })
  if (!enrolled) return { ok: false, reason: 'NOT_ENROLLED' }

  const existing = await db.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { code: true },
  })
  if (existing) return { ok: true, code: existing.code }

  const progress = await getCourseProgress(userId, courseId)
  if (progress.totalLessons === 0 || progress.percent < 100) return { ok: false, reason: 'NOT_COMPLETE' }

  const [user, course] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
  ])
  if (!user || !course) return { ok: false, reason: 'NOT_ENROLLED' }

  for (let i = 0; i < 5; i++) {
    try {
      const cert = await db.certificate.create({
        data: {
          code: newCode(),
          userId,
          courseId,
          learnerName: (user.name ?? user.email.split('@')[0]).trim(),
          courseTitle: course.title,
        },
      })
      return { ok: true, code: cert.code }
    } catch {
      // unique collision on code, or a concurrent issue for the same user+course
      const again = await db.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { code: true },
      })
      if (again) return { ok: true, code: again.code }
    }
  }
  return { ok: false, reason: 'NOT_COMPLETE' }
}

export async function getCertificateByCode(code: string): Promise<CertificateDTO | null> {
  if (!/^PYT-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(code)) return null
  const c = await db.certificate.findUnique({ where: { code } })
  if (!c) return null
  return { code: c.code, learnerName: c.learnerName, courseTitle: c.courseTitle, issuedAt: c.issuedAt.toISOString() }
}

/** courseId -> certificate code, for the My courses page. */
export async function getCertificateCodes(userId: string): Promise<Record<string, string>> {
  const rows = await db.certificate.findMany({ where: { userId }, select: { courseId: true, code: true } })
  return Object.fromEntries(rows.map((r) => [r.courseId, r.code]))
}
