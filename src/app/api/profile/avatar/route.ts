import sharp from 'sharp'
import { fail, ok, unauthenticated } from '@/lib/api/http'
import { getFreshUser } from '@/lib/auth/guards'
import { getProfile, setAvatar } from '@/lib/data/users'
import { storage } from '@/lib/storage'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])

/** REQ-315: JPEG FF D8 FF, PNG 89 50 4E 47, WebP "RIFF"...."WEBP". */
function hasImageMagic(b: Buffer): boolean {
  if (b.length < 12) return false
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
  const webp =
    b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP'
  return jpeg || png || webp
}

export async function POST(req: Request) {
  const user = await getFreshUser()
  if (!user) return unauthenticated()

  let file: File | null = null
  try {
    const form = await req.formData()
    const f = form.get('avatar')
    file = f instanceof File ? f : null
  } catch {
    return fail('VALIDATION_ERROR', 'Invalid upload.', 400)
  }
  if (!file) return fail('VALIDATION_ERROR', 'Choose an image to upload.', 400)
  if (file.size > MAX_BYTES) return fail('FILE_TOO_LARGE', 'The image must be 2 MB or smaller.', 413)
  if (!ALLOWED.has(file.type)) return fail('BAD_TYPE', 'Only JPEG, PNG or WebP images are accepted.', 415)

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!hasImageMagic(buffer)) return fail('BAD_TYPE', 'This file is not a valid image.', 415)

  // Re-encode: strips metadata and guarantees a safe, small WebP.
  let out: Buffer
  try {
    out = await sharp(buffer).rotate().resize(256, 256, { fit: 'cover' }).webp({ quality: 85 }).toBuffer()
  } catch {
    return fail('BAD_TYPE', 'This file is not a valid image.', 415)
  }

  const key = `avatars/${user.id}-${Date.now()}.webp`
  const { url } = await storage.put(key, out, 'image/webp')

  const previous = (await getProfile(user.id))?.image
  await setAvatar(user.id, url)
  if (previous?.startsWith('/api/files/avatars/')) {
    await storage.remove(previous.replace('/api/files/', ''))
  }
  return ok({ image: url })
}
