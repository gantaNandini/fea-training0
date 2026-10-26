import { randomBytes } from 'crypto'
import sharp from 'sharp'
import { fail, ok, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { storage } from '@/lib/storage'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const IMAGE_MAX = 5 * 1024 * 1024
const DOC_MAX = 25 * 1024 * 1024

function isImage(b: Buffer): boolean {
  if (b.length < 12) return false
  return (
    (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) ||
    (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) ||
    (b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP')
  )
}

/**
 * Admin-only uploads. kind=image → re-encoded WebP in public `media/`; kind=document → PDF kept
 * private (served only through short-lived signed URLs for enrolled students).
 */
export async function POST(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()
  if (user.role !== 'ADMIN') return fail('FORBIDDEN', 'Admins only.', 403)

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return fail('VALIDATION_ERROR', 'Invalid upload.', 400)
  }
  const file = form.get('file')
  const kind = form.get('kind')
  if (!(file instanceof File)) return fail('VALIDATION_ERROR', 'Choose a file.', 400)
  const buffer = Buffer.from(await file.arrayBuffer())
  const id = `${Date.now()}-${randomBytes(4).toString('hex')}`

  if (kind === 'image') {
    if (file.size > IMAGE_MAX) return fail('FILE_TOO_LARGE', 'Images must be 5 MB or smaller.', 413)
    if (!isImage(buffer)) return fail('BAD_TYPE', 'Only JPEG, PNG or WebP images are accepted.', 415)
    let out: Buffer
    try {
      out = await sharp(buffer).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
    } catch {
      return fail('BAD_TYPE', 'This file is not a valid image.', 415)
    }
    const { url } = await storage.put(`media/${id}.webp`, out, 'image/webp')
    return ok({ url })
  }

  if (kind === 'document') {
    if (file.size > DOC_MAX) return fail('FILE_TOO_LARGE', 'Documents must be 25 MB or smaller.', 413)
    if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') return fail('BAD_TYPE', 'Only PDF documents are accepted.', 415)
    const key = `docs/${id}.pdf`
    await storage.put(key, buffer, 'application/pdf')
    return ok({ key })
  }

  return fail('VALIDATION_ERROR', 'Unknown upload kind.', 400)
}
