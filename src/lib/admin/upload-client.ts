'use client'

/**
 * Browser-side upload of ANY file for a lesson. Prefers direct-to-Blob-storage (no size or type
 * limit, bypasses the serverless body limit); falls back to the server route for local development.
 */
export async function uploadLessonFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ ref: string } | { error: string }> {
  let blobEnabled = false
  try {
    const r = await fetch('/api/admin/upload/blob', { cache: 'no-store' })
    blobEnabled = r.ok && ((await r.json()) as { enabled?: boolean }).enabled === true
  } catch {
    /* fall back to server upload */
  }

  if (blobEnabled) {
    try {
      const { upload } = await import('@vercel/blob/client')
      const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-120) || 'file'
      const blob = await upload(`lessons/${safe}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload/blob',
        multipart: file.size > 20 * 1024 * 1024,
        onUploadProgress: (p: { percentage: number }) => onProgress?.(Math.round(p.percentage)),
      })
      return { ref: blob.url }
    } catch (e) {
      return { error: (e as Error).message || 'Upload failed.' }
    }
  }

  // server upload (local dev, or hosts without Blob). Serverless hosts cap this at roughly 4.5 MB.
  if (file.size > 4 * 1024 * 1024 && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return { error: 'This file is larger than 4 MB and file storage is not enabled yet. Ask the developer to enable Blob storage (BLOB_READ_WRITE_TOKEN).' }
  }
  const form = new FormData()
  form.append('file', file)
  form.append('kind', 'file')
  try {
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
    const body = (await res.json().catch(() => ({}))) as { key?: string; error?: { message?: string } }
    if (res.ok && body.key) return { ref: body.key }
    return { error: body.error?.message ?? 'Upload failed.' }
  } catch {
    return { error: 'Network error during upload.' }
  }
}
