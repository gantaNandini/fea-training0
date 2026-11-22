import { createHmac, timingSafeEqual } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import type { StorageProvider } from './index'

const ROOT = path.join(process.cwd(), 'public', 'uploads')
const KEY_RE = /^[a-zA-Z0-9][a-zA-Z0-9._\-/]*$/

function secret(): string {
  return process.env.NEXTAUTH_SECRET ?? 'dev-secret'
}

/** REQ-315: reject traversal and odd characters; result always stays inside ROOT. */
export function safeResolve(key: string): string | null {
  if (!KEY_RE.test(key) || key.includes('..') || key.includes('//')) return null
  const full = path.resolve(ROOT, key)
  if (!full.startsWith(ROOT + path.sep)) return null
  return full
}

export function signKey(key: string, exp: number): string {
  return createHmac('sha256', secret()).update(`${key}:${exp}`).digest('base64url')
}

export function verifySignedKey(key: string, exp: number, sig: string): boolean {
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false
  const expected = Buffer.from(signKey(key, exp))
  const given = Buffer.from(sig)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

export class LocalStorageProvider implements StorageProvider {
  async put(key: string, data: Buffer) {
    const full = safeResolve(key)
    if (!full) throw new Error('Invalid storage key')
    await fs.mkdir(path.dirname(full), { recursive: true })
    await fs.writeFile(full, data)
    return { key, url: `/api/files/${key}` }
  }

  async remove(key: string) {
    const full = safeResolve(key)
    if (!full) return
    await fs.rm(full, { force: true })
  }

  getSignedUrl(key: string, ttlSeconds = 300) {
    // files uploaded straight to Blob storage are stored as full https URLs
    if (/^https:\/\//.test(key)) return key
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds
    return `/api/files/${key}?exp=${exp}&sig=${signKey(key, exp)}`
  }

  async read(key: string) {
    const full = safeResolve(key)
    if (!full) return null
    try {
      return await fs.readFile(full)
    } catch {
      return null
    }
  }
}
